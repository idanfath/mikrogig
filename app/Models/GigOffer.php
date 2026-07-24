<?php

namespace App\Models;

use App\Enums\GigOfferStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'offered_fee',
    'note',
])]
class GigOffer extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'status' => GigOfferStatus::class,
            'offered_fee' => 'integer',
        ];
    }

    public function gig()
    {
        return $this->belongsTo(Gig::class);
    }

    public function freelancer()
    {
        return $this->belongsTo(User::class, 'freelancer_id');
    }

    // uncomment when needed, remove if not used
    // public function scopeForGig($query, int $gigId)
    // {
    //     $query->where('gig_id', $gigId);
    // }

    // public function scopeForFreelancer($query, int $freelancerId)
    // {
    //     $query->where('freelancer_id', $freelancerId);
    // }
}
