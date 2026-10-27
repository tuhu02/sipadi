<?php

namespace App\Services;

use App\Models\Desa;
use App\Models\Lahan;
use App\Models\User;
use App\Notifications\MasterDataAdded;

class MasterDataNotificationService
{
    public function notifyAssignedPpl(Desa|Lahan $record): void
    {
        if ($record instanceof Desa) {
            $desa = $record;
        } else {
            $desa = $record->desa()->firstOrFail();
        }

        $kecamatan = $desa->kecamatan()->firstOrFail();

        $data = [
            'event' => 'master_data_added',
            'title' => $record instanceof Desa ? 'Desa baru tersedia' : 'Lahan baru tersedia',
            'message' => $record instanceof Desa
                ? "Desa {$desa->nama} ditambahkan di Kecamatan {$kecamatan->nama}."
                : "Lahan {$record->kode_sampel} ditambahkan di Desa {$desa->nama}.",
            'resource_type' => $record instanceof Desa ? 'desa' : 'lahan',
            'resource_id' => (string) $record->getKey(),
            'kecamatan_id' => (string) $kecamatan->getKey(),
            'desa_id' => $record instanceof Desa ? (string) $desa->getKey() : (string) $record->desa_id,
            'nama' => $record instanceof Desa ? $desa->nama : $record->kode_sampel,
        ];

        $today = now()->toDateString();

        User::query()
            ->where('role', 'ppl')
            ->whereHas('penugasan', function ($query) use ($kecamatan, $today): void {
                $query->where('kecamatan_id', $kecamatan->getKey())
                    ->whereDate('tanggal_mulai', '<=', $today)
                    ->where(function ($activeAssignment) use ($today): void {
                        $activeAssignment->whereNull('tanggal_selesai')
                            ->orWhereDate('tanggal_selesai', '>=', $today);
                    });
            })
            ->get()
            ->each(fn (User $user) => $user->notify(new MasterDataAdded($data)));
    }
}
