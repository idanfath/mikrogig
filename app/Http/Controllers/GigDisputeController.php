<?php

namespace App\Http\Controllers;

use App\Actions\Dispute\SubmitGigDisputeCounterproof;
use App\Enums\GigDisputeStatus;
use App\Http\Requests\StoreGigDisputeCounterproofRequest;
use App\Http\Resources\GigDisputeResource;
use App\Models\GigDispute;
use App\Models\GigDisputeMedia;
use App\Services\GigConversationService;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class GigDisputeController extends Controller
{
    public function show(Request $request, GigDispute $dispute, GigConversationService $conversations): Response
    {
        $this->authorize('view', $dispute);

        return Inertia::render('app/gigs/dispute', [
            'dispute' => GigDisputeResource::make($dispute->load(['submissions.media', 'finishRequest.media', 'reporter', 'respondent', 'gig']))->resolve($request),
            'conversation' => fn (): array => $conversations->present($request, $dispute->agreement),
            'server_now' => now()->toISOString(),
            'capabilities' => [
                'canSubmitCounterproof' => $dispute->respondent_id === $request->user()->id
                    && $dispute->status === GigDisputeStatus::AwaitingCounterproof
                    && $dispute->counterproof_due_at->isFuture(),
                'counterproofExpired' => $dispute->status === GigDisputeStatus::AwaitingCounterproof
                    && ! $dispute->counterproof_due_at->isFuture(),
            ],
        ]);
    }

    public function counterproof(StoreGigDisputeCounterproofRequest $request, GigDispute $dispute, SubmitGigDisputeCounterproof $action): RedirectResponse
    {
        $this->authorize('counterproof', $dispute);
        $d = $request->validated();
        try {
            $action->execute($request->user(), $dispute, $d['statement'], $d['photos']);
        } catch (DomainException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Counterproof dikirim.');
    }

    public function media(Request $request, GigDisputeMedia $media)
    {
        $dispute = $media->submission->dispute;
        $this->authorize('view', $dispute);

        abort_unless(Storage::disk('local')->exists($media->path), 404);

        return Storage::disk('local')->response($media->path);
    }
}
