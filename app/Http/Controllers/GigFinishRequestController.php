<?php

namespace App\Http\Controllers;

use App\Actions\AcceptGigFinishRequest;
use App\Actions\RejectGigFinishRequest;
use App\Actions\SubmitGigFinishRequest;
use App\Http\Requests\RejectGigFinishRequestRequest;
use App\Http\Requests\StoreGigFinishRequestRequest;
use App\Models\Gig;
use App\Models\GigFinishRequest;
use App\Models\GigFinishRequestMedia;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class GigFinishRequestController extends Controller
{
    public function store(StoreGigFinishRequestRequest $request, Gig $gig, SubmitGigFinishRequest $action): RedirectResponse
    {
        $validated = $request->validated();

        try {
            $action->execute($request->user(), $gig, $validated['completion_note'], $validated['photos']);
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Bukti penyelesaian berhasil dikirim.');
    }

    public function accept(Request $request, GigFinishRequest $finishRequest, AcceptGigFinishRequest $action): RedirectResponse
    {
        $this->authorize('accept', $finishRequest);

        try {
            $action->execute($request->user(), $finishRequest);
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Penyelesaian gig diterima.');
    }

    public function reject(RejectGigFinishRequestRequest $request, GigFinishRequest $finishRequest, RejectGigFinishRequest $action): RedirectResponse
    {
        try {
            $action->execute($request->user(), $finishRequest, $request->validated('reason'));
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Penyelesaian gig ditolak.');
    }

    public function media(Request $request, GigFinishRequestMedia $media): StreamedResponse
    {
        $this->authorize('view', $media->finishRequest);
        abort_unless(Storage::disk('local')->exists($media->path), 404);

        return Storage::disk('local')->response($media->path);
    }
}
