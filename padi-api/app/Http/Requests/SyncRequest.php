<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SyncRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'provitas' => ['array'],
            'provitas.*' => ['array'],
            'luas_areal' => ['array'],
            'luas_areal.*' => ['array'],
            'last_sync' => ['nullable', 'date'],
        ];
    }
}
