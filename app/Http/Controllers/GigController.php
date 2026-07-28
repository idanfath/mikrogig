<?php

namespace App\Http\Controllers;

use App\Actions\Gig\CancelGig;
use App\Actions\Gig\CreateGig;
use App\Enums\GigCategory;
use App\Enums\GigOfferStatus;
use App\Enums\GigStatus;
use App\Enums\UserRole;
use App\Http\Requests\DiscoverGigsRequest;
use App\Http\Requests\EnhanceGigRequest;
use App\Http\Requests\StoreGigRequest;
use App\Http\Resources\GigOfferResource;
use App\Http\Resources\GigResource;
use App\Models\Gig;
use App\Models\GigOffer;
use App\Services\GigConversationService;
use App\Services\GigEnhancementService;
use DomainException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GigController extends Controller
{
    public function index(DiscoverGigsRequest $request): Response
    {
        $filters = $request->validated();
        $user = $request->user();

        if (! $request->has('province_id') && $user?->province_id) {
            $filters['province_id'] = $user->province_id;
            if (! $request->has('regency_id') && $user->regency_id) {
                $filters['regency_id'] = $user->regency_id;
            }
        }

        return Inertia::render('app/gigs/index', [
            'gigs' => fn () => GigResource::collection(
                Gig::query()
                    ->open()
                    ->futureScheduled()
                    ->with(['client', 'media'])
                    ->withCount(['offers as pending_applicants_count' => fn (Builder $query) => $query->pending()])
                    ->when($request->filled('search'), function (Builder $query) use ($filters) {
                        $term = '%'.$filters['search'].'%';
                        $query->where(function (Builder $q) use ($term) {
                            $q->where('title', 'like', $term)
                                ->orWhere('description', 'like', $term);
                        });
                    })
                    ->when(! empty($filters['province_id']), fn (Builder $query) => $query->where('province_id', $filters['province_id']))
                    ->when(! empty($filters['regency_id']), fn (Builder $query) => $query->where('regency_id', $filters['regency_id']))
                    ->when($request->filled('category'), fn (Builder $query) => $query->where('category', $filters['category']))
                    ->when($request->filled('date_from'), fn (Builder $query) => $query->whereDate('work_date', '>=', $filters['date_from']))
                    ->when($request->filled('date_to'), fn (Builder $query) => $query->whereDate('work_date', '<=', $filters['date_to']))
                    ->when($request->filled('minimum_fee'), fn (Builder $query) => $query->where('posted_fee', '>=', $filters['minimum_fee']))
                    ->when($request->filled('maximum_fee'), fn (Builder $query) => $query->where('posted_fee', '<=', $filters['maximum_fee']))
                    ->orderBy('work_date')
                    ->orderBy('start_time')
                    ->orderBy('id')
                    ->paginate(15)
                    ->withQueryString(),
            ),
            'filters' => $filters,
            'categories' => GigCategory::values(),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', Gig::class);
        $user = $request->user();

        return Inertia::render('app/gigs/create', [
            'categories' => GigCategory::values(),
            'today' => now(config('app.timezone'))->toDateString(),
            'default_province_id' => $user?->province_id,
            'default_regency_id' => $user?->regency_id,
        ]);
    }

    public function enhance(EnhanceGigRequest $request, GigEnhancementService $gigEnhancementService): JsonResponse
    {
        $validated = $request->validated();

        try {
            return response()->json([
                'value' => $gigEnhancementService->enhance(
                    $validated['field'],
                    $validated['value'] ?? null,
                    $validated['context'] ?? [],
                ),
            ]);
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'error' => 'Peningkatan gagal.',
            ], 500);
        }
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
        $isOwner = $user->id === $gig->client_id;
        $isFreelancer = $user->role === UserRole::Freelancer;

        $myOffer = $isFreelancer
            ? GigOffer::query()->forGig($gig->id)->forFreelancer($user->id)->first()
            : null;

        $hasCurrentAgreement = $isOwner
            ? $gig->currentAgreement()->exists()
            : $myOffer?->status === GigOfferStatus::ACCEPTED
                && $gig->currentAgreement()->where('gig_offer_id', $myOffer->id)->exists();

        $hasReachedPendingLimit = $isFreelancer && $user->hasReachedPendingOfferLimit();
        $hasActiveAcceptedWork = $isFreelancer && $user->hasActiveAcceptedWork();

        return Inertia::render('app/gigs/show', [
            'gig' => GigResource::make($gig)->resolve($request),
            'my_offer' => $myOffer === null ? null : GigOfferResource::make($myOffer)->resolve($request),
            'can_apply' => $user->can('apply', $gig),
            'is_owner' => $isOwner,
            'has_current_agreement' => $hasCurrentAgreement,
            'has_reached_pending_limit' => $hasReachedPendingLimit,
            'has_active_accepted_work' => $hasActiveAcceptedWork,
        ]);
    }

    public function destination(
        Request $request,
        Gig $gig,
        GigConversationService $conversations,
    ): RedirectResponse {
        $this->authorize('view', $gig);

        if ($gig->status === GigStatus::Open) {
            return to_route('app.gigs.show', $gig);
        }

        $agreement = $gig->agreements()
            ->with('acceptedOffer')
            ->latest('id')
            ->first();
        $isParticipant = $request->user()->id === $gig->client_id
            || $agreement?->acceptedOffer->freelancer_id === $request->user()->id;

        if ($agreement === null || ! $isParticipant) {
            return to_route('app.gigs.show', $gig);
        }

        return redirect()->to($conversations->destination($agreement));
    }

    public function owned(Request $request): Response
    {
        $this->authorize('viewOwned', Gig::class);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', Rule::in([
                'all',
                GigStatus::Open->value,
                GigStatus::InProgress->value,
                GigStatus::AgreementPreparation->value,
                GigStatus::Completed->value,
                GigStatus::Cancelled->value,
                GigStatus::DisputeResolved->value,
            ])],
        ]);

        $query = Gig::query()
            ->forClient($request->user())
            ->with(['client', 'media'])
            ->withCount(['offers as pending_applicants_count' => fn (Builder $query) => $query->pending()]);

        if (! empty($validated['search'])) {
            $term = '%'.$validated['search'].'%';
            $query->where(function (Builder $q) use ($term) {
                $q->where('title', 'like', $term)
                    ->orWhere('description', 'like', $term);
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

        return Inertia::render('app/client/gigs/index', [
            'gigs' => fn () => GigResource::collection(
                $query
                    ->orderByRaw('CASE WHEN status NOT IN (?, ?, ?) THEN 1 ELSE 0 END DESC', $terminalStatuses)
                    ->orderByDesc('updated_at')
                    ->paginate(15)
                    ->withQueryString(),
            ),
            'filters' => array_merge(['status' => $status], $validated),
        ]);
    }

    public function applicants(Request $request, Gig $gig): Response
    {
        $this->authorize('viewApplicants', $gig);

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', Rule::in([
                'all',
                GigOfferStatus::PENDING->value,
                GigOfferStatus::ACCEPTED->value,
                GigOfferStatus::REJECTED->value,
                GigOfferStatus::WITHDRAWN->value,
                GigOfferStatus::AUTO_WITHDRAWN->value,
            ])],
        ]);

        $query = GigOffer::query()
            ->forGig($gig->id)
            ->with(['freelancer.freelancerProfile']);

        if (! empty($validated['search'])) {
            $term = '%'.$validated['search'].'%';
            $query->where(function (Builder $q) use ($term) {
                $q->where('gig_offers.note', 'like', $term)
                    ->orWhereHas('freelancer', function (Builder $fq) use ($term) {
                        $fq->where('name', 'like', $term)
                            ->orWhereHas('freelancerProfile', function (Builder $pq) use ($term) {
                                $pq->where('title', 'like', $term)
                                    ->orWhere('skills', 'like', $term);
                            });
                    });
            });
        }

        $status = $validated['status'] ?? 'all';
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        return Inertia::render('app/client/gigs/applicants', [
            'gig' => GigResource::make($gig->load(['client', 'media']))->resolve($request),
            'offers' => fn () => GigOfferResource::collection(
                $query
                    ->orderByRaw('CASE status WHEN ? THEN 1 WHEN ? THEN 2 WHEN ? THEN 3 WHEN ? THEN 4 WHEN ? THEN 5 ELSE 6 END', [
                        GigOfferStatus::PENDING->value,
                        GigOfferStatus::ACCEPTED->value,
                        GigOfferStatus::REJECTED->value,
                        GigOfferStatus::WITHDRAWN->value,
                        GigOfferStatus::AUTO_WITHDRAWN->value,
                    ])
                    ->latest()
                    ->paginate(15)
                    ->withQueryString(),
            ),
            'filters' => array_merge(['status' => $status], $validated),
            'pendingOffersCount' => GigOffer::query()
                ->forGig($gig->id)
                ->where('status', GigOfferStatus::PENDING->value)
                ->count(),
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
