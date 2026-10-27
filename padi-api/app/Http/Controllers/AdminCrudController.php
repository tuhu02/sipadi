<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminMasterRequest;
use App\Models\Desa;
use App\Models\Lahan;
use App\Services\MasterDataNotificationService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

abstract class AdminCrudController extends Controller
{
    abstract protected function model(): string;

    public function index(Request $request)
    {
        return response()->json($this->model()::query()->paginate($request->integer('per_page', 15)));
    }
    public function store(AdminMasterRequest $request)
    {
        $record = $this->model()::create($request->validated());

        if ($record instanceof Desa || $record instanceof Lahan) {
            app(MasterDataNotificationService::class)->notifyAssignedPpl($record);
        }

        return response()->json($record, 201);
    }
    public function show(string $id) { return response()->json($this->model()::findOrFail($id)); }
    public function update(AdminMasterRequest $request, string $id)
    {
        $record = $this->model()::findOrFail($id);
        $record->update($request->validated());
        return response()->json($record->refresh());
    }
    public function destroy(string $id)
    {
        $record = $this->model()::findOrFail($id);
        $record->delete();
        return response()->json([], 204);
    }
}
