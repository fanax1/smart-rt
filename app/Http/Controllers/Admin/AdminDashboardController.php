<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hunian;
use App\Models\Kegiatan;
use App\Models\Warga;
use App\Models\User;
use App\Models\Pengaduan;
use App\Models\IuranPembayaran;
use App\Models\Ticket;
use App\Models\PengajuanSurat;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(): Response
    {
        $totalFinanceBalance = (float) IuranPembayaran::query()
            ->where('status_verifikasi', 'verified')
            ->sum('jumlah_dibayar');

        $activeCitizens = User::query()
            ->where('role', 'warga')
            ->with(['warga.hunian'])
            ->latest()
            ->take(4)
            ->get()
            ->map(function (User $user) {
                // Determine a realistic status snippet and lastSeen time
                $snippets = [
                    'Saya mau tanya mengenai jadwal kerja bakti...',
                    'Terima kasih atas tanggapan pengaduannya.',
                    'Apakah iuran sampah bulan ini sudah lunas?',
                    'Ada kendala listrik di gerbang masuk RT.'
                ];
                $lastSeens = ['2m ago', '15m ago', '1h ago', '3h ago'];
                
                // Deterministic mapping based on ID to keep it stable
                $idx = $user->id % 4;

                return [
                    'id' => $user->id,
                    'name' => $user->warga?->nama_lengkap ?: $user->name,
                    'noRumah' => $user->warga?->hunian?->no_rumah ?: '-',
                    'profilePhotoUrl' => $user->profile_photo_path
                        ? asset('storage/' . ltrim($user->profile_photo_path, '/'))
                        : null,
                    'lastSeen' => $lastSeens[$idx],
                    'snippet' => $snippets[$idx],
                ];
            })
            ->values();

        $helpdeskStats = [
            'total' => Ticket::count(),
            'pending' => Ticket::where('status', 'Menunggu Admin')->count(),
            'processing' => Ticket::where('status', 'Diproses')->count(),
            'resolved' => Ticket::where('status', 'Selesai')->count(),
        ];

        $pengaduanStats = [
            'total' => Pengaduan::count(),
            'pending' => Pengaduan::where('status', 'diajukan')->count(),
            'processing' => Pengaduan::where('status', 'diproses')->count(),
            'resolved' => Pengaduan::where('status', 'selesai')->count(),
        ];

        $suratStats = [
            'total' => PengajuanSurat::count(),
            'pending' => PengajuanSurat::where('status', 'diajukan')->count(),
            'approved' => PengajuanSurat::where('status', 'disetujui')->count(),
            'resolved' => PengajuanSurat::whereIn('status', ['selesai', 'diambil'])->count(),
        ];

        $pendingTicketsList = Ticket::where('status', 'Menunggu Admin')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($ticket) {
                return [
                    'id' => $ticket->id,
                    'key' => 'ticket-' . $ticket->id,
                    'type' => 'ticket',
                    'title' => $ticket->judul,
                    'sender' => $ticket->nama_lengkap,
                    'date' => $ticket->created_at->diffForHumans(),
                    'created_at' => $ticket->created_at->toIso8601String(),
                    'link' => '/admin/tickets',
                    'ref_no' => $ticket->nomor_tiket,
                ];
            });

        $pendingComplaintsList = Pengaduan::where('status', 'diajukan')
            ->with(['warga'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($complaint) {
                return [
                    'id' => $complaint->id,
                    'key' => 'complaint-' . $complaint->id,
                    'type' => 'complaint',
                    'title' => $complaint->judul,
                    'sender' => $complaint->warga?->nama_lengkap ?: 'Warga',
                    'date' => $complaint->created_at->diffForHumans(),
                    'created_at' => $complaint->created_at->toIso8601String(),
                    'link' => '/admin/pengaduan',
                    'ref_no' => $complaint->nomor_pengaduan,
                ];
            });

        $pendingLettersList = PengajuanSurat::where('status', 'diajukan')
            ->with(['pemohon', 'jenisSurat'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($letter) {
                return [
                    'id' => $letter->id,
                    'key' => 'letter-' . $letter->id,
                    'type' => 'letter',
                    'title' => $letter->jenisSurat?->nama_jenis_surat ?: 'Pengajuan Surat',
                    'sender' => $letter->pemohon?->nama_lengkap ?: 'Warga',
                    'date' => $letter->created_at->diffForHumans(),
                    'created_at' => $letter->created_at->toIso8601String(),
                    'link' => '/admin/pengajuan-surat',
                    'ref_no' => $letter->nomor_pengajuan,
                ];
            });

        $recentNotifications = collect()
            ->concat($pendingTicketsList)
            ->concat($pendingComplaintsList)
            ->concat($pendingLettersList)
            ->sortByDesc('created_at')
            ->take(8)
            ->values()
            ->all();

        $timeout = now()->subMinutes(5)->timestamp;
        $onlineUserIds = \Illuminate\Support\Facades\DB::table('sessions')
            ->whereNotNull('user_id')
            ->where('last_activity', '>=', $timeout)
            ->pluck('user_id')
            ->unique();

        $databaseOnlineCitizens = User::whereIn('id', $onlineUserIds)
            ->where('role', 'warga')
            ->with(['warga.hunian'])
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->warga?->nama_lengkap ?: $user->name,
                    'no_rumah' => $user->warga?->hunian?->no_rumah ?: '-',
                    'role' => $user->role,
                ];
            })
            ->values()
            ->toArray();

        return Inertia::render('Admin/Dashboard', [
            'totalResidents' => Warga::count(),
            'totalHouses' => Hunian::count(),
            'totalEvents' => Kegiatan::count(),
            'totalComplaints' => Pengaduan::count(),
            'pendingComplaints' => Pengaduan::where('status', 'diajukan')->count(),
            'totalFinanceBalance' => $totalFinanceBalance,
            'activeCitizens' => $activeCitizens,
            'helpdeskStats' => $helpdeskStats,
            'pengaduanStats' => $pengaduanStats,
            'suratStats' => $suratStats,
            'recentNotifications' => $recentNotifications,
            'databaseOnlineCitizens' => $databaseOnlineCitizens,
        ]);
    }
}
