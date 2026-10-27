<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// TANPA HasUuids: ID dibuat di klien (crypto.randomUUID)
class Provitas extends Model
{
    protected $table = 'provitas';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'tanggal_panen' => 'date',
            'deleted' => 'boolean',
            'verified_at' => 'datetime',
            'updated_at' => 'datetime',
            'created_at' => 'datetime',
            'synced_at' => 'datetime',
        ];
    }

    public function lahan(): BelongsTo
    {
        return $this->belongsTo(Lahan::class);
    }

    public function musimTanam(): BelongsTo
    {
        return $this->belongsTo(MusimTanam::class);
    }

    public function ppl(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ppl_id');
    }

    public function verifikator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}