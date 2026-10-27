<?php

namespace App\Http\Controllers;

use App\Models\Desa;
use App\Models\Kecamatan;
use App\Models\Lahan;
use App\Models\MusimTanam;
use App\Models\Provitas;
use App\Models\LuasAreal;
use App\Services\WilayahService;
use Illuminate\Http\Request;

class ReferensiController extends Controller
{
    public function __invoke(Request $request, WilayahService $wilayah): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $desa = Desa::query();
        $lahan = Lahan::query();
        $kecamatan = Kecamatan::query();

        if ($user->role === 'ppl') {
            $kecamatanIds = $wilayah->kecamatanAktif($user);
            $kecamatan->whereIn('id', $kecamatanIds);
            $desa->whereIn('kecamatan_id', $kecamatanIds);
            $lahan->whereHas('desa', fn ($q) => $q->whereIn('kecamatan_id', $kecamatanIds));
        }

        return response()->json([
            'kecamatan' => $kecamatan->get(),
            'desa' => $desa->get(),
            'lahan' => $lahan->get(),
            'musim_tanam' => MusimTanam::all(),
            'provitas' => Provitas::when($user->role === 'ppl', fn ($q) => $q->where('ppl_id', $user->id))
                ->where('deleted', false)->get(),
            'luas_areal' => LuasAreal::when($user->role === 'ppl', fn ($q) => $q->where('ppl_id', $user->id))
                ->where('deleted', false)->get(),
            'server_time' => now()->toISOString(),
        ]);
    }
}
