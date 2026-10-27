<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provitas', function (Blueprint $table) {
            // ID dibuat di klien (crypto.randomUUID), bukan oleh Laravel
            $table->uuid('id')->primary();

            $table->foreignUuid('lahan_id')->constrained('lahan');
            $table->foreignUuid('musim_tanam_id')->constrained('musim_tanam');
            $table->foreignUuid('ppl_id')->constrained('users');

            $table->date('tanggal_panen');
            $table->decimal('luas_petak_m2', 8, 2);
            $table->decimal('berat_gabah_kg', 8, 2);
            $table->decimal('kadar_air', 5, 2)->nullable();
            $table->decimal('provitas_kuha', 8, 2);
            $table->text('catatan')->nullable();

            $table->enum('status', ['draft', 'submitted', 'verified', 'rejected'])->default('draft');
            $table->foreignUuid('verified_by')->nullable()->constrained('users');
            $table->dateTime('verified_at')->nullable();
            $table->text('catatan_verifikasi')->nullable();

            $table->dateTime('created_at')->nullable();
            $table->dateTime('updated_at');
            $table->boolean('deleted')->default(false);
            $table->dateTime('synced_at')->nullable();

            $table->unique(['lahan_id', 'musim_tanam_id', 'tanggal_panen']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provitas');
    }
};