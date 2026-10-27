<?php

namespace Tests\Feature;

use App\Models\Desa;
use App\Models\Kecamatan;
use App\Models\Lahan;
use App\Models\Penugasan;
use App\Models\User;
use Illuminate\Broadcasting\BroadcastEvent;
use Illuminate\Broadcasting\BroadcastManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Illuminate\Notifications\Events\BroadcastNotificationCreated;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $ppl;

    private User $otherPpl;

    private User $inactivePpl;

    private User $futurePpl;

    private Kecamatan $kecamatan;

    private Kecamatan $otherKecamatan;

    private Desa $desa;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(now()->setDate(2026, 10, 24)->startOfDay());

        $this->admin = $this->createUser('admin', 'admin@test.local');
        $this->ppl = $this->createUser('ppl', 'ppl@test.local');
        $this->otherPpl = $this->createUser('ppl', 'other-ppl@test.local');
        $this->inactivePpl = $this->createUser('ppl', 'inactive-ppl@test.local');
        $this->futurePpl = $this->createUser('ppl', 'future-ppl@test.local');
        $this->kecamatan = Kecamatan::create(['kode' => 'K1', 'nama' => 'Kecamatan Satu']);
        $this->otherKecamatan = Kecamatan::create(['kode' => 'K2', 'nama' => 'Kecamatan Dua']);
        $this->desa = Desa::create([
            'kecamatan_id' => $this->kecamatan->id,
            'kode' => 'D1',
            'nama' => 'Desa Satu',
        ]);

        Penugasan::create([
            'user_id' => $this->ppl->id,
            'kecamatan_id' => $this->kecamatan->id,
            'tanggal_mulai' => '2026-01-01',
        ]);
        Penugasan::create([
            'user_id' => $this->otherPpl->id,
            'kecamatan_id' => $this->otherKecamatan->id,
            'tanggal_mulai' => '2026-01-01',
        ]);
        Penugasan::create([
            'user_id' => $this->inactivePpl->id,
            'kecamatan_id' => $this->kecamatan->id,
            'tanggal_mulai' => '2026-01-01',
            'tanggal_selesai' => '2026-10-23',
        ]);
        Penugasan::create([
            'user_id' => $this->futurePpl->id,
            'kecamatan_id' => $this->kecamatan->id,
            'tanggal_mulai' => '2026-10-25',
        ]);
    }

    public function test_adding_a_village_notifies_only_ppl_assigned_to_its_district(): void
    {
        Queue::fake([BroadcastEvent::class]);

        $this->withToken($this->admin->createToken('admin')->plainTextToken)
            ->postJson('/api/desa', [
                'kecamatan_id' => $this->kecamatan->id,
                'kode' => 'D2',
                'nama' => 'Desa Baru',
            ])
            ->assertCreated();

        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->ppl->id,
            'notifiable_type' => User::class,
        ]);
        $this->assertDatabaseMissing('notifications', [
            'notifiable_id' => $this->otherPpl->id,
            'notifiable_type' => User::class,
        ]);
        $this->assertDatabaseMissing('notifications', [
            'notifiable_id' => $this->inactivePpl->id,
            'notifiable_type' => User::class,
        ]);
        $this->assertDatabaseMissing('notifications', [
            'notifiable_id' => $this->futurePpl->id,
            'notifiable_type' => User::class,
        ]);

        $this->assertSame(
            'master_data_added',
            $this->ppl->notifications()->firstOrFail()->data['event'],
        );
        Queue::assertPushed(BroadcastEvent::class, function (BroadcastEvent $job): bool {
            return $job->event instanceof BroadcastNotificationCreated
                && $job->event->data['resource_type'] === 'desa';
        });
    }

    public function test_adding_a_field_notifies_ppl_assigned_to_the_field_district(): void
    {
        $this->withToken($this->admin->createToken('admin')->plainTextToken)
            ->postJson('/api/lahan', [
                'desa_id' => $this->desa->id,
                'nama_petani' => 'Petani Baru',
                'kode_sampel' => 'S-NEW',
                'luas_lahan_ha' => 1.25,
            ])
            ->assertCreated();

        $notification = $this->ppl->notifications()->firstOrFail();

        $this->assertSame('lahan', $notification->data['resource_type']);
        $this->assertSame($this->desa->id, $notification->data['desa_id']);
        $this->assertSame(0, $this->otherPpl->notifications()->count());
    }

    public function test_notification_inbox_and_read_state_are_scoped_to_the_authenticated_user(): void
    {
        $this->ppl->notify(new \App\Notifications\MasterDataAdded([
            'event' => 'master_data_added',
            'title' => 'Desa baru tersedia',
            'message' => 'Desa baru ditambahkan.',
            'resource_type' => 'desa',
            'resource_id' => $this->desa->id,
            'kecamatan_id' => $this->kecamatan->id,
            'desa_id' => $this->desa->id,
            'nama' => $this->desa->nama,
        ]));
        $notification = $this->ppl->notifications()->firstOrFail();
        $pplToken = $this->ppl->createToken('ppl')->plainTextToken;
        $otherToken = $this->otherPpl->createToken('other-ppl')->plainTextToken;

        $this->withToken($pplToken)->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonPath('unread_count', 1)
            ->assertJsonPath('data.0.id', $notification->id)
            ->assertJsonPath('data.0.data.event', 'master_data_added');
        $this->app['auth']->forgetGuards();
        $this->withToken($otherToken)->postJson("/api/notifications/{$notification->id}/read")
            ->assertNotFound();
        $this->app['auth']->forgetGuards();
        $this->withToken($pplToken)->postJson("/api/notifications/{$notification->id}/read")
            ->assertOk()
            ->assertJsonPath('data.id', $notification->id);

        $this->assertNotNull($this->ppl->notifications()->findOrFail($notification->id)->read_at);
    }

    public function test_private_channel_authentication_uses_the_users_uuid(): void
    {
        config([
            'broadcasting.default' => 'reverb',
            'broadcasting.connections.reverb.key' => 'test-key',
            'broadcasting.connections.reverb.secret' => 'test-secret',
            'broadcasting.connections.reverb.app_id' => 'test-app',
            'broadcasting.connections.reverb.options' => [
                'host' => '127.0.0.1',
                'port' => 8080,
                'scheme' => 'http',
                'useTLS' => false,
            ],
        ]);
        $this->app[BroadcastManager::class]->forgetDrivers();
        require base_path('routes/channels.php');

        $pplToken = $this->ppl->createToken('ppl')->plainTextToken;
        $channel = 'private-App.Models.User.'.$this->ppl->id;

        $this->withToken($pplToken)->postJson('/api/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => $channel,
        ])->assertOk();

        $this->withToken($pplToken)->postJson('/api/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-App.Models.User.'.$this->otherPpl->id,
        ])->assertForbidden();
    }

    public function test_all_notifications_can_be_marked_read(): void
    {
        $this->ppl->notify(new \App\Notifications\MasterDataAdded([
            'event' => 'master_data_added',
            'title' => 'Desa baru tersedia',
            'message' => 'Desa baru ditambahkan.',
            'resource_type' => 'desa',
            'resource_id' => $this->desa->id,
            'kecamatan_id' => $this->kecamatan->id,
            'desa_id' => $this->desa->id,
            'nama' => $this->desa->nama,
        ]));
        $token = $this->ppl->createToken('ppl')->plainTextToken;

        $this->withToken($token)->postJson('/api/notifications/read-all')
            ->assertOk()
            ->assertJson(['message' => 'Semua notifikasi telah ditandai dibaca.']);

        $this->assertSame(0, $this->ppl->unreadNotifications()->count());
    }

    private function createUser(string $role, string $email): User
    {
        return User::create([
            'nama' => strtoupper($role),
            'email' => $email,
            'password' => Hash::make('password'),
            'role' => $role,
        ]);
    }
}
