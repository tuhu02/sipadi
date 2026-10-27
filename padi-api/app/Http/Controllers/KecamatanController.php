<?php
namespace App\Http\Controllers;
use App\Models\Kecamatan;
class KecamatanController extends AdminCrudController { protected function model(): string { return Kecamatan::class; } }
