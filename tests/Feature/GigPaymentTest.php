<?php

use App\Actions\Agreement\AcceptGigAgreement;
use App\Actions\Gig\AcceptGigOffer;
use App\Actions\Gig\ApplyToGig;
use App\Actions\Gig\CancelGig;
use App\Actions\Payment\ExpireGigPayment;
use App\Actions\Payment\MarkGigPaymentPaid;
use App\Actions\Agreement\RequestGigAgreementChanges;
use App\Actions\Agreement\SubmitGigAgreementTerms;
use App\Enums\GigAgreementClosureReason;
use App\Enums\GigOfferStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigStatus;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\Payments\PaymentGateway;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use function Pest\Laravel\mock;

uses(LazilyRefreshDatabase::class);

beforeEach(function () {
    mock(NotificationService::class)
        ->shouldReceive('send')
        ->zeroOrMoreTimes()
        ->shouldReceive('unreadCount')
        ->zeroOrMoreTimes()
        ->andReturn(0);
});

function paymentTerms(): array
{
    return [
        'final_scope' => 'Selesaikan seluruh pekerjaan sesuai foto gig.',
        'work_date' => now(config('app.timezone'))->addDay()->toDateString(),
        'start_time' => '10:00',
        'location_arrangement' => 'Temui klien di alamat gig.',
        'delivery_expectations' => 'Pekerjaan selesai dan diuji.',
        'final_total_price' => 275_000,
    ];
}

function paymentAgreementWorkflow(bool $acceptAgreement = true): array
{
    $client = User::factory()->client()->create(['onboarding_step' => null]);
    $freelancer = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $gig = Gig::factory()->for($client, 'client')->create();
    $offer = GigOffer::factory()
        ->for($gig)
        ->for($freelancer, 'freelancer')
        ->create(['offered_fee' => 250_000]);

    app(AcceptGigOffer::class)->execute($client, $offer);
    app(SubmitGigAgreementTerms::class)->execute($client, $gig, paymentTerms());
    $agreement = GigAgreement::query()->where('gig_id', $gig->id)->firstOrFail();

    if (! $acceptAgreement) {
        return [$client, $freelancer, $gig, $offer, $agreement, null];
    }

    app(AcceptGigAgreement::class)->execute($freelancer, $gig);

    return [
        $client,
        $freelancer,
        $gig,
        $offer,
        $agreement,
        GigPayment::query()->where('gig_id', $gig->id)->firstOrFail(),
    ];
}

test('agreement acceptance creates one prepared pending payment snapshot', function () {
    [, , $gig, , $agreement, $payment] = paymentAgreementWorkflow();

    expect($gig->refresh()->status)->toBe(GigStatus::PaymentPending)
        ->and($agreement->refresh()->freelancer_confirmed_at)->not->toBeNull()
        ->and($agreement->payment->id)->toBe($payment->id)
        ->and($gig->currentPayment->id)->toBe($payment->id)
        ->and($payment->amount)->toBe(275_000)
        ->and($payment->currency)->toBe('IDR')
        ->and($payment->status)->toBe(GigPaymentStatus::Pending)
        ->and($payment->provider)->toBe('mock')
        ->and($payment->provider_reference)->toBe('mock-'.$payment->local_reference)
        ->and($payment->checkout_url)->toBe(route('app.gigs.payment.mock.show', $gig))
        ->and($payment->created_at->diffInHours($payment->expires_at))->toBe(3.0)
        ->and(GigPayment::query()->where('gig_agreement_id', $agreement->id)->count())->toBe(1);
});

test('payment factory creates consistent relationships and lifecycle casts', function () {
    $payment = GigPayment::factory()->paid()->create();

    expect($payment->amount)->toBeInt()
        ->and($payment->status)->toBe(GigPaymentStatus::Paid)
        ->and($payment->agreement->gig_id)->toBe($payment->gig_id)
        ->and($payment->agreement->final_total_price)->toBe($payment->amount)
        ->and($payment->agreement->acceptedOffer->status)->toBe(GigOfferStatus::ACCEPTED)
        ->and($payment->paid_at)->not->toBeNull();
});

