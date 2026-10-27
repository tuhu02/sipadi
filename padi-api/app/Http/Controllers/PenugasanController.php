<?php
namespace App\Http\Controllers;
use App\Models\Penugasan;
class PenugasanController extends AdminCrudController { protected function model(): string { return Penugasan::class; } }
