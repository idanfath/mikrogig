<?php

namespace App\Models;

use App\Enums\GigCategory;
use App\Enums\GigStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

// #[Guarded(['id'])]
// im not sure if guarded by defautl guards deleted_at, so pake fillable ajah
#[Fillable([
    'client_id',
    'title',
    'description',
    'category',
    'status',
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
    'posted_fee',
    'started_at',
    'cancelled_at',
    'completed_at',
])]
class Gig extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'category' => GigCategory::class,
            'status' => GigStatus::class,
            'work_date' => 'date',
            //  decimal strings.
            'location_latitude' => 'decimal:7',
            'location_longitude' => 'decimal:7',
            'started_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function offers()
    {
        return $this->hasMany(GigOffer::class);
    }

    public function acceptedOffer()
    {
        return $this
            ->hasOne(GigOffer::class)
            ->where('status', 'accepted');
    }

    public function media()
    {
        return $this
            ->hasMany(GigMedia::class);
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->whereDate('work_date', '>=', today());
    }

    public function scopeStatus(Builder $query, GigStatus $status): Builder
    {
        return $query->where('status', $status);
    }
}
