<?php

namespace App\Http\Controllers;

use App\Actions\CancelGig;
use App\Models\Gig;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class GigController extends Controller
{
    public function cancel(Request $request, Gig $gig, CancelGig $cancelGig): RedirectResponse
    {
        $this->authorize('cancel', $gig);

        try {
            $cancelGig->execute($request->user(), $gig);
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Gig berhasil dibatalkan.');
    }
}
