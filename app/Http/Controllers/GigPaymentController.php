<?php

namespace App\Http\Controllers;

use App\Actions\MarkGigPaymentPaid;
use App\Actions\PrepareGigPaymentCheckout;
use App\Http\Resources\GigPaymentResource;
use App\Models\Gig;
use App\Models\GigPayment;
use App\Services\GigConversationService;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class GigPaymentController extends Controller
{
    public function show(Request $request, Gig $gig, GigConversationService $conversations): Response
    {
        $payment = $this->payment($gig);
        $this->authorize('view', $payment);

        return Inertia::render('app/gigs/payment', [
            'gig' => [
                'id' => $gig->id,
                'title' => $gig->title,
                'status' => $gig->status->value,
            ],
            'payment' => GigPaymentResource::make($payment)->resolve($request),
            'is_client' => $request->user()->id === $gig->client_id,
            'conversation' => $conversations->present($request, $payment->agreement),
            'server_now' => now()->toISOString(),
        ]);
    }

    public function retryCheckout(
        Request $request,
        Gig $gig,
        PrepareGigPaymentCheckout $prepareCheckout,
    ): RedirectResponse {
        $payment = $this->payment($gig);
        $this->authorize('checkout', $payment);

        try {
            $prepareCheckout->execute($payment);
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'Checkout demo belum dapat disiapkan. Silakan coba lagi.');
        }

        return back()->with('success', 'Checkout demo berhasil disiapkan.');
    }

    public function mockCheckout(Request $request, Gig $gig): Response
    {
        $payment = $this->payment($gig);
        $this->authorize('checkout', $payment);

        return Inertia::render('app/gigs/mock-payment', [
            'gig' => [
                'id' => $gig->id,
                'title' => $gig->title,
                'status' => $gig->status->value,
            ],
            'payment' => GigPaymentResource::make($payment)->resolve($request),
            'server_now' => now()->toISOString(),
        ]);
    }

    public function completeMock(
        Request $request,
        Gig $gig,
        MarkGigPaymentPaid $markPaymentPaid,
    ): RedirectResponse {
        $payment = $this->payment($gig);
        $this->authorize('checkout', $payment);
        $capabilities = GigPaymentResource::make($payment)->resolve($request)['capabilities'];

        if (! $capabilities['can_complete_mock_payment']) {
            return back()->with('error', 'Pembayaran demo tidak dapat diselesaikan dalam kondisi saat ini.');
        }

        try {
            $markPaymentPaid->execute(
                $payment,
                $payment->local_reference,
                $payment->amount,
                now(),
            );
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('app.gigs.workflow.show', ['gig' => $gig->id])
            ->with('success', 'Pembayaran demo berhasil dikonfirmasi.');
    }

    private function payment(Gig $gig): GigPayment
    {
        return $gig->payments()
            ->with(['gig', 'agreement.acceptedOffer'])
            ->latest('id')
            ->firstOrFail();
    }
}
