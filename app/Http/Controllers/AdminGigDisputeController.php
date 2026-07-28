<?php

namespace App\Http\Controllers;

use App\Actions\Dispute\RequestGigDisputeAiOverview;
use App\Actions\Dispute\ResolveGigDispute;
use App\Enums\GigDisputeFinding;
use App\Enums\GigDisputeStatus;
use App\Enums\GigDisputeType;
use App\Enums\GigSettlementOutcome;
use App\Http\Requests\ResolveGigDisputeRequest;
use App\Http\Resources\GigDisputeAiOverviewResource;
use App\Http\Resources\GigDisputeResource;
use App\Http\Resources\GigSettlementResource;
use App\Models\GigDispute;
use App\Services\GigConversationService;
use App\Services\GigDisputeAiOverviewEvidenceService;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminGigDisputeController extends Controller
{
    public function index(Request $r): Response
    {
        $this->authorize('viewAny', GigDispute::class);
        $status = GigDisputeStatus::tryFrom((string) $r->query('status'));
        $type = GigDisputeType::tryFrom((string) $r->query('type'));
        $disputes = GigDispute::query()
            ->with(['gig', 'reporter', 'respondent'])
            ->when($status !== null, fn ($query) => $query->where('status', $status))
            ->when($type !== null, fn ($query) => $query->where('type', $type))
            ->orderByRaw('case when status = ? then 1 else 0 end', [GigDisputeStatus::Resolved->value])
            ->orderByRaw('case when status = ? then null else counterproof_due_at end', [GigDisputeStatus::Resolved->value])
            ->orderByRaw('case when status = ? then null else opened_at end', [GigDisputeStatus::Resolved->value])
            ->orderByDesc('resolved_at')
            ->orderByDesc('id');

        return Inertia::render('app/admin/gig-disputes/index', [
            'disputes' => fn () => GigDisputeResource::collection(
                $disputes->paginate(15)->withQueryString(),
            ),
            'filters' => ['status' => $status?->value, 'type' => $type?->value],
            'server_now' => now()->toISOString(),
        ]);
    }

    public function show(Request $r, GigDispute $dispute, GigConversationService $conversations, GigDisputeAiOverviewEvidenceService $evidence): Response
    {
        $this->authorize('resolve', $dispute);

        $dispute->load(['gig', 'reporter', 'respondent', 'submissions.media', 'finishRequest.media', 'settlement', 'aiOverview']);
        $overview = $dispute->aiOverview;

        return Inertia::render('app/admin/gig-disputes/show', [
            'dispute' => GigDisputeResource::make($dispute)->resolve($r),
            'settlement' => $dispute->settlement === null ? null : GigSettlementResource::make($dispute->settlement)->resolve($r),
            'ai_overview' => fn (): ?array => $overview === null
                ? null
                : (new GigDisputeAiOverviewResource($overview, $evidence->present($overview)))->resolve($r),
            'conversation' => fn (): array => $conversations->present($r, $dispute->agreement),
            'capabilities' => [
                'canResolveDispute' => $dispute->status === GigDisputeStatus::AwaitingAdmin,
                'canGenerateAiOverview' => $dispute->status === GigDisputeStatus::AwaitingAdmin,
            ],
            'server_now' => now()->toISOString(),
        ]);
    }

    public function resolve(ResolveGigDisputeRequest $r, GigDispute $dispute, ResolveGigDispute $action): RedirectResponse
    {
        $this->authorize('resolve', $dispute);
        $d = $r->validated();
        try {
            $action->execute($r->user(), $dispute, GigDisputeFinding::from($d['finding']), isset($d['inconclusive_outcome']) ? GigSettlementOutcome::from($d['inconclusive_outcome']) : null, $d['resolution_note']);
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Sengketa diselesaikan.');
    }

    public function generateAiOverview(Request $request, GigDispute $dispute, RequestGigDisputeAiOverview $action): RedirectResponse
    {
        $this->authorize('resolve', $dispute);

        try {
            $overview = $action->execute($request->user(), $dispute);
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Permintaan ringkasan AI diterima.');
    }
}
