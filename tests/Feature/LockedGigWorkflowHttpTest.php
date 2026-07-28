<?php

use App\Actions\Agreement\AcceptGigAgreement;
use App\Actions\Agreement\SubmitGigAgreementTerms;
use App\Actions\Dispute\OpenGigDispute;
use App\Actions\Dispute\SubmitGigDisputeCounterproof;
use App\Actions\Gig\AcceptGigOffer;
use App\Actions\Payment\MarkGigPaymentPaid;
use App\Enums\GigDisputeFinding;
use App\Enums\GigDisputeStatus;
use App\Enums\GigDisputeType;
use App\Enums\GigExitType;
use App\Enums\GigSettlementOutcome;
use App\Enums\UserRole;
use App\Models\Gig;
use App\Models\GigDispute;
use App\Models\GigOffer;
use App\Models\GigPayment;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

function lockedGigHttpWorkflow(): array
{
    $client = User::factory()->client()->create(['onboarding_step' => null]);
    $freelancer = User::factory()->freelancer()->create(['onboarding_step' => null]);
    $gig = Gig::factory()->for($client, 'client')->create();
    $offer = GigOffer::factory()->for($gig)->for($freelancer, 'freelancer')->create();
    app(AcceptGigOffer::class)->execute($client, $offer);
    app(SubmitGigAgreementTerms::class)->execute($client, $gig, [
        'final_scope' => 'Scope lengkap',
        'work_date' => now()->addDay()->toDateString(),
        'start_time' => '10:00',
        'location_arrangement' => 'Lokasi kerja',
        'delivery_expectations' => 'Selesai',
        'final_total_price' => 100_000,
    ]);
    app(AcceptGigAgreement::class)->execute($freelancer, $gig);
    $payment = GigPayment::query()->where('gig_id', $gig->id)->sole();
    app(MarkGigPaymentPaid::class)->execute($payment, $payment->local_reference, $payment->amount, now());

    return [$client, $freelancer, $gig];
}

test('workflow page returns participant-safe data and only current capabilities', function () {
    [$client, $freelancer, $gig] = lockedGigHttpWorkflow();

    $this->actingAs($client)
        ->get(route('app.gigs.workflow.show', $gig))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('app/gigs/workflow')
            ->where('participants.client.id', $client->id)
            ->where('participants.freelancer.id', $freelancer->id)
            ->where('capabilities.canStart', true)
            ->where('capabilities.canRequestClientCancellation', true)
            ->where('capabilities.canRequestFreelancerAbandonment', false)
            ->where('capabilities.canReportNoShow', false)
            ->missing('participants.client.email')
            ->missing('participants.freelancer.email'));

    $this->actingAs($freelancer)
        ->get(route('app.gigs.workflow.show', $gig))
        ->assertInertia(fn (Assert $page) => $page
            ->where('capabilities.canStart', false)
            ->where('capabilities.canRequestClientCancellation', false)
            ->where('capabilities.canRequestFreelancerAbandonment', true)
            ->where('capabilities.canReportStartBlocked', false));
});

test('exit HTTP transitions update capabilities and reject unrelated users', function () {
    [$client, $freelancer, $gig] = lockedGigHttpWorkflow();
    $unrelated = User::factory()->freelancer()->create(['onboarding_step' => null]);

    $this->actingAs($unrelated)
        ->get(route('app.gigs.workflow.show', $gig))
        ->assertNotFound();

    $this->actingAs($client)
        ->post(route('app.gigs.exit-requests.store', $gig), ['type' => GigExitType::ClientCancellation->value, 'reason' => 'Perlu dibatalkan'])
        ->assertRedirect()
        ->assertSessionHas('success', 'Permintaan keluar dikirim.');

    $request = $gig->exitRequests()->sole();

    $this->actingAs($client)
        ->get(route('app.gigs.workflow.show', $gig))
        ->assertInertia(fn (Assert $page) => $page
            ->where('capabilities.canStart', false)
            ->where('capabilities.canRespondToExitRequest', false)
            ->where('capabilities.canWithdrawExitRequest', true)
            ->where('capabilities.canProceedUnilaterally', true));

    $this->actingAs($freelancer)
        ->get(route('app.gigs.workflow.show', $gig))
        ->assertInertia(fn (Assert $page) => $page
            ->where('capabilities.canRespondToExitRequest', true)
            ->where('capabilities.canWithdrawExitRequest', false));

    $this->actingAs($unrelated)
        ->patch(route('app.gig-exit-requests.withdraw', $request))
        ->assertNotFound();
});

