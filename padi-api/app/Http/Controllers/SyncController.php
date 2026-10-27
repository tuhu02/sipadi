<?php

namespace App\Http\Controllers;

use App\Http\Requests\SyncRequest;
use App\Models\LuasAreal;
use App\Models\Provitas;
use App\Services\WilayahService;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Throwable;

class SyncController extends Controller
{
    public function __construct(private readonly WilayahService $wilayah) {}

    public function __invoke(SyncRequest $request): JsonResponse
    {
        $user = $request->user();
        $hasil = ['provitas' => [], 'luas_areal' => []];
        foreach ($request->input('provitas', []) as $record) {
            $hasil['provitas'][] = $this->syncProvitas($record, $user, $hasil);
        }
        foreach ($request->input('luas_areal', []) as $record) {
            $hasil['luas_areal'][] = $this->syncLuasAreal($record, $user);
        }

        $lastSync = $request->date('last_sync');
        $changes = [
            'provitas' => Provitas::where('ppl_id', $user->id)
                ->when($lastSync, fn ($q) => $q->where('synced_at', '>', $lastSync))->get(),
            'luas_areal' => LuasAreal::where('ppl_id', $user->id)
                ->when($lastSync, fn ($q) => $q->where('synced_at', '>', $lastSync))->get(),
        ];

        return response()->json(['hasil' => $hasil, 'perubahan' => $changes, 'server_time' => now()->toISOString()]);
    }

    private function syncProvitas(array $data, $user): array
    {
        $id = $data['id'] ?? null;
        try {
            $validated = Validator::make($data, [
                'id' => ['required', 'uuid'], 'lahan_id' => ['required', 'uuid'],
                'musim_tanam_id' => ['required', 'uuid'], 'tanggal_panen' => ['required', 'date'],
                'luas_petak_m2' => ['required', 'numeric', 'gt:0'], 'berat_gabah_kg' => ['required', 'numeric', 'gte:0'],
                'kadar_air' => ['nullable', 'numeric'], 'catatan' => ['nullable', 'string'],
                'status' => ['required', 'in:draft,submitted'], 'updated_at' => ['required', 'date'],
                'deleted' => ['boolean'],
            ])->validate();
            if (! $this->wilayah->lahanBolehDiakses($user, $validated['lahan_id'])) {
                return ['id' => $id, 'status' => 'ditolak', 'alasan' => 'Lahan berada di luar kecamatan penugasan.'];
            }
            $existing = Provitas::find($id);
            if ($existing && $existing->ppl_id !== $user->id) {
                return ['id' => $id, 'status' => 'ditolak', 'alasan' => 'Data dimiliki PPL lain.'];
            }
            if ($existing && $existing->status === 'verified') {
                return ['id' => $id, 'status' => 'ditolak', 'alasan' => 'Data terverifikasi tidak dapat diubah.', 'versi_server' => $existing];
            }
            if ($existing && $existing->updated_at && Carbon::parse($existing->updated_at)->gt(Carbon::parse($validated['updated_at']))) {
                return ['id' => $id, 'status' => 'diterima', 'alasan' => null, 'versi_server' => $existing];
            }
            $values = collect($validated)->except('id')->all();
            $values['ppl_id'] = $user->id;
            $values['provitas_kuha'] = round(((float) $values['berat_gabah_kg'] / (float) $values['luas_petak_m2']) * 100, 2);
            if ($values['provitas_kuha'] > 1000) {
                return ['id' => $id, 'status' => 'ditolak', 'alasan' => 'Nilai provitas tidak masuk akal.'];
            }
            $values['deleted'] = (bool) ($values['deleted'] ?? false);
            $values['synced_at'] = now();
            DB::transaction(fn () => Provitas::updateOrCreate(['id' => $id], $values));
            return ['id' => $id, 'status' => 'diterima', 'alasan' => null];
        } catch (QueryException $e) {
            return ['id' => $id, 'status' => 'ditolak', 'alasan' => 'duplikat'];
        } catch (Throwable $e) {
            return ['id' => $id, 'status' => 'ditolak', 'alasan' => $e->getMessage()];
        }
    }

    private function syncLuasAreal(array $data, $user): array
    {
        $id = $data['id'] ?? null;
        try {
            $validated = Validator::make($data, [
                'id' => ['required', 'uuid'], 'desa_id' => ['required', 'uuid'], 'tahun' => ['required', 'integer', 'between:2000,2100'],
                'bulan' => ['required', 'integer', 'between:1,12'], 'luas_tanam_ha' => ['required', 'numeric', 'gte:0', 'max:99999999.99'],
                'luas_panen_ha' => ['required', 'numeric', 'gte:0', 'max:99999999.99'], 'luas_puso_ha' => ['nullable', 'numeric', 'gte:0', 'max:99999999.99'],
                'catatan' => ['nullable', 'string'], 'status' => ['required', 'in:draft,submitted'],
                'updated_at' => ['required', 'date'], 'deleted' => ['boolean'],
            ])->validate();
            if (! $this->wilayah->desaBolehDiakses($user, $validated['desa_id'])) {
                return ['id' => $id, 'status' => 'ditolak', 'alasan' => 'Desa berada di luar kecamatan penugasan.'];
            }
            $existing = LuasAreal::find($id);
            if ($existing && $existing->ppl_id !== $user->id) return ['id' => $id, 'status' => 'ditolak', 'alasan' => 'Data dimiliki PPL lain.'];
            if ($existing && $existing->status === 'verified') return ['id' => $id, 'status' => 'ditolak', 'alasan' => 'Data terverifikasi tidak dapat diubah.', 'versi_server' => $existing];
            if ($existing && $existing->updated_at && Carbon::parse($existing->updated_at)->gt(Carbon::parse($validated['updated_at']))) {
                return ['id' => $id, 'status' => 'diterima', 'alasan' => null, 'versi_server' => $existing];
            }
            $values = collect($validated)->except('id')->all();
            $values['ppl_id'] = $user->id; $values['deleted'] = (bool) ($values['deleted'] ?? false); $values['synced_at'] = now();
            DB::transaction(fn () => LuasAreal::updateOrCreate(['id' => $id], $values));
            return ['id' => $id, 'status' => 'diterima', 'alasan' => null];
        } catch (QueryException $e) {
            return ['id' => $id, 'status' => 'ditolak', 'alasan' => 'duplikat'];
        } catch (Throwable $e) {
            return ['id' => $id, 'status' => 'ditolak', 'alasan' => $e->getMessage()];
        }
    }
}
