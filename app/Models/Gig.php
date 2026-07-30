<?php

namespace App\Models;

use App\Enums\GigCategory;
use App\Enums\GigEstimatedDuration;
use App\Enums\GigOfferStatus;
use App\Enums\GigStatus;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'title',
    'description',
    'category',
    'province_id',
    'regency_id',
    'province_name',
    'regency_name',
    'location_address',
    'location_latitude',
    'location_longitude',
    'location_accuracy_meters',
    'work_date',
    'start_time',
    'estimated_duration',
    'posted_fee',
    'wage_benchmark_minimum',
    'wage_benchmark_maximum',
    'wage_benchmark_year',
])]
class Gig extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'category' => GigCategory::class,
            'estimated_duration' => GigEstimatedDuration::class,
            'status' => GigStatus::class,
            'work_date' => 'date',
            'posted_fee' => 'integer',
            'wage_benchmark_minimum' => 'integer',
            'wage_benchmark_maximum' => 'integer',
            'wage_benchmark_year' => 'integer',
            'location_accuracy_meters' => 'integer',
            'location_latitude' => 'decimal:7',
            'location_longitude' => 'decimal:7',
            'started_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function offers(): HasMany
    {
        return $this->hasMany(GigOffer::class);
    }

    public function acceptedOffer(): HasOne
    {
        return $this
            ->hasOne(GigOffer::class)
            ->where('status', GigOfferStatus::ACCEPTED->value);
    }

    public function agreements(): HasMany
    {
        return $this->hasMany(GigAgreement::class);
    }

    public function currentAgreement(): HasOne
    {
        return $this->hasOne(GigAgreement::class)->ofMany('id', 'max')->whereNull('closed_at');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(GigPayment::class);
    }

    public function currentPayment(): HasOne
    {
        return $this->hasOne(GigPayment::class)->latestOfMany();
    }

    public function exitRequests(): HasMany
    {
        return $this->hasMany(GigExitRequest::class);
    }

    public function dispute(): HasOne
    {
        return $this->hasOne(GigDispute::class);
    }

    public function settlement(): HasOne
    {
        return $this->hasOne(GigSettlement::class);
    }

    public function offenses(): HasMany
    {
        return $this->hasMany(GigOffense::class);
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(GigRating::class)->orderBy('id');
    }

    public function finishRequests(): HasMany
    {
        return $this->hasMany(GigFinishRequest::class);
    }

    public function latestFinishRequest(): HasOne
    {
        return $this->hasOne(GigFinishRequest::class)->latestOfMany();
    }

    public function media(): HasMany
    {
        return $this
            ->hasMany(GigMedia::class)
            ->orderBy('id');
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', GigStatus::Open);
    }

    public function scopeFutureScheduled(Builder $query, ?CarbonInterface $now = null): Builder
    {
        $now ??= now(config('app.timezone'));

        return $query->where(function (Builder $query) use ($now): void {
            $query
                ->whereDate('work_date', '>', $now->toDateString())
                ->orWhere(function (Builder $query) use ($now): void {
                    $query
                        ->whereDate('work_date', $now->toDateString())
                        ->where('start_time', '>', $now->format('H:i:s'));
                });
        });
    }

    public function scopeForClient(Builder $query, User $client): Builder
    {
        return $query->whereBelongsTo($client, 'client');
    }

    public function scopeTerminal(Builder $query): Builder
    {
        return $query->whereIn('status', [
            GigStatus::Completed,
            GigStatus::Cancelled,
            GigStatus::DisputeResolved,
        ]);
    }
}
