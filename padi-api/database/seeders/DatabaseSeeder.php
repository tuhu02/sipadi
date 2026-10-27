<?php

namespace Database\Seeders;

use App\Models\{User, Kecamatan, Desa, Lahan, MusimTanam, Penugasan};
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::updateOrCreate(['email' => 'admin@sipadi.test'], ['nama' => 'Administrator', 'password' => Hash::make('password'), 'role' => 'admin']);
        $ppl = User::updateOrCreate(['email' => 'ppl@sipadi.test'], ['nama' => 'Penyuluh', 'password' => Hash::make('password'), 'role' => 'ppl']);
        $musim = MusimTanam::firstOrCreate(['nama' => 'MT I 2026'], ['tanggal_mulai' => '2026-01-01', 'tanggal_selesai' => '2026-06-30']);
        foreach (range(1, 2) as $i) {
            $kecamatan = Kecamatan::firstOrCreate(['kode' => "KEC-{$i}"], ['nama' => "Kecamatan {$i}"]);
            if ($i === 1) Penugasan::firstOrCreate(['user_id' => $ppl->id, 'kecamatan_id' => $kecamatan->id, 'tanggal_mulai' => '2026-01-01'], ['tanggal_selesai' => null]);
            foreach (range(1, 2) as $j) {
                $desa = Desa::firstOrCreate(['kode' => "DESA-{$i}-{$j}"], ['kecamatan_id' => $kecamatan->id, 'nama' => "Desa {$i}-{$j}"]);
                foreach (range(1, 3) as $k) {
                    Lahan::firstOrCreate(['kode_sampel' => "S-{$i}-{$j}-{$k}"], ['desa_id' => $desa->id, 'nama_petani' => "Petani {$i}-{$j}-{$k}", 'luas_lahan_ha' => 1.5]);
                }
            }
        }
    }
}