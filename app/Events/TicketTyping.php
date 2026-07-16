<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $nomorTiket;
    public bool $isAdmin;
    public bool $isTyping;

    public function __construct(string $nomorTiket, bool $isAdmin, bool $isTyping)
    {
        $this->nomorTiket = $nomorTiket;
        $this->isAdmin = $isAdmin;
        $this->isTyping = $isTyping;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('ticket.' . $this->nomorTiket),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'is_admin' => $this->isAdmin,
            'is_typing' => $this->isTyping,
        ];
    }
}
