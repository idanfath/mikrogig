<?php

namespace App\Http\Controllers;

use App\Actions\AcceptGigOffer;
use App\Actions\ApplyToGig;
use App\Actions\RejectGigOffer;
use App\Actions\WithdrawGigOffer;
use App\Enums\GigOfferStatus;
use App\Enums\GigStatus;
use App\Http\Requests\ApplyToGigRequest;
use App\Http\Resources\GigOfferResource;
use App\Models\Gig;
use App\Models\GigOffer;
use DomainException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GigOfferController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', GigOffer::class);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', Rule::in([
                'all',
                GigOfferStatus::PENDING->value,
                GigOfferStatus::ACCEPTED->value,
                GigOfferStatus::REJECTED->value,
                GigOfferStatus::WITHDRAWN->value,
            ])],
        ]);

        $query = GigOffer::query()
            ->forFreelancer($request->user()->id)
            ->with(['gig.client', 'gig.media']);

        if (! empty($validated['search'])) {
            $term = '%'.$validated['search'].'%';
            $query->where(function (Builder $q) use ($term) {
                $q->where('gig_offers.note', 'like', $term)
                    ->orWhereHas('gig', function (Builder $gq) use ($term) {
                        $gq->where('title', 'like', $term)
                            ->orWhere('description', 'like', $term);
                    });
            });
        }

        $status = $validated['status'] ?? 'all';
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $terminalStatuses = [
            GigStatus::Completed->value,
            GigStatus::Cancelled->value,
            GigStatus::DisputeResolved->value,
        ];
        $activeOfferStatuses = [
            GigOfferStatus::PENDING->value,
            GigOfferStatus::ACCEPTED->value,
        ];

        $offers = $query
            ->select('gig_offers.*')
            ->join('gigs', 'gigs.id', '=', 'gig_offers.gig_id')
            ->orderByRaw('CASE WHEN gig_offers.status IN (?, ?) AND gigs.status NOT IN (?, ?, ?) THEN 1 ELSE 0 END DESC', array_merge($activeOfferStatuses, $terminalStatuses))
            ->orderByDesc('gig_offers.updated_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('app/applications/index', [
            'offers' => GigOfferResource::collection($offers),
            'filters' => array_merge(['status' => $status], $validated),
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

        return redirect()->route('app.gigs.agreement.show', ['gig' => $gigOffer->gig_id])
            ->with('success', 'Penawaran berhasil diterima.');
    }
}
