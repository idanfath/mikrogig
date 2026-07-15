<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;

#[Guarded(['id'])]
class FreelancerProfile extends Model
{
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
