<?php

namespace App\Http\Controllers;

use App\Enums\GigStatus;
use App\Enums\UserRole;
use App\Http\Resources\GigDisputeResource;
use App\Http\Resources\GigExitRequestResource;
use App\Http\Resources\GigFinishRequestResource;
use App\Http\Resources\GigResource;
use App\Http\Resources\GigSettlementResource;
use App\Models\Gig;
use App\Models\GigAgreement;
use App\Models\GigPayment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GigHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless(in_array($user->role, [UserRole::Client, UserRole::Freelancer], true), 403);

        $validated = $request->validate([
            'status' => ['nullable', Rule::in([
                'all',
                GigStatus::Completed->value,
                GigStatus::Cancelled->value,
                GigStatus::DisputeResolved->value,
            ])],
        ]);

        $query = Gig::query()
            ->terminal()
            ->with([
                'client:id,name,avatar,province_name,regency_name',
                'acceptedOffer.freelancer:id,name,avatar,province_name,regency_name',
                'settlement',
                'dispute:id,gig_id,resolved_at',
                'ratings:id,gig_id,rater_id,recipient_id,score',
            ]);

        if ($user->role === UserRole::Client) {
            $query->where('client_id', $user->id);
        } else {
            $query->whereHas('acceptedOffer', fn ($offer) => $offer->where('freelancer_id', $user->id));
        }

        $status = $validated['status'] ?? 'all';
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $gigs = $query
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Gig $gig): array => $this->historySummary($gig, $user->id));

        return Inertia::render('app/history/index', [
            'gigs' => $gigs,
            'filters' => ['status' => $status],
        ]);
    }

    public function show(Request $request, Gig $gig): Response
    {
        $this->authorize('viewHistory', $gig);

        $gig->load([
            'client',
            'media',
            'acceptedOffer.freelancer.freelancerProfile',
            'agreements.acceptedOffer',
            'payments',
            'exitRequests.requester',
            'exitRequests.responder',
            'finishRequests.media',
            'settlement',
            'dispute.reporter',
            'dispute.respondent',
            'dispute.resolver',
            'dispute.finishRequest.media',
            'dispute.submissions.media',
            'ratings.rater',
            'ratings.recipient',
        ]);

        $user = $request->user();
        $acceptedFreelancerId = $gig->acceptedOffer?->freelancer_id;
        $hasRated = $gig->ratings->contains('rater_id', $user->id);

        return Inertia::render('app/history/show', [
            'gig' => GigResource::make($gig)->resolve($request),
            'counterpart' => $this->counterpart($gig, $user->id),
            'agreements' => $gig->agreements->map(fn (GigAgreement $agreement): array => [
                'id' => $agreement->id,
                'accepted_fee' => $agreement->accepted_fee,
                'final_scope' => $agreement->final_scope,
                'work_date' => $agreement->work_date?->toDateString(),
                'start_time' => $agreement->start_time === null ? null : substr($agreement->start_time, 0, 5),
                'location_arrangement' => $agreement->location_arrangement,
                'delivery_expectations' => $agreement->delivery_expectations,
                'final_total_price' => $agreement->final_total_price,
                'terms_version' => $agreement->terms_version,
                'submitted_at' => $agreement->submitted_at?->toISOString(),
                'freelancer_confirmed_at' => $agreement->freelancer_confirmed_at?->toISOString(),
                'closed_at' => $agreement->closed_at?->toISOString(),
                'closure_reason' => $agreement->closure_reason?->value,
            ])->values(),
            'payments' => $gig->payments->map(fn (GigPayment $payment): array => [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'status' => $payment->status->value,
                'provider' => $payment->provider,
                'paid_at' => $payment->paid_at?->toISOString(),
                'cancelled_at' => $payment->cancelled_at?->toISOString(),
                'expired_at' => $payment->expired_at?->toISOString(),
            ])->values(),
            'exit_requests' => $gig->exitRequests
                ->map(fn ($exitRequest) => GigExitRequestResource::make($exitRequest)->resolve($request))
                ->values(),
            'finish_requests' => $gig->finishRequests
                ->map(fn ($finishRequest) => GigFinishRequestResource::make($finishRequest)->resolve($request))
                ->values(),
            'settlement' => $gig->settlement === null
                ? null
                : GigSettlementResource::make($gig->settlement)->resolve($request),
            'dispute' => $gig->dispute === null
                ? null
                : GigDisputeResource::make($gig->dispute)->resolve($request),
            'ratings' => $gig->ratings->map(fn ($rating): array => [
                'id' => $rating->id,
                'score' => $rating->score,
                'comment' => $rating->comment,
                'created_at' => $rating->created_at->toISOString(),
                'rater' => [
                    'id' => $rating->rater->id,
                    'name' => $rating->rater->name,
                    'avatar_url' => $rating->rater->avatar_url,
                ],
                'recipient_id' => $rating->recipient_id,
            ])->values(),
            'terminal_at' => $this->terminalAt($gig),
            'capabilities' => [
                'canRate' => $acceptedFreelancerId !== null
                    && in_array($user->id, [$gig->client_id, $acceptedFreelancerId], true)
                    && ! $hasRated
                    && ! $user->activeBan()->exists(),
            ],
        ]);
    }

    private function historySummary(Gig $gig, int $viewerId): array
    {
        return [
            'id' => $gig->id,
            'title' => $gig->title,
            'status' => $gig->status->value,
            'terminal_at' => $this->terminalAt($gig),
            'counterpart' => $this->counterpart($gig, $viewerId),
            'settlement' => $gig->settlement === null
                ? null
                : [
                    'outcome' => $gig->settlement->outcome->value,
                    'freelancer_payout' => $gig->settlement->freelancer_payout,
                    'client_refund' => $gig->settlement->client_refund,
                ],
            'viewer_has_rated' => $gig->ratings->contains('rater_id', $viewerId),
            'counterpart_has_rated' => $gig->ratings->contains(
                'rater_id',
                $viewerId === $gig->client_id
                    ? $gig->acceptedOffer?->freelancer_id
                    : $gig->client_id,
            ),
        ];
    }

    private function counterpart(Gig $gig, int $viewerId): ?array
    {
        $counterpart = $viewerId === $gig->client_id
            ? $gig->acceptedOffer?->freelancer
            : $gig->client;

        return $counterpart === null ? null : [
            'id' => $counterpart->id,
            'name' => $counterpart->name,
            'avatar_url' => $counterpart->avatar_url,
            'location' => $counterpart->location,
        ];
    }

    private function terminalAt(Gig $gig): ?string
    {
        return match ($gig->status) {
            GigStatus::Completed => $gig->completed_at?->toISOString() ?? $gig->updated_at?->toISOString(),
            GigStatus::Cancelled => $gig->cancelled_at?->toISOString() ?? $gig->updated_at?->toISOString(),
            GigStatus::DisputeResolved => $gig->dispute?->resolved_at?->toISOString() ?? $gig->updated_at?->toISOString(),
            default => null,
        };
    }
}
