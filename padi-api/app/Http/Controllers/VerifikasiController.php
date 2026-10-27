<?php

namespace App\Http\Controllers;

use App\Models\LuasAreal;
use App\Models\Provitas;
use Illuminate\Http\Request;

class VerifikasiController extends Controller
{
    public function provitas(Request $request)
    {
        return response()->json(Provitas::with(['lahan.desa.kecamatan', 'musimTanam', 'ppl:id,nama,email'])->where('status', 'submitted')
            ->when($request->kecamatan_id, fn ($q, $v) => $q->whereHas('lahan.desa', fn ($d) => $d->where('kecamatan_id', $v)))
            ->when($request->musim_tanam_id, fn ($q, $v) => $q->where('musim_tanam_id', $v))
            ->when($request->ppl_id, fn ($q, $v) => $q->where('ppl_id', $v))->paginate(15));
    }
    public function luasAreal(Request $request)
    {
        return response()->json(LuasAreal::with(['desa.kecamatan', 'ppl:id,nama,email'])->where('status', 'submitted')
            ->when($request->kecamatan_id, fn ($q, $v) => $q->whereHas('desa', fn ($d) => $d->where('kecamatan_id', $v)))
            ->when($request->tahun, fn ($q, $v) => $q->where('tahun', $v))
            ->when($request->ppl_id, fn ($q, $v) => $q->where('ppl_id', $v))->paginate(15));
    }
    public function action(Request $request, string $type, string $id, string $status)
    {
        $request->validate(['catatan_verifikasi' => [$status === 'rejected' ? 'required' : 'nullable', 'string']]);
        $model = ($type === 'provitas' ? Provitas::class : LuasAreal::class)::findOrFail($id);
        $model->update(['status' => $status, 'verified_by' => $request->user()->id, 'verified_at' => now(),
            'catatan_verifikasi' => $request->input('catatan_verifikasi'), 'synced_at' => now()]);
        return response()->json($model->fresh());
    }
}
