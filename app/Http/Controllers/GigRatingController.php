<?php

namespace App\Http\Controllers;

use App\Actions\SubmitGigRating;
use App\Http\Requests\StoreGigRatingRequest;
use App\Models\Gig;
use DomainException;
use Illuminate\Http\RedirectResponse;

class GigRatingController extends Controller
{
    public function store(StoreGigRatingRequest $request, Gig $gig, SubmitGigRating $action): RedirectResponse
    {
        $validated = $request->validated();

        try {
            $action->execute(
                $request->user(),
                $gig,
                $validated['score'],
                $validated['comment'] ?? null,
            );
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Rating berhasil dikirim.');
    }
}
