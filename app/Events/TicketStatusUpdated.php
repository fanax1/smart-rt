<?php

namespace App\Events;

use App\Models\Ticket;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Ticket $ticket;

    public function __construct(Ticket $ticket)
    {
        $this->ticket = $ticket;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('ticket.' . $this->ticket->nomor_tiket),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'status' => $this->ticket->status,
            'nomor_tiket' => $this->ticket->nomor_tiket,
        ];
    }
}
