<?php

namespace App\Http\Controllers;

use App\Actions\ResolveGigDispute;
use App\Enums\GigDisputeFinding;
use App\Enums\GigDisputeStatus;
use App\Enums\GigDisputeType;
use App\Enums\GigSettlementOutcome;
use App\Http\Requests\ResolveGigDisputeRequest;
use App\Http\Resources\GigDisputeResource;
use App\Http\Resources\GigSettlementResource;
use App\Models\GigDispute;
use App\Services\GigConversationService;
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
            ->when($status !== null, fn ($query) => $query->where('status', $status), fn ($query) => $query->whereIn('status', [GigDisputeStatus::AwaitingAdmin, GigDisputeStatus::AwaitingCounterproof]))
            ->when($type !== null, fn ($query) => $query->where('type', $type))
            ->orderBy('counterproof_due_at')
            ->orderBy('opened_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('app/admin/gig-disputes/index', ['disputes' => GigDisputeResource::collection($disputes), 'filters' => ['status' => $status?->value, 'type' => $type?->value]]);
    }

    public function show(Request $r, GigDispute $dispute, GigConversationService $conversations): Response
    {
        $this->authorize('resolve', $dispute);

        $dispute->load(['gig', 'reporter', 'respondent', 'submissions.media', 'finishRequest.media', 'settlement']);

        return Inertia::render('app/admin/gig-disputes/show', [
            'dispute' => GigDisputeResource::make($dispute)->resolve($r),
            'settlement' => $dispute->settlement === null ? null : GigSettlementResource::make($dispute->settlement)->resolve($r),
            'conversation' => $conversations->present($r, $dispute->agreement),
            'capabilities' => [
                'canResolveDispute' => $dispute->status === GigDisputeStatus::AwaitingAdmin,
            ],
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
}
