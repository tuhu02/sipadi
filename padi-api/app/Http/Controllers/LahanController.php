<?php
namespace App\Http\Controllers;
use App\Models\Lahan;
class LahanController extends AdminCrudController { protected function model(): string { return Lahan::class; } }
