<?php

namespace App\Events;

use App\Models\Ticket;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketCreated implements ShouldBroadcast
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
            new Channel('admin.tickets'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'ticket' => [
                'id' => $this->ticket->id,
                'nomor_tiket' => $this->ticket->nomor_tiket,
                'nama_lengkap' => $this->ticket->nama_lengkap,
                'kategori' => $this->ticket->kategori,
                'judul' => $this->ticket->judul,
                'status' => $this->ticket->status,
                'created_at' => $this->ticket->created_at->toISOString(),
            ],
        ];
    }
}