test('dispute evidence stays private and the respondent sees the counterproof capability', function () {
    [$client, $freelancer, $gig] = lockedGigHttpWorkflow();
    $gig->currentAgreement->update(['work_date' => now()->subDay()->toDateString(), 'start_time' => '10:00']);
    Storage::fake('cos-private');
    $dispute = app(OpenGigDispute::class)->execute($client, $gig, GigDisputeType::NoShow, 'Tidak hadir.', [UploadedFile::fake()->image('report.jpg')]);
    $media = $dispute->submissions()->firstOrFail()->media()->firstOrFail();
    $unrelated = User::factory()->freelancer()->create(['onboarding_step' => null]);

    $this->actingAs($unrelated)
        ->get(route('app.gig_disputes.show', $dispute))
        ->assertNotFound();

    $this->actingAs($unrelated)
        ->get(route('app.gig_dispute_media.show', $media))
        ->assertNotFound();

    $this->actingAs($freelancer)
        ->get(route('app.gig_disputes.show', $dispute))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('app/gigs/dispute')
            ->where('capabilities.canSubmitCounterproof', true)
            ->where('capabilities.counterproofExpired', false)
            ->has('dispute.submissions.0.media.0.url'));
});

test('workflow validation occurs before an exit action is invoked', function () {
    [$client, , $gig] = lockedGigHttpWorkflow();

    $this->actingAs($client)
        ->post(route('app.gigs.exit-requests.store', $gig), ['type' => 'invalid', 'reason' => ''])
        ->assertRedirect()
        ->assertSessionHasErrors(['type', 'reason']);
});

test('admin may resolve worker fault when a stale inconclusive outcome is submitted', function () {
    [$client, $freelancer, $gig] = lockedGigHttpWorkflow();
    $gig->currentAgreement->update(['work_date' => now()->subDay()->toDateString(), 'start_time' => '10:00']);
    Storage::fake('cos-private');
    $dispute = app(OpenGigDispute::class)->execute($client, $gig, GigDisputeType::NoShow, 'Tidak hadir.', [UploadedFile::fake()->image('report.jpg')]);
    app(SubmitGigDisputeCounterproof::class)->execute($freelancer, $dispute, 'Saya hadir.', [UploadedFile::fake()->image('counter.jpg')]);
    $admin = User::factory()->create(['role' => UserRole::Admin, 'onboarding_step' => null]);

    $this->actingAs($admin)
        ->patch(route('app.admin.gig_disputes.resolve', $dispute), [
            'finding' => GigDisputeFinding::FreelancerAtFault->value,
            'inconclusive_outcome' => GigSettlementOutcome::FullClientRefund->value,
            'resolution_note' => 'Pekerja terbukti tidak hadir.',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success', 'Sengketa diselesaikan.');

    expect($dispute->refresh()->finding)->toBe(GigDisputeFinding::FreelancerAtFault)
        ->and($gig->refresh()->settlement->outcome)->toBe(GigSettlementOutcome::FullClientRefund);
});

test('admin queue includes resolved dispute history by default', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin, 'onboarding_step' => null]);
    $activePayment = GigPayment::factory()->paid()->create();
    $active = GigDispute::factory()->create([
        'gig_id' => $activePayment->gig_id,
        'gig_agreement_id' => $activePayment->gig_agreement_id,
        'gig_payment_id' => $activePayment->id,
    ]);
    $resolvedPayment = GigPayment::factory()->paid()->create();
    $resolved = GigDispute::factory()->create([
        'gig_id' => $resolvedPayment->gig_id,
        'gig_agreement_id' => $resolvedPayment->gig_agreement_id,
        'gig_payment_id' => $resolvedPayment->id,
        'status' => GigDisputeStatus::Resolved,
        'resolved_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get(route('app.admin.gig_disputes.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('app/admin/gig-disputes/index')
            ->has('disputes.data', 2)
            ->where('disputes.data.0.id', $active->id)
            ->where('disputes.data.1.id', $resolved->id));
});
