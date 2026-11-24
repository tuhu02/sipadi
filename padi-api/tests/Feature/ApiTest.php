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
use Illuminate\Support\Facades\Schema;
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

    public function test_report_tables_do_not_have_verification_fields(): void
    {
        foreach (['provitas', 'luas_areal'] as $table) {
            $this->assertFalse(Schema::hasColumn($table, 'status'));
            $this->assertFalse(Schema::hasColumn($table, 'verified_by'));
            $this->assertFalse(Schema::hasColumn($table, 'verified_at'));
            $this->assertFalse(Schema::hasColumn($table, 'catatan_verifikasi'));
        }
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
            'luas_petak_m2' => 100, 'berat_gabah_kg' => 50, 'kadar_air' => 20,
            'updated_at' => '2026-05-01T10:00:00Z', 'deleted' => false, 'provitas_kuha' => 9999];
        $token = $this->ppl->createToken('test')->plainTextToken;
        $this->withToken($token)->postJson('/api/sync', ['provitas' => [$payload]])->assertOk();
        $this->withToken($token)->postJson('/api/sync', ['provitas' => [$payload]])->assertOk();
        $this->assertDatabaseCount('provitas', 1)->assertDatabaseHas('provitas', ['id' => $id, 'provitas_kuha' => 50]);
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
            'updated_at' => '2026-05-31T10:00:00Z',
            'deleted' => false,
        ];
        $token = $this->ppl->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/sync', ['luas_areal' => [$payload]])
            ->assertOk()
            ->assertJsonPath('hasil.luas_areal.0.hasil_sync', 'diterima');
        $this->withToken($token)->postJson('/api/sync', ['luas_areal' => [$payload]])
            ->assertOk()
            ->assertJsonPath('hasil.luas_areal.0.hasil_sync', 'diterima');

        $this->assertDatabaseCount('luas_areal', 1)
            ->assertDatabaseHas('luas_areal', [
                'id' => $id,
                'ppl_id' => $this->ppl->id,
                'luas_tanam_ha' => 12.5,
                'luas_panen_ha' => 10.25,
            ]);
    }

    public function test_ppl_can_edit_luas_areal(): void
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
            'updated_at' => now()->addMinute()->toISOString(),
        ]]])->assertJsonPath('hasil.luas_areal.0.hasil_sync', 'diterima');

        $this->assertDatabaseHas('luas_areal', [
            'id' => $record->id,
            'luas_tanam_ha' => 20,
        ]);
    }

    public function test_ppl_cannot_access_admin_routes(): void
    {
        $token = $this->ppl->createToken('test')->plainTextToken;
        $this->withToken($token)->getJson('/api/rekap/kecamatan')->assertForbidden();
    }

    public function test_admin_can_create_update_and_delete_provitas(): void
    {
        $admin = User::create([
            'nama' => 'Admin',
            'email' => 'admin@test.local',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);
        $token = $admin->createToken('test')->plainTextToken;
        $payload = [
            'ppl_id' => $this->ppl->id,
            'lahan_id' => $this->lahan->id,
            'musim_tanam_id' => $this->musim->id,
            'tanggal_panen' => '2026-05-01',
            'luas_petak_m2' => 100,
            'berat_gabah_kg' => 50,
            'kadar_air' => 20,
            'catatan' => 'Ubinan dicatat admin.',
        ];

        $response = $this->withToken($token)->postJson('/api/provitas', $payload)
            ->assertCreated();
        $id = $response->json('id');
        $this->assertDatabaseHas('provitas', [
            'id' => $id,
            'ppl_id' => $this->ppl->id,
            'provitas_kuha' => 50,
            'deleted' => false,
        ]);

        $this->withToken($token)->postJson('/api/provitas', [
            ...$payload,
            'tanggal_panen' => '2026-05-02',
        ])->assertUnprocessable();

        $this->withToken($token)->putJson("/api/provitas/{$id}", [
            ...$payload,
            'berat_gabah_kg' => 60,
        ])->assertOk();
        $this->assertDatabaseHas('provitas', [
            'id' => $id,
            'berat_gabah_kg' => 60,
            'provitas_kuha' => 60,
        ]);

        $this->withToken($token)->deleteJson("/api/provitas/{$id}")
            ->assertNoContent();
        $this->assertDatabaseHas('provitas', [
            'id' => $id,
            'deleted' => true,
        ]);
        $this->withToken($token)->getJson('/api/provitas')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_admin_can_create_update_and_delete_luas_areal(): void
    {
        $admin = User::create([
            'nama' => 'Admin',
            'email' => 'admin-areal@test.local',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);
        $token = $admin->createToken('test')->plainTextToken;
        $payload = [
            'ppl_id' => $this->ppl->id,
            'desa_id' => $this->lahan->desa_id,
            'tahun' => 2026,
            'bulan' => 5,
            'luas_tanam_ha' => 25,
            'luas_panen_ha' => 20,
            'luas_puso_ha' => 2,
            'catatan' => 'Laporan dibuat admin.',
        ];

        $response = $this->withToken($token)->postJson('/api/luas-areal', $payload)
            ->assertCreated();
        $id = $response->json('id');
        $this->assertDatabaseHas('luas_areal', [
            'id' => $id,
            'ppl_id' => $this->ppl->id,
            'desa_id' => $this->lahan->desa_id,
            'luas_tanam_ha' => 25,
            'deleted' => false,
        ]);

        $this->withToken($token)->postJson('/api/luas-areal', $payload)
            ->assertUnprocessable();

        $this->withToken($token)->putJson("/api/luas-areal/{$id}", [
            ...$payload,
            'luas_panen_ha' => 18,
        ])->assertOk();
        $this->assertDatabaseHas('luas_areal', [
            'id' => $id,
            'luas_panen_ha' => 18,
        ]);

        $this->withToken($token)->deleteJson("/api/luas-areal/{$id}")
            ->assertNoContent();
        $this->assertDatabaseHas('luas_areal', [
            'id' => $id,
            'deleted' => true,
        ]);
        $this->withToken($token)->getJson('/api/luas-areal')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_ppl_cannot_manage_provitas_directly(): void
    {
        $token = $this->ppl->createToken('test')->plainTextToken;
        $this->withToken($token)->getJson('/api/provitas')->assertForbidden();
    }

    public function test_ppl_can_only_sync_one_provitas_per_lahan_and_season(): void
    {
        $token = $this->ppl->createToken('test')->plainTextToken;
        $baseRecord = [
            'lahan_id' => $this->lahan->id,
            'musim_tanam_id' => $this->musim->id,
            'luas_petak_m2' => 100,
            'berat_gabah_kg' => 50,
            'updated_at' => '2026-05-01T10:00:00Z',
        ];
        $existingId = fake()->uuid();

        $this->withToken($token)->postJson('/api/sync', ['provitas' => [[
            ...$baseRecord,
            'id' => $existingId,
            'tanggal_panen' => '2026-05-01',
        ]]])->assertJsonPath('hasil.provitas.0.hasil_sync', 'diterima');

        $this->withToken($token)->postJson('/api/sync', ['provitas' => [[
            ...$baseRecord,
            'id' => fake()->uuid(),
            'tanggal_panen' => '2026-05-02',
            'updated_at' => '2026-05-02T10:00:00Z',
        ]]])->assertJsonPath('hasil.provitas.0.hasil_sync', 'ditolak')
            ->assertJsonPath('hasil.provitas.0.alasan', 'duplikat')
            ->assertJsonPath('hasil.provitas.0.versi_server.id', $existingId);

        $this->assertDatabaseCount('provitas', 1);
    }

    public function test_ppl_can_edit_provitas(): void
    {
        $record = Provitas::create(['id' => fake()->uuid(), 'lahan_id' => $this->lahan->id, 'musim_tanam_id' => $this->musim->id,
            'ppl_id' => $this->ppl->id, 'tanggal_panen' => '2026-05-01', 'luas_petak_m2' => 100, 'berat_gabah_kg' => 50,
            'provitas_kuha' => 50, 'updated_at' => now()]);
        $token = $this->ppl->createToken('test')->plainTextToken;
        $this->withToken($token)->postJson('/api/sync', ['provitas' => [['id' => $record->id, 'lahan_id' => $this->lahan->id,
            'musim_tanam_id' => $this->musim->id, 'tanggal_panen' => '2026-05-01', 'luas_petak_m2' => 100,
            'berat_gabah_kg' => 60, 'updated_at' => now()->addMinute()->toISOString()]]])
            ->assertJsonPath('hasil.provitas.0.hasil_sync', 'diterima');
        $this->assertDatabaseHas('provitas', [
            'id' => $record->id,
            'berat_gabah_kg' => 60,
            'provitas_kuha' => 60,
        ]);
    }
}
