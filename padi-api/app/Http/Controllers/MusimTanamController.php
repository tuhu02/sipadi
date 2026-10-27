<?php
namespace App\Http\Controllers;
use App\Models\MusimTanam;
class MusimTanamController extends AdminCrudController { protected function model(): string { return MusimTanam::class; } }
