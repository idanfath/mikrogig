<?php

namespace App\Http\Controllers;

use App\Actions\Dispute\OpenGigDispute;
use App\Actions\Workflow\ProceedWithLockedGigExit;
use App\Actions\Workflow\RequestLockedGigExit;
use App\Actions\Workflow\RespondToLockedGigExit;
use App\Actions\Workflow\StartGig;
use App\Actions\Workflow\WithdrawLockedGigExit;
use App\Enums\GigDisputeType;
use App\Enums\GigExitDecision;
use App\Enums\GigExitStatus;
use App\Enums\GigExitType;
use App\Enums\GigFinishRequestStatus;
use App\Enums\GigPaymentStatus;
use App\Enums\GigStatus;
use App\Http\Requests\RespondGigExitRequest;
use App\Http\Requests\StoreGigDisputeRequest;
use App\Http\Requests\StoreGigExitRequest;
use App\Http\Resources\GigDisputeResource;
use App\Http\Resources\GigExitRequestResource;
use App\Http\Resources\GigFinishRequestResource;
use App\Http\Resources\GigPaymentResource;
use App\Http\Resources\GigResource;
use App\Http\Resources\GigSettlementResource;
use App\Models\Gig;
use App\Models\GigExitRequest;
use App\Services\GigConversationService;
use Carbon\CarbonImmutable;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GigWorkflowController extends Controller
{
    public function show(Request $request, Gig $gig, GigConversationService $conversations): Response
    {
        $gig->load('client');
        $payment = $gig->currentPayment()->with(['gig', 'agreement.acceptedOffer.freelancer'])->firstOrFail();
        $this->authorize('view', $payment);

        $user = $request->user();
        $isClient = $user->id === $gig->client_id;
        $isFreelancer = $user->id === $payment->agreement->acceptedOffer->freelancer_id;
        $activeExit = $gig->exitRequests()->active()->latest()->first();
        $latestFinishRequest = $gig->finishRequests()->with('media')->latest('id')->first();
        $isLocked = $gig->status === GigStatus::Locked;
        $isInProgress = $gig->status === GigStatus::InProgress;
        $isReview = $gig->status === GigStatus::Review;
        $hasNoActiveWorkflow = $activeExit === null && ! $gig->dispute()->exists() && ! $gig->settlement()->exists();
        $isPaidAndConfirmed = $payment->status === GigPaymentStatus::Paid && $payment->agreement->freelancer_confirmed_at !== null;
        $finishReviewOpen = $latestFinishRequest?->status === GigFinishRequestStatus::Pending
            && $latestFinishRequest->review_due_at->isFuture();
        $scheduledAt = CarbonImmutable::parse($payment->agreement->work_date->toDateString().' '.$payment->agreement->start_time, config('app.timezone'));
        $reportsAvailable = now(config('app.timezone'))->greaterThanOrEqualTo($scheduledAt);

        return Inertia::render('app/gigs/workflow', [
            'gig' => GigResource::make($gig->load('client'))->resolve($request),
            'payment' => GigPaymentResource::make($payment)->resolve($request),
            'agreement' => [
                'work_date' => $payment->agreement->work_date->toDateString(),
                'start_time' => $payment->agreement->start_time,
                'scheduled_at' => $scheduledAt->toISOString(),
                'final_total_price' => $payment->agreement->final_total_price,
            ],
            'participants' => [
                'client' => [
                    'id' => $gig->client->id,
                    'name' => $gig->client->name,
                    'avatar_url' => $gig->client->avatar_url,
                    'location' => $gig->client->location,
                ],
                'freelancer' => [
                    'id' => $payment->agreement->acceptedOffer->freelancer->id,
                    'name' => $payment->agreement->acceptedOffer->freelancer->name,
                    'avatar_url' => $payment->agreement->acceptedOffer->freelancer->avatar_url,
                    'location' => $payment->agreement->acceptedOffer->freelancer->location,
                ],
            ],
            'exit_request' => $activeExit === null ? null : GigExitRequestResource::make($activeExit)->resolve($request),
            'finish_request' => $latestFinishRequest === null ? null : GigFinishRequestResource::make($latestFinishRequest)->resolve($request),
            'dispute' => $gig->dispute ? GigDisputeResource::make($gig->dispute)->resolve($request) : null,
            'settlement' => $gig->settlement ? GigSettlementResource::make($gig->settlement)->resolve($request) : null,
            'conversation' => fn (): array => $conversations->present($request, $payment->agreement),
            'server_now' => now()->toISOString(),
            'capabilities' => [
                'canStart' => $isClient && $isLocked && $isPaidAndConfirmed && $hasNoActiveWorkflow,
                'canRequestClientCancellation' => $isClient && $isLocked && $isPaidAndConfirmed && $hasNoActiveWorkflow,
                'canRequestFreelancerAbandonment' => $isFreelancer && $isLocked && $isPaidAndConfirmed && $hasNoActiveWorkflow,
                'canRespondToExitRequest' => $activeExit?->status === GigExitStatus::Pending && $activeExit->responder_id === $user->id,
                'canWithdrawExitRequest' => $activeExit !== null && $activeExit->requester_id === $user->id,
                'canProceedUnilaterally' => $activeExit !== null && $activeExit->requester_id === $user->id,
                'canReportNoShow' => $isClient && $isLocked && $isPaidAndConfirmed && $hasNoActiveWorkflow && $reportsAvailable,
                'canReportStartBlocked' => $isFreelancer && $isLocked && $isPaidAndConfirmed && $hasNoActiveWorkflow && $reportsAvailable,
                'canSubmitFinishRequest' => $isFreelancer && $isInProgress && $isPaidAndConfirmed && $hasNoActiveWorkflow,
                'canAcceptFinishRequest' => $isClient && $isReview && $finishReviewOpen && $hasNoActiveWorkflow,
                'canRejectFinishRequest' => $isClient && $isReview && $finishReviewOpen && $hasNoActiveWorkflow,
                'canReportWorkObstruction' => $isFreelancer && $isInProgress && $isPaidAndConfirmed && $hasNoActiveWorkflow,
                'canDisputeFinishRejection' => $isFreelancer
                    && $isInProgress
                    && $isPaidAndConfirmed
                    && $hasNoActiveWorkflow
                    && $latestFinishRequest?->status === GigFinishRequestStatus::Rejected,
                'finishReviewExpired' => $isReview
                    && $latestFinishRequest?->status === GigFinishRequestStatus::Pending
                    && ! $latestFinishRequest->review_due_at->isFuture(),
            ],
        ]);
    }

    public function start(Request $request, Gig $gig, StartGig $action): RedirectResponse
    {
        $this->authorize('workflow', $gig);
        try {
            $action->execute($request->user(), $gig);
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Pekerjaan dimulai.');
    }

    public function storeExit(StoreGigExitRequest $request, Gig $gig, RequestLockedGigExit $action): RedirectResponse
    {
        $d = $request->validated();
        try {
            $action->execute($request->user(), $gig, GigExitType::from($d['type']), $d['reason']);
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Permintaan keluar dikirim.');
    }

    public function respond(RespondGigExitRequest $request, GigExitRequest $gigExitRequest, RespondToLockedGigExit $action): RedirectResponse
    {
        $this->authorize('respond', $gigExitRequest);
        try {
            $updated = $action->execute($request->user(), $gigExitRequest, GigExitDecision::from($request->validated('decision')));
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        if ($updated->status === GigExitStatus::Executed) {
            return redirect()
                ->route('app.history.show', $updated->gig_id)
                ->with('success', 'Permintaan keluar gig disetujui dan gig dibatalkan.');
        }

        return back()->with('success', 'Respons exit disimpan.');
    }

    public function withdraw(Request $request, GigExitRequest $gigExitRequest, WithdrawLockedGigExit $action): RedirectResponse
    {
        $this->authorize('withdraw', $gigExitRequest);
        try {
            $action->execute($request->user(), $gigExitRequest);
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Permintaan exit ditarik.');
    }

    public function proceed(Request $request, GigExitRequest $gigExitRequest, ProceedWithLockedGigExit $action): RedirectResponse
    {
        $this->authorize('proceed', $gigExitRequest);
        try {
            $action->execute($request->user(), $gigExitRequest);
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()
            ->route('app.history.show', $gigExitRequest->gig_id)
            ->with('success', 'Exit gig dieksekusi.');
    }

    public function dispute(StoreGigDisputeRequest $request, Gig $gig, OpenGigDispute $action): RedirectResponse
    {
        $d = $request->validated();
        try {
            $dispute = $action->execute($request->user(), $gig, GigDisputeType::from($d['type']), $d['statement'], $d['photos'] ?? []);
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('app.gig_disputes.show', $dispute)->with('success', 'Sengketa dibuka.');
    }
}
