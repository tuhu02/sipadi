<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminMasterRequest;
use App\Models\Provitas;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProvitasController extends AdminCrudController
{
    protected function model(): string
    {
        return Provitas::class;
    }

    public function index(Request $request)
    {
        return Provitas::where('deleted', false)
            ->orderByDesc('tanggal_panen')
            ->paginate($request->integer('per_page', 15));
    }

    public function show(string $id)
    {
        return response()->json(Provitas::where('deleted', false)->findOrFail($id));
    }

    public function store(AdminMasterRequest $request)
    {
        $values = $request->validated();
        $values['id'] = (string) Str::uuid();
        $values['provitas_kuha'] = $this->calculateProvitas(
            (float) $values['luas_petak_m2'],
            (float) $values['berat_gabah_kg'],
        );
        $values['created_at'] = now();
        $values['updated_at'] = now();
        $values['synced_at'] = now();
        $values['deleted'] = false;

        return response()->json(Provitas::create($values), 201);
    }

    public function update(AdminMasterRequest $request, string $id)
    {
        $record = Provitas::where('deleted', false)->findOrFail($id);
        $values = $request->validated();
        $luasPetak = (float) ($values['luas_petak_m2'] ?? $record->luas_petak_m2);
        $beratGabah = (float) ($values['berat_gabah_kg'] ?? $record->berat_gabah_kg);

        $values['provitas_kuha'] = $this->calculateProvitas($luasPetak, $beratGabah);
        $values['updated_at'] = now();
        $values['synced_at'] = now();
        $record->update($values);

        return response()->json($record->refresh());
    }

    public function destroy(string $id)
    {
        $record = Provitas::where('deleted', false)->findOrFail($id);
        $record->update([
            'deleted' => true,
            'updated_at' => now(),
            'synced_at' => now(),
        ]);

        return response()->json([], 204);
    }

    private function calculateProvitas(float $luasPetak, float $beratGabah): float
    {
        return round(($beratGabah / $luasPetak) * 100, 2);
    }
}
