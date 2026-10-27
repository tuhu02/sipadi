<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\User;
use App\Models\Penugasan;
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
    }
}
