<?php

namespace App\Events;

use App\Models\TicketMessage;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketMessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public TicketMessage $message;

    public function __construct(TicketMessage $message)
    {
        $this->message = $message;
    }

    public function broadcastOn(): array
    {
        $nomorTiket = $this->message->ticket->nomor_tiket;
        return [
            new Channel('ticket.' . $nomorTiket),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'message' => [
                'id' => $this->message->id,
                'ticket_id' => $this->message->ticket_id,
                'sender_id' => $this->message->sender_id,
                'is_admin' => $this->message->is_admin,
                'message' => $this->message->message,
                'created_at' => $this->message->created_at->toISOString(),
            ],
        ];
    }
}
