<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RekapController extends Controller
{
    public function kecamatan(Request $request)
    {
        $provitas = DB::table('provitas')->join('lahan', 'lahan.id', '=', 'provitas.lahan_id')
            ->join('desa', 'desa.id', '=', 'lahan.desa_id')->join('kecamatan', 'kecamatan.id', '=', 'desa.kecamatan_id')
            ->where('provitas.status', 'verified')->where('provitas.deleted', false)
            ->when($request->musim_tanam_id, fn ($q, $v) => $q->where('provitas.musim_tanam_id', $v))
            ->select('kecamatan.id', 'kecamatan.kode', 'kecamatan.nama',
                DB::raw('COUNT(provitas.id) as jumlah_sampel'), DB::raw('AVG(provitas.provitas_kuha) as provitas_rata'),
                DB::raw('SUM(provitas.berat_gabah_kg) / NULLIF(SUM(provitas.luas_petak_m2), 0) * 100 as provitas_tertimbang'))
            ->groupBy('kecamatan.id', 'kecamatan.kode', 'kecamatan.nama')->get()->keyBy('id');
        $areal = DB::table('luas_areal')->join('desa', 'desa.id', '=', 'luas_areal.desa_id')
            ->where('luas_areal.status', 'verified')->where('luas_areal.deleted', false)
            ->when($request->tahun, fn ($q, $v) => $q->where('luas_areal.tahun', $v))
            ->select('desa.kecamatan_id', DB::raw('SUM(luas_areal.luas_tanam_ha) as luas_tanam_ha'), DB::raw('SUM(luas_areal.luas_panen_ha) as luas_panen_ha'))
            ->groupBy('desa.kecamatan_id')->get()->keyBy('kecamatan_id');
        return response()->json($provitas->map(function ($row) use ($areal) {
            $a = $areal->get($row->id);
            $row->luas_tanam_ha = $a->luas_tanam_ha ?? 0;
            $row->luas_panen_ha = $a->luas_panen_ha ?? 0;
            $row->produksi_ton = $row->luas_panen_ha * $row->provitas_rata / 10;
            return $row;
        })->values());
    }
}
