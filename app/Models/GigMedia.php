<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'gig_id',
    'path',
])]
#[Appends(['url'])]
class GigMedia extends Model
{
    use HasFactory;

    public function gig(): BelongsTo
    {
        return $this->belongsTo(Gig::class);
    }

    protected function url(): Attribute
    {
        return Attribute::make(
            get: fn() => Storage::disk('cos')->url($this->path),
        );
    }
}
