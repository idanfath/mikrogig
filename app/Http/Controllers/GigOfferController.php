<?php

namespace App\Http\Controllers;

use App\Actions\AcceptGigOffer;
use App\Actions\ApplyToGig;
use App\Actions\RejectGigOffer;
use App\Actions\WithdrawGigOffer;
use App\Http\Requests\ApplyToGigRequest;
use App\Http\Resources\GigOfferResource;
use App\Models\Gig;
use App\Models\GigOffer;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GigOfferController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', GigOffer::class);

        $offers = GigOffer::query()
            ->forFreelancer($request->user()->id)
            ->with(['gig.client', 'gig.media'])
            ->latest('updated_at')
            ->paginate(15);

        return Inertia::render('app/applications/index', [
            'offers' => GigOfferResource::collection($offers),
        ]);
    }

    public function store(ApplyToGigRequest $request, Gig $gig, ApplyToGig $applyToGig): RedirectResponse
    {
        $data = $request->validated();

        try {
            $applyToGig->execute(
                $request->user(),
                $gig,
                $data['offered_fee'] ?? null,
                $data['note'] ?? null,
            );
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Penawaran berhasil dikirim.');
    }

    public function withdraw(Request $request, GigOffer $gigOffer, WithdrawGigOffer $withdrawGigOffer): RedirectResponse
    {
        $this->authorize('withdraw', $gigOffer);

        try {
            $withdrawGigOffer->execute($request->user(), $gigOffer);
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Penawaran berhasil ditarik.');
    }

    public function reject(Request $request, GigOffer $gigOffer, RejectGigOffer $rejectGigOffer): RedirectResponse
    {
        $this->authorize('reject', $gigOffer);

        try {
            $rejectGigOffer->execute($request->user(), $gigOffer);
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Penawaran berhasil ditolak.');
    }

    public function accept(Request $request, GigOffer $gigOffer, AcceptGigOffer $acceptGigOffer): RedirectResponse
    {
        $this->authorize('accept', $gigOffer);

        try {
            $acceptGigOffer->execute($request->user(), $gigOffer);
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Penawaran berhasil diterima.');
    }
}
