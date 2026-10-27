<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class MasterDataAdded extends Notification
{
    /**
     * @param array{
     *     event: string,
     *     title: string,
     *     message: string,
     *     resource_type: string,
     *     resource_id: string,
     *     kecamatan_id: string,
     *     desa_id: string|null,
     *     nama: string
     * } $data
     */
    public function __construct(public array $data)
    {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return $this->data;
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->data);
    }

    public function broadcastType(): string
    {
        return 'master-data-added';
    }
}