test('payment status capabilities only expose valid controls for each participant and state', function () {
    [$client, $freelancer, $gig, , , $payment] = paymentAgreementWorkflow();

    $this->actingAs($client)
        ->get(route('app.gigs.payment.show', $gig))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('app/gigs/payment')
            ->where('payment.capabilities.can_open_checkout', true)
            ->where('payment.capabilities.can_retry_checkout', false)
            ->where('payment.capabilities.can_complete_mock_payment', true)
            ->where('payment.capabilities.can_cancel', true));

    $this->actingAs($freelancer)
        ->get(route('app.gigs.payment.show', $gig))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('payment.capabilities.can_open_checkout', false)
            ->where('payment.capabilities.can_retry_checkout', false)
            ->where('payment.capabilities.can_complete_mock_payment', false)
            ->where('payment.capabilities.can_cancel', false));

    $payment->checkout_url = null;
    $payment->provider_reference = null;
    $payment->save();

    $this->actingAs($client)
        ->get(route('app.gigs.payment.show', $gig))
        ->assertInertia(fn (Assert $page) => $page
            ->where('payment.capabilities.can_open_checkout', false)
            ->where('payment.capabilities.can_retry_checkout', true)
            ->where('payment.capabilities.can_complete_mock_payment', false)
            ->where('payment.capabilities.can_cancel', true));

    $this->actingAs($client)
        ->post(route('app.gigs.payment.checkout.retry', $gig))
        ->assertRedirect()
        ->assertSessionHas('success', 'Checkout demo berhasil disiapkan.');

    expect($payment->refresh()->checkout_url)->toBe(route('app.gigs.payment.mock.show', $gig));

    config(['payments.default' => 'xendit']);
    $this->actingAs($client)
        ->get(route('app.gigs.payment.mock.show', $gig))
        ->assertInertia(fn (Assert $page) => $page
            ->where('payment.capabilities.can_complete_mock_payment', false));
});

test('mock checkout is client-only and success locks the gig', function () {
    [$client, $freelancer, $gig, , , $payment] = paymentAgreementWorkflow();

    $this->actingAs($freelancer)
        ->get(route('app.gigs.payment.mock.show', $gig))
        ->assertNotFound();

    $this->actingAs($client)
        ->get(route('app.gigs.payment.mock.show', $gig))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('app/gigs/mock-payment')
            ->where('payment.capabilities.can_complete_mock_payment', true));

    $this->actingAs($client)
        ->post(route('app.gigs.payment.mock.complete', $gig))
        ->assertRedirect(route('app.gigs.workflow.show', $gig))
        ->assertSessionHas('success', 'Pembayaran demo berhasil dikonfirmasi.');

    expect($payment->refresh()->status)->toBe(GigPaymentStatus::Paid)
        ->and($payment->paid_at)->not->toBeNull()
        ->and($gig->refresh()->status)->toBe(GigStatus::Locked);

    $this->actingAs($client)
        ->get(route('app.gigs.payment.show', $gig))
        ->assertInertia(fn (Assert $page) => $page
            ->where('payment.capabilities.can_open_checkout', false)
            ->where('payment.capabilities.can_retry_checkout', false)
            ->where('payment.capabilities.can_complete_mock_payment', false)
            ->where('payment.capabilities.can_cancel', false));
});

test('payment confirmation is idempotent and rejects conflicting or expired confirmation', function () {
    [$client, , $gig, , , $payment] = paymentAgreementWorkflow();

    $first = app(MarkGigPaymentPaid::class)->execute(
        $payment,
        $payment->local_reference,
        $payment->amount,
        now(),
    );
    $second = app(MarkGigPaymentPaid::class)->execute(
        $payment,
        $payment->local_reference,
        $payment->amount,
        now(),
    );

    expect($first->id)->toBe($second->id)
        ->and($gig->refresh()->status)->toBe(GigStatus::Locked)
        ->and(fn () => app(CancelGig::class)->execute($client, $gig))->toThrow(DomainException::class)
        ->and(fn () => app(ExpireGigPayment::class)->execute($payment))->toThrow(DomainException::class)
        ->and(fn () => app(MarkGigPaymentPaid::class)->execute(
            $payment,
            'wrong-reference',
            $payment->amount,
            now(),
        ))->toThrow(DomainException::class);

    [, , , , , $pendingPayment] = paymentAgreementWorkflow();
    expect(fn () => app(MarkGigPaymentPaid::class)->execute(
        $pendingPayment,
        $pendingPayment->local_reference,
        $pendingPayment->amount + 1,
        now(),
    ))->toThrow(DomainException::class);

    $pendingPayment->expires_at = now()->subSecond();
    $pendingPayment->save();
    expect(fn () => app(MarkGigPaymentPaid::class)->execute(
        $pendingPayment,
        $pendingPayment->local_reference,
        $pendingPayment->amount,
        now(),
    ))->toThrow(DomainException::class);
});

