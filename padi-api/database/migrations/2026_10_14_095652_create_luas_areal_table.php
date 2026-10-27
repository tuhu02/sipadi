<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('luas_areal', function (Blueprint $table) {
            // ID dibuat di klien (crypto.randomUUID), bukan oleh Laravel
            $table->uuid('id')->primary();

            $table->foreignUuid('desa_id')->constrained('desa');
            $table->foreignUuid('ppl_id')->constrained('users');

            $table->smallInteger('tahun');
            $table->tinyInteger('bulan'); // 1-12
            $table->decimal('luas_tanam_ha', 10, 2)->default(0);
            $table->decimal('luas_panen_ha', 10, 2)->default(0);
            $table->decimal('luas_puso_ha', 10, 2)->nullable();
            $table->text('catatan')->nullable();

            // verifikasi: hanya boleh diubah SP di server
            $table->enum('status', ['draft', 'submitted', 'verified', 'rejected'])->default('draft');
            $table->foreignUuid('verified_by')->nullable()->constrained('users');
            $table->dateTime('verified_at')->nullable();
            $table->text('catatan_verifikasi')->nullable();

            // kolom sinkronisasi
            $table->dateTime('created_at')->nullable();
            $table->dateTime('updated_at');             // waktu ubah di klien
            $table->boolean('deleted')->default(false);  // soft delete
            $table->dateTime('synced_at')->nullable();   // diisi server

            // satu laporan per desa per bulan
            $table->unique(['desa_id', 'tahun', 'bulan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('luas_areal');
    }
};