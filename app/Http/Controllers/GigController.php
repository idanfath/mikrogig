<?php

namespace App\Http\Controllers;

use App\Actions\CancelGig;
use App\Actions\CreateGig;
use App\Enums\GigCategory;
use App\Enums\UserRole;
use App\Http\Requests\DiscoverGigsRequest;
use App\Http\Requests\StoreGigRequest;
use App\Http\Resources\GigOfferResource;
use App\Http\Resources\GigResource;
use App\Models\Gig;
use App\Models\GigOffer;
use DomainException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GigController extends Controller
{
    public function index(DiscoverGigsRequest $request): Response
    {
        $filters = $request->validated();
        $gigs = Gig::query()
            ->open()
            ->futureScheduled()
            ->with(['client', 'media'])
            ->withCount(['offers as pending_applicants_count' => fn (Builder $query) => $query->pending()])
            ->when($request->filled('province_id'), fn (Builder $query) => $query->where('province_id', $filters['province_id']))
            ->when($request->filled('regency_id'), fn (Builder $query) => $query->where('regency_id', $filters['regency_id']))
            ->when($request->filled('category'), fn (Builder $query) => $query->where('category', $filters['category']))
            ->when($request->filled('date_from'), fn (Builder $query) => $query->whereDate('work_date', '>=', $filters['date_from']))
            ->when($request->filled('date_to'), fn (Builder $query) => $query->whereDate('work_date', '<=', $filters['date_to']))
            ->when($request->filled('minimum_fee'), fn (Builder $query) => $query->where('posted_fee', '>=', $filters['minimum_fee']))
            ->when($request->filled('maximum_fee'), fn (Builder $query) => $query->where('posted_fee', '<=', $filters['maximum_fee']))
            ->orderBy('work_date')
            ->orderBy('start_time')
            ->orderBy('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('app/gigs/index', [
            'gigs' => GigResource::collection($gigs),
            'filters' => $filters,
            'categories' => GigCategory::values(),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', Gig::class);

        return Inertia::render('app/gigs/create', [
            'categories' => GigCategory::values(),
            'today' => now(config('app.timezone'))->toDateString(),
        ]);
    }

    public function store(StoreGigRequest $request, CreateGig $createGig): RedirectResponse
    {
        $attributes = $request->validated();
        $photos = $attributes['photos'];
        unset($attributes['photos']);

        $gig = $createGig->execute($request->user(), $attributes, $photos);

        return to_route('app.gigs.show', $gig)->with('success', 'Gig berhasil dibuat.');
    }

    public function show(Request $request, Gig $gig): Response
    {
        $this->authorize('view', $gig);

        $gig->load(['client', 'media']);
        $gig->loadCount(['offers as pending_applicants_count' => fn (Builder $query) => $query->pending()]);
        $user = $request->user();
        $isFreelancer = $user->role === UserRole::Freelancer;

        $myOffer = $isFreelancer
            ? GigOffer::query()->forGig($gig->id)->forFreelancer($user->id)->first()
            : null;

        $hasReachedPendingLimit = $isFreelancer && $user->hasReachedPendingOfferLimit();
        $hasActiveAcceptedWork = $isFreelancer && $user->hasActiveAcceptedWork();

        return Inertia::render('app/gigs/show', [
            'gig' => GigResource::make($gig)->resolve($request),
            'my_offer' => $myOffer === null ? null : GigOfferResource::make($myOffer)->resolve($request),
            'can_apply' => $user->can('apply', $gig),
            'is_owner' => $user->id === $gig->client_id,
            'has_current_agreement' => $gig->currentAgreement()->exists(),
            'has_reached_pending_limit' => $hasReachedPendingLimit,
            'has_active_accepted_work' => $hasActiveAcceptedWork,
        ]);
    }

    public function owned(Request $request): Response
    {
        $this->authorize('viewOwned', Gig::class);

        $gigs = Gig::query()
            ->forClient($request->user())
            ->with(['client', 'media'])
            ->withCount(['offers as pending_applicants_count' => fn (Builder $query) => $query->pending()])
            ->latest()
            ->paginate(15);

        return Inertia::render('app/client/gigs/index', [
            'gigs' => GigResource::collection($gigs),
        ]);
    }

    public function applicants(Request $request, Gig $gig): Response
    {
        $this->authorize('viewApplicants', $gig);

        $offers = GigOffer::query()
            ->forGig($gig->id)
            ->with(['freelancer.freelancerProfile'])
            ->latest()
            ->paginate(15);

        return Inertia::render('app/client/gigs/applicants', [
            'gig' => GigResource::make($gig->load(['client', 'media']))->resolve($request),
            'offers' => GigOfferResource::collection($offers),
        ]);
    }

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