test('cancellation closes pending payment and agreement while releasing freelancer', function () {
    [$client, $freelancer, $gig, $offer, $agreement, $payment] = paymentAgreementWorkflow();

    app(CancelGig::class)->execute($client, $gig);

    expect($gig->refresh()->status)->toBe(GigStatus::Cancelled)
        ->and($payment->refresh()->status)->toBe(GigPaymentStatus::Cancelled)
        ->and($payment->cancelled_at)->not->toBeNull()
        ->and($agreement->refresh()->closure_reason)->toBe(GigAgreementClosureReason::GigCancelled)
        ->and($offer->refresh()->status)->toBe(GigOfferStatus::ACCEPTED);

    $newGig = Gig::factory()->for($client, 'client')->create();
    expect(app(ApplyToGig::class)->execute($freelancer, $newGig, null, null)->status)
        ->toBe(GigOfferStatus::PENDING)
        ->and(fn () => app(MarkGigPaymentPaid::class)->execute(
            $payment,
            $payment->local_reference,
            $payment->amount,
            now(),
        ))->toThrow(DomainException::class);
});

test('expiry command path expires payments in deadline order and prevents late success', function () {
    [, , $firstGig, , $firstAgreement, $firstPayment] = paymentAgreementWorkflow();
    [, , $secondGig, , $secondAgreement, $secondPayment] = paymentAgreementWorkflow();
    $firstPayment->update(['expires_at' => now()->subMinutes(2)]);
    $secondPayment->update(['expires_at' => now()->subMinute()]);

    $this->artisan('gig-payments:expire')->assertSuccessful();

    expect($firstPayment->refresh()->status)->toBe(GigPaymentStatus::Expired)
        ->and($secondPayment->refresh()->status)->toBe(GigPaymentStatus::Expired)
        ->and($firstGig->refresh()->status)->toBe(GigStatus::Cancelled)
        ->and($secondGig->refresh()->status)->toBe(GigStatus::Cancelled)
        ->and($firstAgreement->refresh()->closed_at)->not->toBeNull()
        ->and($secondAgreement->refresh()->closed_at)->not->toBeNull()
        ->and(fn () => app(MarkGigPaymentPaid::class)->execute(
            $firstPayment,
            $firstPayment->local_reference,
            $firstPayment->amount,
            now(),
        ))->toThrow(DomainException::class);
});

test('checkout and notification failures preserve committed payment transitions', function () {
    $gateway = mock(PaymentGateway::class);
    $gateway->shouldReceive('createCheckout')->once()->andThrow(new \RuntimeException('Gateway unavailable'));
    $this->app->instance(PaymentGateway::class, $gateway);

    [, , $gig, , $agreement] = paymentAgreementWorkflow(acceptAgreement: false);
    app(AcceptGigAgreement::class)->execute($agreement->acceptedOffer->freelancer, $gig);
    $payment = GigPayment::query()->where('gig_id', $gig->id)->firstOrFail();

    expect($gig->refresh()->status)->toBe(GigStatus::PaymentPending)
        ->and($agreement->refresh()->freelancer_confirmed_at)->not->toBeNull()
        ->and($payment->status)->toBe(GigPaymentStatus::Pending)
        ->and($payment->checkout_url)->toBeNull();

    mock(NotificationService::class)->shouldReceive('send')->once()->andThrow(new \RuntimeException('Notification failed'));
    app(MarkGigPaymentPaid::class)->execute(
        $payment,
        $payment->local_reference,
        $payment->amount,
        now(),
    );

    expect($payment->refresh()->status)->toBe(GigPaymentStatus::Paid)
        ->and($gig->refresh()->status)->toBe(GigStatus::Locked);
});

