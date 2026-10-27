<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('users', function (Blueprint $table): void {
                $table->enum('role', ['ppl', 'admin'])->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::table('users')->where('role', 'admin')->update(['role' => 'sp']);

            Schema::table('users', function (Blueprint $table): void {
                $table->enum('role', ['ppl', 'sp'])->change();
            });
        }
    }
};
