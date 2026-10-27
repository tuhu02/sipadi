<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MusimTanam extends Model
{
    use HasUuids;

    protected $table = 'musim_tanam';
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
        ];
    }

    public function provitas(): HasMany
    {
        return $this->hasMany(Provitas::class);
    }
}