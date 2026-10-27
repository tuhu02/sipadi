<?php
namespace App\Http\Controllers;
use App\Models\Desa;
class DesaController extends AdminCrudController { protected function model(): string { return Desa::class; } }
