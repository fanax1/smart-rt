<?php

namespace App\Http\Controllers;

use App\Events\TicketCreated;
use App\Events\TicketMessageSent;
use App\Events\TicketTyping;
use App\Models\Ticket;
use App\Models\TicketMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class TicketController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $isLoggedIn = (bool) $user;

        if ($isLoggedIn && $user->role === 'warga') {
            // Citizen format
            $validated = $request->validate([
                'nama_lengkap' => ['required', 'string', 'max:100'],
                'whatsapp' => ['required', 'string', 'max:20'],
                'no_rumah' => ['required', 'string', 'max:30'],
                'judul' => ['required', 'string', 'max:180'],
                'kategori' => [
                    'required',
                    Rule::in([
                        'Surat Pengantar',
                        'Administrasi Kependudukan',
                        'Kegiatan RT',
                        'Iuran',
                        'Fasilitas Lingkungan',
                        'Pengaduan',
                        'Keamanan',
                        'Lainnya'
                    ])
                ],
                'lampiran' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            ]);

            $keperluan = null;
            $pesan = $validated['judul']; // Use title as default detail
            $email = $user->email;
        } else {
            // Public Guest format
            $validated = $request->validate([
                'nama_lengkap' => ['required', 'string', 'max:100'],
                'email' => ['required', 'email', 'max:100'],
                'whatsapp' => ['required', 'string', 'max:20'],
                'keperluan' => ['required', 'string', 'max:255'],
                'kategori' => [
                    'required',
                    Rule::in([
                        'Surat Pengantar',
                        'Administrasi Kependudukan',
                        'Kegiatan RT',
                        'Iuran',
                        'Fasilitas Lingkungan',
                        'Pengaduan',
                        'Keamanan',
                        'Lainnya'
                    ])
                ],
                'judul' => ['required', 'string', 'max:180'],
                'pesan' => ['required', 'string'],
                'lampiran' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            ]);

            $keperluan = $validated['keperluan'];
            $pesan = $validated['pesan'];
            $email = $validated['email'];
        }

        // Upload attachment if exists
        $lampiranPath = null;
        $lampiranName = null;
        if ($request->hasFile('lampiran')) {
            $file = $request->file('lampiran');
            $lampiranPath = $file->store('tickets/lampiran', 'public');
            $lampiranName = $file->getClientOriginalName();
        }

        // Generate Ticket Number: TKT-YYYY-XXXXXX
        $year = now()->format('Y');
        $prefix = 'TKT-' . $year;
        $count = Ticket::where('nomor_tiket', 'like', $prefix . '-%')->count() + 1;
        $nomorTiket = $prefix . '-' . str_pad((string) $count, 6, '0', STR_PAD_LEFT);

        $ticket = Ticket::create([
            'nomor_tiket' => $nomorTiket,
            'user_id' => $user?->id,
            'nama_lengkap' => $validated['nama_lengkap'],
            'whatsapp' => $validated['whatsapp'],
            'no_rumah' => $validated['no_rumah'] ?? null,
            'email' => $email,
            'keperluan' => $keperluan,
            'kategori' => $validated['kategori'],
            'judul' => $validated['judul'],
            'pesan' => $pesan,
            'lampiran_path' => $lampiranPath,
            'lampiran_original_name' => $lampiranName,
            'status' => 'Menunggu Admin',
        ]);

        // Broadcast Event to Admin channel
        broadcast(new TicketCreated($ticket))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Tiket berhasil dibuat.',
            'ticket' => [
                'nomor_tiket' => $ticket->nomor_tiket,
                'status' => $ticket->status,
                'nama_lengkap' => $ticket->nama_lengkap,
            ]
        ], 201);
    }

    public function show(string $nomor_tiket): JsonResponse
    {
        $ticket = Ticket::where('nomor_tiket', $nomor_tiket)->firstOrFail();

        if ($ticket->user_id !== null && (!auth()->check() || auth()->id() !== $ticket->user_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $messages = $ticket->messages()->orderBy('created_at', 'asc')->get()->map(function ($msg) {
            return [
                'id' => $msg->id,
                'is_admin' => $msg->is_admin,
                'message' => $msg->message,
                'created_at' => $msg->created_at->format('H:i'),
            ];
        });

        // Check if there is a logged in user of this ticket
        $user = auth()->user();
        $ticketActive = ($ticket->status !== 'Selesai');

        return response()->json([
            'ticket' => [
                'nomor_tiket' => $ticket->nomor_tiket,
                'nama_lengkap' => $ticket->nama_lengkap,
                'status' => $ticket->status,
                'kategori' => $ticket->kategori,
                'judul' => $ticket->judul,
                'pesan' => $ticket->pesan,
                'whatsapp' => $ticket->whatsapp,
                'no_rumah' => $ticket->no_rumah,
                'email' => $ticket->email,
                'keperluan' => $ticket->keperluan,
                'lampiran_url' => $ticket->lampiran_path ? asset('storage/' . $ticket->lampiran_path) : null,
                'lampiran_name' => $ticket->lampiran_original_name,
            ],
            'messages' => $messages,
            'active' => $ticketActive,
        ]);
    }

    public function sendMessage(Request $request, string $nomor_tiket): JsonResponse
    {
        $ticket = Ticket::where('nomor_tiket', $nomor_tiket)->firstOrFail();

        if ($ticket->user_id !== null && (!auth()->check() || auth()->id() !== $ticket->user_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($ticket->status === 'Selesai') {
            return response()->json(['error' => 'Tiket ini sudah diselesaikan.'], 403);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $user = $request->user();

        $message = $ticket->messages()->create([
            'sender_id' => $user?->id,
            'is_admin' => false,
            'message' => $validated['message'],
        ]);

        // Broadcast to ticket channel
        broadcast(new TicketMessageSent($message))->toOthers();

        return response()->json([
            'id' => $message->id,
            'is_admin' => false,
            'message' => $message->message,
            'created_at' => $message->created_at->format('H:i'),
        ], 201);
    }

    public function typing(Request $request, string $nomor_tiket): JsonResponse
    {
        $ticket = Ticket::where('nomor_tiket', $nomor_tiket)->firstOrFail();

        if ($ticket->user_id !== null && (!auth()->check() || auth()->id() !== $ticket->user_id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($ticket->status === 'Selesai') {
            return response()->json(['error' => 'Tiket ini sudah ditutup.'], 403);
        }

        $validated = $request->validate([
            'is_typing' => ['required', 'boolean'],
        ]);

        broadcast(new TicketTyping($ticket->nomor_tiket, false, $validated['is_typing']))->toOthers();

        return response()->json(['success' => true]);
    }

    public function getActiveTicket(): JsonResponse
    {
        $user = auth()->user();

        if (! $user) {
            return response()->json(['ticket' => null]);
        }

        $ticket = Ticket::where('user_id', $user->id)
            ->whereIn('status', ['Menunggu Admin', 'Diproses'])
            ->latest()
            ->first();

        if (! $ticket) {
            return response()->json(['ticket' => null]);
        }

        return response()->json([
            'ticket' => [
                'nomor_tiket' => $ticket->nomor_tiket,
                'status' => $ticket->status,
            ]
        ]);
    }
}
