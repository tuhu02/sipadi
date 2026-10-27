<?php
namespace App\Http\Controllers;
use App\Models\User;
class UserController extends AdminCrudController { protected function model(): string { return User::class; } }
