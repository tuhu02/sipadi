<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ReferensiController;
use App\Http\Controllers\SyncController;
use App\Http\Controllers\VerifikasiController;
use App\Http\Controllers\RekapController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\KecamatanController;
use App\Http\Controllers\DesaController;
use App\Http\Controllers\LahanController;
use App\Http\Controllers\MusimTanamController;
use App\Http\Controllers\PenugasanController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/referensi', ReferensiController::class);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/sync', SyncController::class)->middleware('role:ppl');
    Route::middleware('role:admin')->group(function () {
        Route::get('/verifikasi/provitas', [VerifikasiController::class, 'provitas']);
        Route::get('/verifikasi/luas-areal', [VerifikasiController::class, 'luasAreal']);
        Route::post('/verifikasi/{type}/{id}/{action}', function (\Illuminate\Http\Request $request, $type, $id, $action) {
            abort_unless(in_array($type, ['provitas', 'luas-areal'], true) && in_array($action, ['setujui', 'tolak'], true), 404);
            return app(VerifikasiController::class)->action($request, $type === 'luas-areal' ? 'luas_areal' : $type, $id, $action === 'setujui' ? 'verified' : 'rejected');
        });
        Route::get('/rekap/kecamatan', [RekapController::class, 'kecamatan']);
        Route::apiResource('users', UserController::class);
        Route::apiResource('kecamatan', KecamatanController::class);
        Route::apiResource('desa', DesaController::class);
        Route::apiResource('lahan', LahanController::class);
        Route::apiResource('musim-tanam', MusimTanamController::class);
        Route::apiResource('penugasan', PenugasanController::class);
    });
});
