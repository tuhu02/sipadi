<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lahan extends Model
{
    use HasUuids;

    protected $table = 'lahan';
    protected $guarded = [];

    public function desa(): BelongsTo
    {
        return $this->belongsTo(Desa::class);
    }

    public function provitas(): HasMany
    {
        return $this->hasMany(Provitas::class);
    }
}