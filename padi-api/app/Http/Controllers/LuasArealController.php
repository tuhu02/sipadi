<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminMasterRequest;
use App\Models\LuasAreal;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LuasArealController extends AdminCrudController
{
    protected function model(): string
    {
        return LuasAreal::class;
    }

    public function index(Request $request)
    {
        return LuasAreal::where('deleted', false)
            ->orderByDesc('tahun')
            ->orderByDesc('bulan')
            ->paginate($request->integer('per_page', 15));
    }

    public function show(string $id)
    {
        return response()->json(LuasAreal::where('deleted', false)->findOrFail($id));
    }

    public function store(AdminMasterRequest $request)
    {
        $values = $request->validated();
        $values['id'] = (string) Str::uuid();
        $values['created_at'] = now();
        $values['updated_at'] = now();
        $values['synced_at'] = now();
        $values['deleted'] = false;

        return response()->json(LuasAreal::create($values), 201);
    }

    public function update(AdminMasterRequest $request, string $id)
    {
        $record = LuasAreal::where('deleted', false)->findOrFail($id);
        $record->update([
            ...$request->validated(),
            'updated_at' => now(),
            'synced_at' => now(),
        ]);

        return response()->json($record->refresh());
    }

    public function destroy(string $id)
    {
        $record = LuasAreal::where('deleted', false)->findOrFail($id);
        $record->update([
            'deleted' => true,
            'updated_at' => now(),
            'synced_at' => now(),
        ]);

        return response()->json([], 204);
    }
}
