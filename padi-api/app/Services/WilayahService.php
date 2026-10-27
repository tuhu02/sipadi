<?php

namespace App\Services;

use App\Models\Desa;
use App\Models\Lahan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class WilayahService
{
    public function kecamatanAktif(User $ppl): Collection
    {
        $today = Carbon::today();

        return $ppl->penugasan()
            ->whereDate('tanggal_mulai', '<=', $today)
            ->where(function ($query) use ($today) {
                $query->whereNull('tanggal_selesai')->orWhereDate('tanggal_selesai', '>=', $today);
            })
            ->pluck('kecamatan_id');
    }

    public function lahanBolehDiakses(User $ppl, string $lahanId): bool
    {
        return Lahan::whereKey($lahanId)
            ->whereHas('desa', fn ($q) => $q->whereIn('kecamatan_id', $this->kecamatanAktif($ppl)))
            ->exists();
    }

    public function desaBolehDiakses(User $ppl, string $desaId): bool
    {
        return Desa::whereKey($desaId)
            ->whereIn('kecamatan_id', $this->kecamatanAktif($ppl))
            ->exists();
    }
}
