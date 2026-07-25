<?php

namespace App\Http\Controllers;

use App\Actions\AcceptGigAgreement;
use App\Actions\DeclineGigAgreement;
use App\Actions\LeaveGigAgreementPreparation;
use App\Actions\RejectSelectedFreelancer;
use App\Actions\RequestGigAgreementChanges;
use App\Actions\SubmitGigAgreementTerms;
use App\Http\Requests\RequestGigAgreementChangesRequest;
use App\Http\Requests\SubmitGigAgreementTermsRequest;
use App\Http\Resources\GigAgreementResource;
use App\Http\Resources\GigResource;
use App\Models\Gig;
use App\Models\GigAgreement;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GigAgreementController extends Controller
{
    public function show(Request $request, Gig $gig): Response
    {
        $agreement = $this->currentAgreement($gig);
        $this->authorize('view', $agreement);

        return Inertia::render('app/gigs/agreement', [
            'gig' => GigResource::make($gig->load(['client', 'media']))->resolve($request),
            'agreement' => GigAgreementResource::make($agreement)->resolve($request),
            'is_client' => $request->user()->id === $gig->client_id,
            'is_selected_freelancer' => $request->user()->id === $agreement->acceptedOffer->freelancer_id,
        ]);
    }

    public function submit(SubmitGigAgreementTermsRequest $request, Gig $gig, SubmitGigAgreementTerms $submitTerms): RedirectResponse
    {
        return $this->execute(fn () => $submitTerms->execute($request->user(), $gig, $request->validated()), 'Syarat gig berhasil dikirim.');
    }

    public function accept(Request $request, Gig $gig, AcceptGigAgreement $acceptAgreement): RedirectResponse
    {
        $this->authorize('respond', $this->currentAgreement($gig));

        return $this->execute(fn () => $acceptAgreement->execute($request->user(), $gig), 'Syarat gig berhasil disetujui.');
    }

    public function requestChanges(RequestGigAgreementChangesRequest $request, Gig $gig, RequestGigAgreementChanges $requestChanges): RedirectResponse
    {
        return $this->execute(fn () => $requestChanges->execute($request->user(), $gig, $request->validated('note')), 'Permintaan perubahan berhasil dikirim.');
    }

    public function decline(Request $request, Gig $gig, DeclineGigAgreement $declineAgreement): RedirectResponse
    {
        $this->authorize('respond', $this->currentAgreement($gig));

        return $this->execute(fn () => $declineAgreement->execute($request->user(), $gig), 'Persetujuan ditolak dan gig dibuka kembali.');
    }

    public function leave(Request $request, Gig $gig, LeaveGigAgreementPreparation $leaveAgreement): RedirectResponse
    {
        $this->authorize('respond', $this->currentAgreement($gig));

        return $this->execute(fn () => $leaveAgreement->execute($request->user(), $gig), 'Persiapan persetujuan ditinggalkan dan gig dibuka kembali.');
    }

    public function reject(Request $request, Gig $gig, RejectSelectedFreelancer $rejectFreelancer): RedirectResponse
    {
        $this->authorize('rejectSelected', $this->currentAgreement($gig));

        return $this->execute(fn () => $rejectFreelancer->execute($request->user(), $gig), 'Freelancer ditolak dan gig dibuka kembali.');
    }

    private function currentAgreement(Gig $gig): GigAgreement
    {
        return $gig->currentAgreement()->with(['gig', 'acceptedOffer'])->first()
            ?? $gig->agreements()->with(['gig', 'acceptedOffer'])->latest('id')->firstOrFail();
    }

    private function execute(callable $transition, string $message): RedirectResponse
    {
        try {
            $transition();
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', $message);
    }
}
