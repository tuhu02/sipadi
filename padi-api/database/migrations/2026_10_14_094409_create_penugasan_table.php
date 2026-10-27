<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('penugasan', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users');
            $table->foreignUuid('kecamatan_id')->constrained('kecamatan');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai')->nullable(); // null = masih bertugas
            $table->timestamps();

            $table->unique(['user_id', 'kecamatan_id', 'tanggal_mulai']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penugasan');
    }
};