test('change request exposes only preparation controls and allows leaving', function () {
    [$client, $freelancer, $gig] = paymentAgreementWorkflow(acceptAgreement: false);
    app(RequestGigAgreementChanges::class)->execute($freelancer, $gig, 'Ubah waktu mulai.');

    $this->actingAs($freelancer)
        ->get(route('app.gigs.agreement.show', $gig))
        ->assertInertia(fn (Assert $page) => $page
            ->where('capabilities.can_accept', false)
            ->where('capabilities.can_decline', false)
            ->where('capabilities.can_request_changes', false)
            ->where('capabilities.can_leave', true));

    $this->actingAs($freelancer)
        ->patch(route('app.gigs.agreement.leave', $gig))
        ->assertRedirect();

    expect($gig->refresh()->status)->toBe(GigStatus::Open);
});

test('payment workflow notifications include payment destination and label', function () {
    [$client, $freelancer, $gig, , $agreement] = paymentAgreementWorkflow(acceptAgreement: false);
    $notifications = [];
    mock(NotificationService::class)
        ->shouldReceive('send')
        ->once()
        ->andReturnUsing(function (...$arguments) use (&$notifications): void {
            $notifications[] = $arguments;
        });

    app(AcceptGigAgreement::class)->execute($freelancer, $gig);

    expect($notifications[0][4])->toBe([$client->id])
        ->and($notifications[0][6])->toBe(route('app.gigs.payment.show', $gig))
        ->and($notifications[0][7])->toBe('Lihat Pembayaran');

    $payment = $agreement->payment()->firstOrFail();
    $notifications = [];
    mock(NotificationService::class)
        ->shouldReceive('send')
        ->once()
        ->andReturnUsing(function (...$arguments) use (&$notifications): void {
            $notifications[] = $arguments;
        });

    app(MarkGigPaymentPaid::class)->execute(
        $payment,
        $payment->local_reference,
        $payment->amount,
        now(),
    );

    expect($notifications[0][4])->toBe([$freelancer->id])
        ->and($notifications[0][6])->toBe(route('app.gigs.payment.show', $gig))
        ->and($notifications[0][7])->toBe('Lihat Pembayaran');

    mock(NotificationService::class)->shouldReceive('send')->zeroOrMoreTimes();
    [$cancellingClient, , $cancelledGig, , , $cancelledPayment] = paymentAgreementWorkflow();
    $notifications = [];
    mock(NotificationService::class)
        ->shouldReceive('send')
        ->once()
        ->andReturnUsing(function (...$arguments) use (&$notifications): void {
            $notifications[] = $arguments;
        });

    app(CancelGig::class)->execute($cancellingClient, $cancelledGig);

    expect($cancelledPayment->refresh()->status)->toBe(GigPaymentStatus::Cancelled)
        ->and($notifications[0][6])->toBe(route('app.gigs.payment.show', $cancelledGig))
        ->and($notifications[0][7])->toBe('Lihat Pembayaran');

    mock(NotificationService::class)->shouldReceive('send')->zeroOrMoreTimes();
    [, , $expiredGig, , , $expiredPayment] = paymentAgreementWorkflow();
    $expiredPayment->update(['expires_at' => now()->subMinute()]);
    $notifications = [];
    mock(NotificationService::class)
        ->shouldReceive('send')
        ->twice()
        ->andReturnUsing(function (...$arguments) use (&$notifications): void {
            $notifications[] = $arguments;
        });

    app(ExpireGigPayment::class)->execute($expiredPayment);

    expect($notifications)->toHaveCount(2)
        ->and(collect($notifications)->pluck(6)->unique()->all())->toBe([
            route('app.gigs.payment.show', $expiredGig),
        ])
        ->and(collect($notifications)->pluck(7)->unique()->all())->toBe(['Lihat Pembayaran']);
});
