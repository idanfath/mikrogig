<?php

namespace App\Http\Controllers;

use App\Actions\SendGigMessage;
use App\Http\Requests\StoreGigMessageRequest;
use App\Models\GigAgreement;
use App\Models\GigMessageMedia;
use App\Services\GigConversationService;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class GigConversationController extends Controller
{
    public function show(
        Request $request,
        GigAgreement $agreement,
        GigConversationService $conversations,
    ): Response|RedirectResponse {
        if ($request->user()->activeBan()->exists()
            && ! $conversations->canView($request->user(), $agreement)) {
            return redirect()->route('app.suspension');
        }

        $this->authorize('viewConversation', $agreement);

        return Inertia::render('app/gigs/conversation', [
            'conversation' => $conversations->present($request, $agreement),
        ]);
    }

    public function destination(
        Request $request,
        GigAgreement $agreement,
        GigConversationService $conversations,
    ): RedirectResponse {
        if ($request->user()->activeBan()->exists()
            && ! $conversations->canView($request->user(), $agreement)) {
            return redirect()->route('app.suspension');
        }

        $this->authorize('viewConversation', $agreement);

        return redirect()->to($conversations->destination($agreement));
    }

    public function store(
        StoreGigMessageRequest $request,
        GigAgreement $agreement,
        SendGigMessage $action,
    ): RedirectResponse {
        $validated = $request->validated();

        try {
            $action->execute(
                $request->user(),
                $agreement,
                $validated['body'] ?? null,
                $request->file('images', []),
            );
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back();
    }

    public function markRead(
        Request $request,
        GigAgreement $agreement,
        GigConversationService $conversations,
    ): RedirectResponse {
        $this->authorize('markMessagesRead', $agreement);
        $conversations->markRead($request->user(), $agreement);

        return back();
    }

    public function media(
        Request $request,
        GigMessageMedia $media,
        GigConversationService $conversations,
    ) {
        $agreement = $media->message->agreement;
        if ($request->user()->activeBan()->exists()
            && ! $conversations->canView($request->user(), $agreement)) {
            return redirect()->route('app.suspension');
        }

        $this->authorize('viewConversation', $agreement);
        abort_unless(Storage::disk('local')->exists($media->path), 404);

        return Storage::disk('local')->response($media->path);
    }
}
