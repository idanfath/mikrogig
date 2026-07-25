<?php

namespace App\Http\Controllers;

use App\Actions\OpenLockedGigDispute;
use App\Actions\ProceedWithLockedGigExit;
use App\Actions\RequestLockedGigExit;
use App\Actions\RespondToLockedGigExit;
use App\Actions\StartGig;
use App\Actions\WithdrawLockedGigExit;
use App\Enums\GigDisputeType;
use App\Enums\GigExitDecision;
use App\Enums\GigExitStatus;
use App\Enums\GigExitType;
use App\Enums\GigPaymentStatus;
use App\Enums\GigStatus;
use App\Http\Requests\RespondGigExitRequest;
use App\Http\Requests\StoreGigDisputeRequest;
use App\Http\Requests\StoreGigExitRequest;
use App\Http\Resources\GigExitRequestResource;
use App\Http\Resources\GigPaymentResource;
use App\Http\Resources\GigResource;
use App\Http\Resources\GigSettlementResource;
use App\Models\Gig;
use App\Models\GigExitRequest;
use Carbon\CarbonImmutable;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GigWorkflowController extends Controller
{
    public function show(Request $request, Gig $gig): Response
    {
        $gig->load('client');
        $payment = $gig->currentPayment()->with(['gig', 'agreement.acceptedOffer.freelancer'])->firstOrFail();
        $this->authorize('view', $payment);

        $user = $request->user();
        $isClient = $user->id === $gig->client_id;
        $isFreelancer = $user->id === $payment->agreement->acceptedOffer->freelancer_id;
        $activeExit = $gig->exitRequests()->active()->latest()->first();
        $isLocked = $gig->status === GigStatus::Locked;
        $hasNoActiveWorkflow = $activeExit === null && ! $gig->dispute()->exists() && ! $gig->settlement()->exists();
        $isPaidAndConfirmed = $payment->status === GigPaymentStatus::Paid && $payment->agreement->freelancer_confirmed_at !== null;
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
            'settlement' => $gig->settlement ? GigSettlementResource::make($gig->settlement)->resolve($request) : null,
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
            $action->execute($request->user(), $gigExitRequest, GigExitDecision::from($request->validated('decision')));
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage());
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

        return back()->with('success', 'Exit gig dieksekusi.');
    }

    public function dispute(StoreGigDisputeRequest $request, Gig $gig, OpenLockedGigDispute $action): RedirectResponse
    {
        $d = $request->validated();
        try {
            $action->execute($request->user(), $gig, GigDisputeType::from($d['type']), $d['statement'], $d['photos']);
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Sengketa dibuka.');
    }
}
