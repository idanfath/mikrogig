<?php

namespace App\Http\Controllers;

use App\Actions\Agreement\AcceptGigAgreement;
use App\Actions\Agreement\DeclineGigAgreement;
use App\Actions\Agreement\LeaveGigAgreementPreparation;
use App\Actions\Agreement\RequestGigAgreementChanges;
use App\Actions\Agreement\SubmitGigAgreementTerms;
use App\Actions\Gig\RejectSelectedFreelancer;
use App\Enums\GigStatus;
use App\Http\Requests\RequestGigAgreementChangesRequest;
use App\Http\Requests\SubmitGigAgreementTermsRequest;
use App\Http\Resources\GigAgreementResource;
use App\Http\Resources\GigResource;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Services\GigConversationService;
use App\Services\WageBenchmarkService;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GigAgreementController extends Controller
{
    public function show(
        Request $request,
        Gig $gig,
        GigConversationService $conversations,
        WageBenchmarkService $wageBenchmark,
    ): Response {
        $agreement = $this->currentAgreement($gig);
        $this->authorize('view', $agreement);
        $isClient = $request->user()->id === $gig->client_id;
        $isSelectedFreelancer = $request->user()->id === $agreement->acceptedOffer->freelancer_id;
        $canRespond = $isSelectedFreelancer
            && $gig->status === GigStatus::LockPending
            && $agreement->submitted_at !== null
            && $agreement->freelancer_confirmed_at === null;

        return Inertia::render('app/gigs/agreement', [
            'gig' => GigResource::make($gig->load(['client', 'media']))->resolve($request),
            'agreement' => GigAgreementResource::make($agreement)->resolve($request),
            'is_client' => $isClient,
            'is_selected_freelancer' => $isSelectedFreelancer,
            'conversation' => fn (): array => $conversations->present($request, $agreement),
            'wage_benchmark_context' => $wageBenchmark->context([$gig->province_id]),
            'capabilities' => [
                'can_submit_terms' => $isClient && $gig->status === GigStatus::AgreementPreparation,
                'can_accept' => $canRespond,
                'can_request_changes' => $canRespond,
                'can_decline' => $canRespond,
                'can_leave' => $isSelectedFreelancer && $gig->status === GigStatus::AgreementPreparation,
                'can_reject' => $isClient && in_array($gig->status, [
                    GigStatus::AgreementPreparation,
                    GigStatus::LockPending,
                ], true),
            ],
        ]);
    }

    public function submit(SubmitGigAgreementTermsRequest $request, Gig $gig, SubmitGigAgreementTerms $submitTerms): RedirectResponse
    {
        return $this->execute(fn () => $submitTerms->execute($request->user(), $gig, $request->validated()), 'Syarat gig berhasil dikirim.');
    }

    public function accept(Request $request, Gig $gig, AcceptGigAgreement $acceptAgreement): RedirectResponse
    {
        $this->authorize('respond', $this->currentAgreement($gig));

        return $this->execute(
            fn () => $acceptAgreement->execute($request->user(), $gig),
            'Syarat gig berhasil disetujui.',
            toRoute: route('app.gigs.payment.show', $gig)
        );
    }

    public function requestChanges(RequestGigAgreementChangesRequest $request, Gig $gig, RequestGigAgreementChanges $requestChanges): RedirectResponse
    {
        return $this->execute(fn () => $requestChanges->execute($request->user(), $gig, $request->validated('note')), 'Permintaan perubahan berhasil dikirim.');
    }

    public function decline(Request $request, Gig $gig, DeclineGigAgreement $declineAgreement): RedirectResponse
    {
        $this->authorize('respond', $this->currentAgreement($gig));

        return $this->execute(
            fn () => $declineAgreement->execute($request->user(), $gig),
            'Persetujuan ditolak dan gig dibuka kembali.',
            toRoute: route('app.gigs.show', $gig)
        );
    }

    public function leave(Request $request, Gig $gig, LeaveGigAgreementPreparation $leaveAgreement): RedirectResponse
    {
        $this->authorize('respond', $this->currentAgreement($gig));

        return $this->execute(
            fn () => $leaveAgreement->execute($request->user(), $gig),
            'Persiapan persetujuan ditinggalkan dan gig dibuka kembali.',
            toRoute: route('app.gigs.show', $gig)
        );
    }

    public function reject(Request $request, Gig $gig, RejectSelectedFreelancer $rejectFreelancer): RedirectResponse
    {
        $this->authorize('rejectSelected', $this->currentAgreement($gig));

        return $this->execute(
            fn () => $rejectFreelancer->execute($request->user(), $gig),
            'Freelancer ditolak dan gig dibuka kembali.',
            toRoute: route('app.gigs.show', $gig)
        );
    }

    private function currentAgreement(Gig $gig): GigAgreement
    {
        return $gig->currentAgreement()->with(['gig', 'acceptedOffer'])->first()
            ?? $gig->agreements()->with(['gig', 'acceptedOffer'])->latest('id')->firstOrFail();
    }

    private function execute(callable $transition, string $message, ?string $toRoute = null): RedirectResponse
    {
        try {
            $transition();
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        if ($toRoute !== null) {
            return redirect($toRoute)->with('success', $message);
        }

        return back()->with('success', $message);
    }
}
