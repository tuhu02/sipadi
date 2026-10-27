<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LuasAreal extends Model
{
    protected $table = 'luas_areal';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $guarded = [];

    protected function casts(): array
    {
        return ['deleted' => 'boolean', 'verified_at' => 'datetime', 'updated_at' => 'datetime', 'created_at' => 'datetime', 'synced_at' => 'datetime'];
    }

    public function desa(): BelongsTo { return $this->belongsTo(Desa::class); }
    public function ppl(): BelongsTo { return $this->belongsTo(User::class, 'ppl_id'); }
    public function verifikator(): BelongsTo { return $this->belongsTo(User::class, 'verified_by'); }
}
