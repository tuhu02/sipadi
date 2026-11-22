<?php

namespace Database\Seeders;

use App\Models\{
    User,
    Kecamatan,
    Desa,
    Lahan,
    MusimTanam,
    Penugasan
};
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // 1. USER ADMIN DAN PPL
        $admin = User::updateOrCreate(
            ['email' => 'admin@sipadi.test'],
            [
                'nama' => 'Administrator SiPadi',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        $ppl = User::updateOrCreate(
            ['email' => 'ppl@sipadi.test'],
            [
                'nama' => 'Budi Santoso',
                'password' => Hash::make('password'),
                'role' => 'ppl',
            ]
        );

        // 2. MUSIM TANAM
        $musim = MusimTanam::firstOrCreate(
            ['nama' => 'MT I 2026'],
            [
                'tanggal_mulai' => '2026-01-01',
                'tanggal_selesai' => '2026-06-30',
            ]
        );

        // 3. DATA KECAMATAN DAN DESA
        $wilayah = [
            [
                'kode' => 'KEC-1',
                'nama' => 'Karanggeneng',
                'desa' => [
                    [
                        'kode' => 'DESA-1-1',
                        'nama' => 'Sumberwudi',
                        'petani' => [
                            'Ahmad Fauzi',
                            'Slamet Riyadi',
                            'Hadi Prasetyo',
                        ],
                    ],
                    [
                        'kode' => 'DESA-1-2',
                        'nama' => 'Kedungrejo',
                        'petani' => [
                            'Suyanto',
                            'Joko Susilo',
                            'Agus Setiawan',
                        ],
                    ],
                ],
            ],
            [
                'kode' => 'KEC-2',
                'nama' => 'Sukodadi',
                'desa' => [
                    [
                        'kode' => 'DESA-2-1',
                        'nama' => 'Sumberagung',
                        'petani' => [
                            'Bambang Sutrisno',
                            'Eko Wahyudi',
                            'Mulyono',
                        ],
                    ],
                    [
                        'kode' => 'DESA-2-2',
                        'nama' => 'Karangmulya',
                        'petani' => [
                            'Wahyu Hidayat',
                            'Dedi Kurniawan',
                            'Rudi Hartono',
                        ],
                    ],
                ],
            ],
        ];

        // 4. SIMPAN DATA WILAYAH
        foreach ($wilayah as $i => $dataKecamatan) {

            $kecamatan = Kecamatan::updateOrCreate(
                ['kode' => $dataKecamatan['kode']],
                ['nama' => $dataKecamatan['nama']]
            );

            // PPL ditugaskan pada kecamatan pertama
            if ($i === 0) {
                Penugasan::firstOrCreate(
                    [
                        'user_id' => $ppl->id,
                        'kecamatan_id' => $kecamatan->id,
                        'tanggal_mulai' => '2026-01-01',
                    ],
                    ['tanggal_selesai' => null]
                );
            }

            foreach ($dataKecamatan['desa'] as $j => $dataDesa) {

                $desa = Desa::updateOrCreate(
                    ['kode' => $dataDesa['kode']],
                    [
                        'kecamatan_id' => $kecamatan->id,
                        'nama' => $dataDesa['nama'],
                    ]
                );

                // 5. DATA LAHAN DAN PETANI
                foreach ($dataDesa['petani'] as $k => $namaPetani) {

                    $kodeSampel = sprintf(
                        'S-%d-%d-%d',
                        $i + 1,
                        $j + 1,
                        $k + 1
                    );

                    Lahan::updateOrCreate(
                        ['kode_sampel' => $kodeSampel],
                        [
                            'desa_id' => $desa->id,
                            'nama_petani' => $namaPetani,
                            'luas_lahan_ha' => 1.5,
                        ]
                    );
                }
            }
        }
    }
}
