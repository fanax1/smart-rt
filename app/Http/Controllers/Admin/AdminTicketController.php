<?php

namespace App\Http\Controllers\Admin;

use App\Events\TicketMessageSent;
use App\Events\TicketStatusUpdated;
use App\Events\TicketTyping;
use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminTicketController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Ticket::query();

        // Filter search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('nomor_tiket', 'like', "%{$search}%")
                  ->orWhere('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('whatsapp', 'like', "%{$search}%")
                  ->orWhere('judul', 'like', "%{$search}%");
            });
        }

        // Filter status
        $status = $request->input('status', 'all');
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $tickets = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        // Calculate counts
        $summary = [
            'total' => Ticket::count(),
            'baru' => Ticket::where('status', 'Menunggu Admin')->count(),
            'proses' => Ticket::where('status', 'Diproses')->count(),
            'selesai' => Ticket::where('status', 'Selesai')->count(),
        ];

        return Inertia::render('Admin/Tickets', [
            'tickets' => $tickets,
            'filters' => $request->only(['search', 'status']),
            'summary' => $summary,
        ]);
    }

    public function show(Ticket $ticket): JsonResponse
    {
        $messages = $ticket->messages()->orderBy('created_at', 'asc')->get()->map(function ($msg) {
            return [
                'id' => $msg->id,
                'is_admin' => $msg->is_admin,
                'message' => $msg->message,
                'created_at' => $msg->created_at->format('H:i'),
            ];
        });

        return response()->json([
            'ticket' => [
                'id' => $ticket->id,
                'nomor_tiket' => $ticket->nomor_tiket,
                'nama_lengkap' => $ticket->nama_lengkap,
                'whatsapp' => $ticket->whatsapp,
                'no_rumah' => $ticket->no_rumah,
                'email' => $ticket->email,
                'keperluan' => $ticket->keperluan,
                'kategori' => $ticket->kategori,
                'judul' => $ticket->judul,
                'pesan' => $ticket->pesan,
                'status' => $ticket->status,
                'lampiran_url' => $ticket->lampiran_path ? asset('storage/' . $ticket->lampiran_path) : null,
                'lampiran_name' => $ticket->lampiran_original_name,
                'created_at' => $ticket->created_at->format('d M Y H:i'),
            ],
            'messages' => $messages,
        ]);
    }

    public function startConversation(Ticket $ticket): JsonResponse
    {
        if ($ticket->status !== 'Menunggu Admin') {
            return response()->json(['error' => 'Tiket sudah diproses atau ditutup.'], 403);
        }

        $ticket->update(['status' => 'Diproses']);

        // Create system message
        $systemMsg = $ticket->messages()->create([
            'sender_id' => auth()->id(),
            'is_admin' => true,
            'message' => 'Admin telah bergabung dalam percakapan.',
        ]);

        // Broadcast status updated event
        broadcast(new TicketStatusUpdated($ticket))->toOthers();
        broadcast(new TicketMessageSent($systemMsg))->toOthers();

        return response()->json([
            'success' => true,
            'status' => $ticket->status,
            'system_message' => [
                'id' => $systemMsg->id,
                'is_admin' => true,
                'message' => $systemMsg->message,
                'created_at' => $systemMsg->created_at->format('H:i'),
            ]
        ]);
    }

    public function closeTicket(Ticket $ticket): JsonResponse
    {
        if ($ticket->status === 'Selesai') {
            return response()->json(['error' => 'Tiket sudah diselesaikan sebelumnya.'], 403);
        }

        $ticket->update(['status' => 'Selesai']);

        // Create system message
        $systemMsg = $ticket->messages()->create([
            'sender_id' => auth()->id(),
            'is_admin' => true,
            'message' => 'Tiket telah diselesaikan oleh Admin.',
        ]);

        // Broadcast status updated event
        broadcast(new TicketStatusUpdated($ticket))->toOthers();
        broadcast(new TicketMessageSent($systemMsg))->toOthers();

        return response()->json([
            'success' => true,
            'status' => $ticket->status,
            'system_message' => [
                'id' => $systemMsg->id,
                'is_admin' => true,
                'message' => $systemMsg->message,
                'created_at' => $systemMsg->created_at->format('H:i'),
            ]
        ]);
    }

    public function sendMessage(Request $request, Ticket $ticket): JsonResponse
    {
        if ($ticket->status === 'Selesai') {
            return response()->json(['error' => 'Tiket ini sudah ditutup.'], 403);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $message = $ticket->messages()->create([
            'sender_id' => auth()->id(),
            'is_admin' => true,
            'message' => $validated['message'],
        ]);

        // Broadcast to ticket channel
        broadcast(new TicketMessageSent($message))->toOthers();

        return response()->json([
            'id' => $message->id,
            'is_admin' => true,
            'message' => $message->message,
            'created_at' => $message->created_at->format('H:i'),
        ], 201);
    }

    public function typing(Request $request, Ticket $ticket): JsonResponse
    {
        if ($ticket->status === 'Selesai') {
            return response()->json(['error' => 'Tiket ini sudah ditutup.'], 403);
        }

        $validated = $request->validate([
            'is_typing' => ['required', 'boolean'],
        ]);

        broadcast(new TicketTyping($ticket->nomor_tiket, true, $validated['is_typing']))->toOthers();

        return response()->json(['success' => true]);
    }
}
