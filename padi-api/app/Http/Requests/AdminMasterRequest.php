<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\User;
use App\Models\Penugasan;
use App\Models\Provitas;
use App\Models\LuasAreal;
use Illuminate\Validation\Validator;

class AdminMasterRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->role === 'admin'; }
    public function rules(): array
    {
        $update = $this->isMethod('put') || $this->isMethod('patch');
        $sometimes = $update ? ['sometimes'] : ['required'];
        if ($this->routeIs('users.*')) {
            return [
                'nama' => [...$sometimes, 'string', 'max:255'],
                'email' => [...$sometimes, 'email', Rule::unique('users', 'email')->ignore($this->route('user'))],
                'password' => [$update ? 'nullable' : 'required', 'string', 'min:8'],
                'role' => [...$sometimes, Rule::in(['ppl', 'admin'])],
            ];
        }
        if ($this->routeIs('kecamatan.*')) {
            return ['kode' => [...$sometimes, 'string', Rule::unique('kecamatan', 'kode')->ignore($this->route('kecamatan'))], 'nama' => [...$sometimes, 'string']];
        }
        if ($this->routeIs('desa.*')) {
            return ['kecamatan_id' => [...$sometimes, 'uuid', 'exists:kecamatan,id'], 'kode' => [...$sometimes, 'string', Rule::unique('desa', 'kode')->ignore($this->route('desa'))], 'nama' => [...$sometimes, 'string']];
        }
        if ($this->routeIs('lahan.*')) {
            return ['desa_id' => [...$sometimes, 'uuid', 'exists:desa,id'], 'nama_petani' => [...$sometimes, 'string'], 'kode_sampel' => [...$sometimes, 'string', Rule::unique('lahan', 'kode_sampel')->ignore($this->route('lahan'))], 'luas_lahan_ha' => [...$sometimes, 'numeric', 'gte:0'], 'latitude' => ['nullable', 'numeric'], 'longitude' => ['nullable', 'numeric']];
        }
        if ($this->routeIs('musim-tanam.*')) {
            return ['nama' => [...$sometimes, 'string'], 'tanggal_mulai' => [...$sometimes, 'date'], 'tanggal_selesai' => [...$sometimes, 'date', 'after_or_equal:tanggal_mulai']];
        }
        if ($this->routeIs('penugasan.*')) {
            return [
                'user_id' => [...$sometimes, 'uuid', 'exists:users,id', function ($attribute, $value, $fail) {
                    if (! User::whereKey($value)->where('role', 'ppl')->exists()) $fail('Penugasan hanya boleh untuk user ber-role ppl.');
                }],
                'kecamatan_id' => [...$sometimes, 'uuid', 'exists:kecamatan,id'],
                'tanggal_mulai' => [...$sometimes, 'date'],
                'tanggal_selesai' => ['nullable', 'date', 'after_or_equal:tanggal_mulai'],
            ];
        }
        if ($this->routeIs('provitas.*')) {
            return [
                'ppl_id' => [...$sometimes, 'uuid', 'exists:users,id', function ($attribute, $value, $fail) {
                    if (! User::whereKey($value)->where('role', 'ppl')->exists()) $fail('Catatan provitas harus dimiliki akun PPL.');
                }],
                'lahan_id' => [...$sometimes, 'uuid', 'exists:lahan,id'],
                'musim_tanam_id' => [...$sometimes, 'uuid', 'exists:musim_tanam,id'],
                'tanggal_panen' => [...$sometimes, 'date'],
                'luas_petak_m2' => [...$sometimes, 'numeric', 'gt:0', 'max:999999.99'],
                'berat_gabah_kg' => [...$sometimes, 'numeric', 'gte:0', 'max:999999.99'],
                'kadar_air' => ['nullable', 'numeric', 'between:0,100'],
                'catatan' => ['nullable', 'string'],
            ];
        }
        if ($this->routeIs('luas-areal.*')) {
            return [
                'ppl_id' => [...$sometimes, 'uuid', 'exists:users,id', function ($attribute, $value, $fail) {
                    if (! User::whereKey($value)->where('role', 'ppl')->exists()) $fail('Laporan luas areal harus dimiliki akun PPL.');
                }],
                'desa_id' => [...$sometimes, 'uuid', 'exists:desa,id'],
                'tahun' => [...$sometimes, 'integer', 'between:2000,2100'],
                'bulan' => [...$sometimes, 'integer', 'between:1,12'],
                'luas_tanam_ha' => [...$sometimes, 'numeric', 'gte:0', 'max:99999999.99'],
                'luas_panen_ha' => [...$sometimes, 'numeric', 'gte:0', 'max:99999999.99'],
                'luas_puso_ha' => ['nullable', 'numeric', 'gte:0', 'max:99999999.99'],
                'catatan' => ['nullable', 'string'],
            ];
        }
        return [];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (! $this->routeIs('penugasan.*') || $validator->errors()->isNotEmpty()) return;
            $query = Penugasan::where('user_id', $this->input('user_id'))
                ->where('kecamatan_id', $this->input('kecamatan_id'));
            if ($this->route('penugasan')) $query->where('id', '!=', $this->route('penugasan'));
            $start = $this->date('tanggal_mulai');
            $end = $this->date('tanggal_selesai');
            $overlap = $query->whereDate('tanggal_mulai', '<=', $end ?? '9999-12-31')
                ->where(function ($q) use ($start) {
                    $q->whereNull('tanggal_selesai')->orWhereDate('tanggal_selesai', '>=', $start);
                })->exists();
            if ($overlap) $validator->errors()->add('tanggal_mulai', 'Penugasan aktif tidak boleh tumpang tindih.');
        });

        $validator->after(function (Validator $validator) {
            if (! $this->routeIs('provitas.*') || $validator->errors()->isNotEmpty()) return;

            $routeId = $this->route('provita') ?? $this->route('provitas');
            $existing = $routeId ? Provitas::find($routeId) : null;
            $value = fn (string $key) => $this->input($key, $existing?->{$key});
            $lahanId = $value('lahan_id');
            $musimTanamId = $value('musim_tanam_id');
            $luasPetak = $value('luas_petak_m2');
            $beratGabah = $value('berat_gabah_kg');

            if ($lahanId && $musimTanamId) {
                $duplicate = Provitas::where('lahan_id', $lahanId)
                    ->where('musim_tanam_id', $musimTanamId)
                    ->where('deleted', false)
                    ->when($routeId, fn ($query) => $query->where('id', '!=', $routeId))
                    ->exists();
                if ($duplicate) {
                    $validator->errors()->add('lahan_id', 'Lahan ini sudah memiliki catatan provitas pada musim tanam tersebut.');
                }
            }

            if (is_numeric($luasPetak) && (float) $luasPetak > 0 && is_numeric($beratGabah)) {
                $provitas = ((float) $beratGabah / (float) $luasPetak) * 100;
                if ($provitas > 1000) {
                    $validator->errors()->add('berat_gabah_kg', 'Nilai provitas hasil perhitungan melebihi batas kewajaran.');
                }
            }
        });

        $validator->after(function (Validator $validator) {
            if (! $this->routeIs('luas-areal.*') || $validator->errors()->isNotEmpty()) return;

            $routeId = $this->route('luas_areal')
                ?? $this->route('luas-areal')
                ?? $this->route('luasAreal');
            $existing = $routeId ? LuasAreal::find($routeId) : null;
            $desaId = $this->input('desa_id', $existing?->desa_id);
            $tahun = $this->input('tahun', $existing?->tahun);
            $bulan = $this->input('bulan', $existing?->bulan);

            if ($desaId && $tahun && $bulan) {
                $duplicate = LuasAreal::where('desa_id', $desaId)
                    ->where('tahun', $tahun)
                    ->where('bulan', $bulan)
                    ->when($routeId, fn ($query) => $query->where('id', '!=', $routeId))
                    ->exists();
                if ($duplicate) {
                    $validator->errors()->add('desa_id', 'Desa ini sudah memiliki laporan untuk bulan dan tahun tersebut.');
                }
            }
        });
    }
}
