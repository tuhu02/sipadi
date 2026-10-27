<?php

namespace Tests\Feature;

use App\Models\Desa;
use App\Models\Kecamatan;
use App\Models\Lahan;
use App\Models\LuasAreal;
use App\Models\MusimTanam;
use App\Models\Penugasan;
use App\Models\Provitas;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use RefreshDatabase;

    private User $ppl;
    private Lahan $lahan;
    private MusimTanam $musim;

    protected function setUp(): void
    {
        parent::setUp();
        $this->ppl = User::create(['nama' => 'PPL', 'email' => 'ppl@test.local', 'password' => Hash::make('password'), 'role' => 'ppl']);
        $kecamatan = Kecamatan::create(['kode' => 'K1', 'nama' => 'Kecamatan 1']);
        $desa = Desa::create(['kecamatan_id' => $kecamatan->id, 'kode' => 'D1', 'nama' => 'Desa 1']);
        $this->lahan = Lahan::create(['desa_id' => $desa->id, 'nama_petani' => 'Petani', 'kode_sampel' => 'S1', 'luas_lahan_ha' => 1]);
        $this->musim = MusimTanam::create(['nama' => 'MT 1', 'tanggal_mulai' => '2026-01-01', 'tanggal_selesai' => '2026-06-30']);
        Penugasan::create(['user_id' => $this->ppl->id, 'kecamatan_id' => $kecamatan->id, 'tanggal_mulai' => '2026-01-01']);
    }

    public function test_login_success_and_failure(): void
    {
        $this->postJson('/api/login', ['email' => 'ppl@test.local', 'password' => 'password'])->assertOk()->assertJsonStructure(['token', 'user']);
        $this->postJson('/api/login', ['email' => 'ppl@test.local', 'password' => 'wrong'])->assertStatus(422)->assertJson(['message' => 'Email atau password salah']);
    }

    public function test_reference_is_limited_to_assigned_area(): void
    {
        $outside = Kecamatan::create(['kode' => 'K2', 'nama' => 'Kecamatan 2']);
        $outsideDesa = Desa::create(['kecamatan_id' => $outside->id, 'kode' => 'D2', 'nama' => 'Desa 2']);
        $token = $this->ppl->createToken('test')->plainTextToken;
        $this->withToken($token)->getJson('/api/referensi')->assertOk()
            ->assertJsonCount(1, 'kecamatan')
            ->assertJsonPath('kecamatan.0.id', $this->lahan->desa->kecamatan_id)
            ->assertJsonCount(1, 'desa')->assertJsonPath('desa.0.id', $this->lahan->desa_id)
            ->assertJsonMissing(['id' => $outsideDesa->id]);
    }

    public function test_sync_is_idempotent_and_recalculates_productivity(): void
    {
        $id = fake()->uuid();
        $payload = ['id' => $id, 'lahan_id' => $this->lahan->id, 'musim_tanam_id' => $this->musim->id, 'tanggal_panen' => '2026-05-01',
            'luas_petak_m2' => 100, 'berat_gabah_kg' => 50, 'kadar_air' => 20, 'status' => 'submitted',
            'updated_at' => '2026-05-01T10:00:00Z', 'deleted' => false, 'provitas_kuha' => 9999];
        $token = $this->ppl->createToken('test')->plainTextToken;
        $this->withToken($token)->postJson('/api/sync', ['provitas' => [$payload]])->assertOk();
        $this->withToken($token)->postJson('/api/sync', ['provitas' => [$payload]])->assertOk();
        $this->assertDatabaseCount('provitas', 1)->assertDatabaseHas('provitas', ['id' => $id, 'provitas_kuha' => 50, 'status' => 'submitted']);
    }

    public function test_sync_accepts_luas_areal_report_idempotently(): void
    {
        $id = fake()->uuid();
        $payload = [
            'id' => $id,
            'desa_id' => $this->lahan->desa_id,
            'tahun' => 2026,
            'bulan' => 5,
            'luas_tanam_ha' => 12.5,
            'luas_panen_ha' => 10.25,
            'luas_puso_ha' => 0.5,
            'catatan' => 'Rekap bulan Mei',
            'status' => 'submitted',
            'updated_at' => '2026-05-31T10:00:00Z',
            'deleted' => false,
        ];
        $token = $this->ppl->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/sync', ['luas_areal' => [$payload]])
            ->assertOk()
            ->assertJsonPath('hasil.luas_areal.0.status', 'diterima');
        $this->withToken($token)->postJson('/api/sync', ['luas_areal' => [$payload]])
            ->assertOk()
            ->assertJsonPath('hasil.luas_areal.0.status', 'diterima');

        $this->assertDatabaseCount('luas_areal', 1)
            ->assertDatabaseHas('luas_areal', [
                'id' => $id,
                'ppl_id' => $this->ppl->id,
                'luas_tanam_ha' => 12.5,
                'luas_panen_ha' => 10.25,
                'status' => 'submitted',
            ]);
    }

    public function test_verified_luas_areal_cannot_be_changed_by_ppl(): void
    {
        $record = LuasAreal::create([
            'id' => fake()->uuid(),
            'desa_id' => $this->lahan->desa_id,
            'ppl_id' => $this->ppl->id,
            'tahun' => 2026,
            'bulan' => 5,
            'luas_tanam_ha' => 12.5,
            'luas_panen_ha' => 10,
            'luas_puso_ha' => 0.5,
            'status' => 'verified',
            'updated_at' => now(),
        ]);
        $token = $this->ppl->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/sync', ['luas_areal' => [[
            'id' => $record->id,
            'desa_id' => $this->lahan->desa_id,
            'tahun' => 2026,
            'bulan' => 5,
            'luas_tanam_ha' => 20,
            'luas_panen_ha' => 15,
            'luas_puso_ha' => 1,
            'status' => 'submitted',
            'updated_at' => now()->addMinute()->toISOString(),
        ]]])->assertJsonPath('hasil.luas_areal.0.status', 'ditolak');

        $this->assertDatabaseHas('luas_areal', [
            'id' => $record->id,
            'luas_tanam_ha' => 12.5,
            'status' => 'verified',
        ]);
    }

    public function test_ppl_cannot_access_admin_routes(): void
    {
        $token = $this->ppl->createToken('test')->plainTextToken;
        $this->withToken($token)->getJson('/api/rekap/kecamatan')->assertForbidden();
    }

    public function test_admin_can_review_pending_submissions(): void
    {
        $admin = User::create([
            'nama' => 'Admin',
            'email' => 'admin@test.local',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);
        $provitas = Provitas::create([
            'id' => fake()->uuid(),
            'lahan_id' => $this->lahan->id,
            'musim_tanam_id' => $this->musim->id,
            'ppl_id' => $this->ppl->id,
            'tanggal_panen' => '2026-05-01',
            'luas_petak_m2' => 100,
            'berat_gabah_kg' => 50,
            'provitas_kuha' => 50,
            'status' => 'submitted',
            'updated_at' => now(),
        ]);
        $area = LuasAreal::create([
            'id' => fake()->uuid(),
            'desa_id' => $this->lahan->desa_id,
            'ppl_id' => $this->ppl->id,
            'tahun' => 2026,
            'bulan' => 5,
            'luas_tanam_ha' => 12.5,
            'luas_panen_ha' => 10,
            'luas_puso_ha' => 0.5,
            'status' => 'submitted',
            'updated_at' => now(),
        ]);
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/verifikasi/provitas')
            ->assertOk()
            ->assertJsonPath('data.0.ppl.nama', 'PPL')
            ->assertJsonPath('data.0.lahan.desa.nama', 'Desa 1');
        $this->withToken($token)->getJson('/api/verifikasi/luas-areal')
            ->assertOk()
            ->assertJsonPath('data.0.desa.nama', 'Desa 1')
            ->assertJsonPath('data.0.ppl.nama', 'PPL');

        $this->withToken($token)->postJson("/api/verifikasi/provitas/{$provitas->id}/setujui")
            ->assertOk()
            ->assertJsonPath('status', 'verified');
        $this->withToken($token)->postJson("/api/verifikasi/luas-areal/{$area->id}/tolak", [
            'catatan_verifikasi' => 'Periksa kembali luas panen.',
        ])->assertOk()
            ->assertJsonPath('status', 'rejected')
            ->assertJsonPath('catatan_verifikasi', 'Periksa kembali luas panen.');

        $this->assertDatabaseHas('provitas', [
            'id' => $provitas->id,
            'verified_by' => $admin->id,
            'status' => 'verified',
        ]);
        $this->assertDatabaseHas('luas_areal', [
            'id' => $area->id,
            'verified_by' => $admin->id,
            'status' => 'rejected',
        ]);
    }

    public function test_verified_record_cannot_be_changed_by_ppl(): void
    {
        $record = Provitas::create(['id' => fake()->uuid(), 'lahan_id' => $this->lahan->id, 'musim_tanam_id' => $this->musim->id,
            'ppl_id' => $this->ppl->id, 'tanggal_panen' => '2026-05-01', 'luas_petak_m2' => 100, 'berat_gabah_kg' => 50,
            'provitas_kuha' => 50, 'status' => 'verified', 'updated_at' => now()]);
        $token = $this->ppl->createToken('test')->plainTextToken;
        $this->withToken($token)->postJson('/api/sync', ['provitas' => [['id' => $record->id, 'lahan_id' => $this->lahan->id,
            'musim_tanam_id' => $this->musim->id, 'tanggal_panen' => '2026-05-01', 'luas_petak_m2' => 100,
            'berat_gabah_kg' => 60, 'status' => 'submitted', 'updated_at' => now()->addMinute()->toISOString()]]])
            ->assertJsonPath('hasil.provitas.0.status', 'ditolak');
    }
}
