<?php

namespace App\Http\Controllers\Warga;

use App\Http\Controllers\Controller;
use App\Models\IuranKomponen;
use App\Models\IuranPembayaran;
use App\Models\JenisSurat;
use App\Models\Kegiatan;
use App\Models\KegiatanPartisipasi;
use App\Models\PengajuanSurat;
use App\Models\Pengumuman;
use App\Models\PengajuanSuratFile;
use App\Models\Pengaduan;
use App\Models\PengaduanFile;
use App\Models\WargaProfileChangeLog;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WargaController extends Controller
{
    public function dashboard(Request $request): Response
    {
        $context = $this->wargaContext($request);
        $wargaId = $request->user()?->warga?->id;
        $kkId = $request->user()?->warga?->kartu_keluarga_id;

        $events = $this->upcomingEvents($wargaId)->take(3)->values();
        $billingSummary = $this->currentBillingSummary($request);
        $complaintSummary = $this->currentComplaintSummary($request);

        // Calculate iuran details
        $periode = Carbon::now()->startOfMonth();
        $totalIuran = 0.0;
        $billingStatus = 'Belum Bayar';

        if ($kkId) {
            $totalIuran = (float) IuranKomponen::query()
                ->where('is_active', true)
                ->sum('nominal');

            $paidThisMonth = (float) IuranPembayaran::query()
                ->where('kartu_keluarga_id', $kkId)
                ->whereDate('periode', $periode->toDateString())
                ->where('status_verifikasi', 'verified')
                ->sum('jumlah_dibayar');

            $pendingThisMonth = (float) IuranPembayaran::query()
                ->where('kartu_keluarga_id', $kkId)
                ->whereDate('periode', $periode->toDateString())
                ->where('status_verifikasi', 'pending')
                ->sum('jumlah_dibayar');

            $billingStatus = $this->paymentStatus($paidThisMonth, $pendingThisMonth, $totalIuran);
        }

        // Calculate points dynamically
        $points = 1000;
        if ($wargaId) {
            $joinedEventsCount = KegiatanPartisipasi::query()
                ->where('warga_id', $wargaId)
                ->where('status', 'ikut')
                ->count();
            $points += $joinedEventsCount * 250;
        }

        $latestAnnouncements = Pengumuman::query()
            ->publishedForWarga()
            ->latest('published_at')
            ->latest('id')
            ->take(3)
            ->get()
            ->map(fn (Pengumuman $p) => [
                'id'          => $p->id,
                'judul'       => $p->judul,
                'kategori'    => $p->kategori,
                'publishedAt' => $p->published_at?->toDateTimeString(),
                'isi'         => Str::limit(strip_tags($p->isi), 100),
            ])
            ->values();

        return Inertia::render('Warga/Dashboard', [
            ...$context,
            'familyCount'          => count($context['anggotaKeluarga']),
            'unpaidBillsCount'     => $billingSummary['unpaidBillsCount'],
            'activeComplaintsCount' => $complaintSummary['activeComplaintsCount'],
            'latestAnnouncements'  => $latestAnnouncements,
            'upcomingEvents'       => $events,
            'billingAmount'        => $totalIuran,
            'billingStatus'        => $billingStatus,
            'billingPeriod'        => $periode->translatedFormat('F Y'),
            'points'               => $points,
        ]);
    }

    public function dataKeluarga(Request $request): Response
    {
        $context = $this->wargaContext($request);
        $wargaIds = collect($context['anggotaKeluarga'])->pluck('id');

        $logs = WargaProfileChangeLog::query()
            ->with(['user', 'editor'])
            ->whereIn('warga_id', $wargaIds)
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($log) {
                $editorName = $log->editor ? $log->editor->name : ($log->user ? $log->user->name : 'Sistem');
                $fieldName = Str::headline($log->field);

                $targetWarga = \App\Models\Warga::find($log->warga_id);
                $wargaName = $targetWarga ? $targetWarga->nama_lengkap : 'Warga';

                return [
                    'id' => $log->id,
                    'title' => "Pembaruan {$fieldName} ({$wargaName})",
                    'description' => "Mengubah dari '" . ($log->old_value ?? '-') . "' menjadi '" . ($log->new_value ?? '-') . "'",
                    'date' => $log->created_at?->format('d M Y'),
                    'editor' => $editorName,
                ];
            })->values();

        if ($logs->count() < 2 && $request->user()?->warga?->kartuKeluarga) {
            $kkDate = $request->user()?->warga?->kartuKeluarga->created_at;
            $formattedKkDate = $kkDate ? $kkDate->format('d F Y') : now()->format('d F Y');

            $logs->push([
                'id' => 'system-kk',
                'title' => 'Scan KK Digital Terverifikasi',
                'description' => 'Sistem memverifikasi dokumen KK digital secara otomatis.',
                'date' => $formattedKkDate,
                'editor' => 'Sistem Otomatis',
            ]);
        }

        return Inertia::render('Warga/DataKeluarga', [
            ...$context,
            'recentActivities' => $logs,
        ]);
    }

    public function iuran(Request $request): Response
    {
        $context = $this->wargaContext($request);
        $kkId = $request->user()?->warga?->kartu_keluarga_id;

        if (! $kkId) {
            return Inertia::render('Warga/Iuran', [
                ...$context,
                'currentBills' => [],
                'payments' => [],
            ]);
        }

        $periode = Carbon::now()->startOfMonth();

        $totalIuran = (float) IuranKomponen::query()
            ->where('is_active', true)
            ->sum('nominal');

        $paidThisMonth = (float) IuranPembayaran::query()
            ->where('kartu_keluarga_id', $kkId)
            ->whereDate('periode', $periode->toDateString())
            ->where('status_verifikasi', 'verified')
            ->sum('jumlah_dibayar');

        $pendingThisMonth = (float) IuranPembayaran::query()
            ->where('kartu_keluarga_id', $kkId)
            ->whereDate('periode', $periode->toDateString())
            ->where('status_verifikasi', 'pending')
            ->sum('jumlah_dibayar');

        $sisaTagihan = max(0, $totalIuran - $paidThisMonth);
        $status = $this->paymentStatus($paidThisMonth, $pendingThisMonth, $totalIuran);

        $payment = IuranPembayaran::query()
            ->where('kartu_keluarga_id', $kkId)
            ->whereDate('periode', $periode->toDateString())
            ->first();

        $currentBills = [];

        if ($totalIuran > 0) {
            $currentBills[] = [
                'id' => 1,
                'title' => 'Iuran Bulanan ' . $periode->translatedFormat('F Y'),
                'period' => $periode->format('Y-m'),
                'amount' => $sisaTagihan,
                'dueDate' => $periode->copy()->endOfMonth()->format('Y-m-d'),
                'status' => $status,
                'rawStatus' => $payment ? $payment->status_verifikasi : 'belum_bayar',
                'proofUrl' => $payment && $payment->bukti_pembayaran ? Storage::url($payment->bukti_pembayaran) : null,
                'notes' => $payment ? $payment->catatan_verifikasi : null,
            ];
        }

        $payments = IuranPembayaran::query()
            ->where('kartu_keluarga_id', $kkId)
            ->orderByDesc('tanggal_bayar')
            ->orderByDesc('id')
            ->get()
            ->map(fn (IuranPembayaran $p) => [
                'id' => $p->id,
                'title' => 'Pembayaran Iuran ' . Carbon::parse($p->periode)->translatedFormat('F Y'),
                'date' => $p->tanggal_bayar?->format('Y-m-d'),
                'amount' => (float) $p->jumlah_dibayar,
                'method' => $p->metode_pembayaran,
                'status' => $this->paymentVerificationLabel($p->status_verifikasi),
                'rawStatus' => $p->status_verifikasi,
                'proofUrl' => $p->bukti_pembayaran ? Storage::url($p->bukti_pembayaran) : null,
            ])->values();

        $billComponents = IuranKomponen::query()
            ->where('is_active', true)
            ->orderBy('urutan')
            ->orderBy('id')
            ->get()
            ->map(fn (IuranKomponen $c) => [
                'id' => $c->id,
                'name' => $c->nama,
                'amount' => (float) $c->nominal,
                'note' => $c->keterangan,
            ])->values();

        return Inertia::render('Warga/Iuran', [
            ...$context,
            'currentBills' => $currentBills,
            'payments' => $payments,
            'billComponents' => $billComponents,
        ]);
    }

    public function uploadBuktiIuran(Request $request): RedirectResponse
{
    $user = $request->user();
    $warga = $user?->warga;
    $kkId = $warga?->kartu_keluarga_id;

    if (! $kkId) {
        abort(403, 'Akun Anda belum terhubung dengan kartu keluarga.');
    }

    $validated = $request->validate([
        'period' => ['required', 'date_format:Y-m'],
        'amount' => ['required', 'numeric', 'min:1'],
        'metode_pembayaran' => ['required', 'string', 'max:100'],
        'bukti_pembayaran' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:2048'],
        'catatan' => ['nullable', 'string', 'max:1000'],
    ]);

    $periode = Carbon::createFromFormat('Y-m', $validated['period'])->startOfMonth();

    $payment = IuranPembayaran::query()
        ->where('kartu_keluarga_id', $kkId)
        ->whereDate('periode', $periode->toDateString())
        ->first();

    if ($payment && $payment->bukti_pembayaran) {
        Storage::disk('public')->delete($payment->bukti_pembayaran);
    }

    $path = $request->file('bukti_pembayaran')->store('bukti-iuran', 'public');

    if (! $payment) {
        $payment = IuranPembayaran::create([
            'kartu_keluarga_id' => $kkId,
            'periode' => $periode->toDateString(),
            'jumlah_dibayar' => $validated['amount'],
            'tanggal_bayar' => now()->toDateString(),
            'metode_pembayaran' => $validated['metode_pembayaran'],
            'status_verifikasi' => 'pending',
            'bukti_pembayaran' => $path,
            'catatan' => $validated['catatan'] ?? null,
            'catatan_verifikasi' => null,
            'created_by' => $user->id,
            'verified_by' => null,
            'verified_at' => null,
        ]);
    } else {
        $payment->update([
            'jumlah_dibayar' => $validated['amount'],
            'tanggal_bayar' => now()->toDateString(),
            'metode_pembayaran' => $validated['metode_pembayaran'],
            'status_verifikasi' => 'pending',
            'bukti_pembayaran' => $path,
            'catatan' => $validated['catatan'] ?? null,
            'catatan_verifikasi' => null,
            'created_by' => $user->id,
            'verified_by' => null,
            'verified_at' => null,
        ]);
    }

    return redirect()
        ->route('warga.iuran')
        ->with('success', 'Bukti pembayaran berhasil dikirim dan menunggu verifikasi admin.');
}

    public function pengumuman(Request $request): Response
    {
        $context = $this->wargaContext($request);

        $filters = [
            'search' => (string) $request->query('search', ''),
            'kategori' => (string) $request->query('kategori', 'all'),
        ];

        $query = Pengumuman::query()
            ->with(['files', 'creator'])
            ->publishedForWarga()
            ->latest('published_at')
            ->latest('id');

        if ($filters['search'] !== '') {
            $query->where(function ($builder) use ($filters) {
                $builder->where('judul', 'like', '%' . $filters['search'] . '%')
                    ->orWhere('isi', 'like', '%' . $filters['search'] . '%')
                    ->orWhere('kategori', 'like', '%' . $filters['search'] . '%');
            });
        }

        if ($filters['kategori'] !== 'all') {
            $query->where('kategori', $filters['kategori']);
        }

        $announcements = $query->get();

        $categories = Pengumuman::query()
            ->publishedForWarga()
            ->select('kategori')
            ->distinct()
            ->orderBy('kategori')
            ->pluck('kategori')
            ->filter()
            ->values();

        return Inertia::render('Warga/Pengumuman', [
            ...$context,
            'announcements' => $announcements->map(fn (Pengumuman $pengumuman) => [
                'id' => $pengumuman->id,
                'judul' => $pengumuman->judul,
                'isi' => $pengumuman->isi,
                'kategori' => $pengumuman->kategori,
                'publishedAt' => $pengumuman->published_at?->toDateTimeString(),
                'creator' => $pengumuman->creator?->name,
                'files' => $pengumuman->files->map(fn ($file) => [
                    'id' => $file->id,
                    'originalName' => $file->original_name,
                    'url' => Storage::url($file->path),
                    'mimeType' => $file->mime_type,
                    'size' => (int) $file->size,
                ])->values(),
            ])->values(),
            'filters' => $filters,
            'categories' => $categories,
        ]);
    }

    public function kegiatan(Request $request): Response
    {
        $pastEvents = Kegiatan::query()
            ->where('status_kegiatan', 'Selesai')
            ->orderByDesc('tanggal')
            ->limit(6)
            ->get()
            ->map(fn (Kegiatan $kegiatan) => [
                'id' => (int) $kegiatan->id,
                'title' => $kegiatan->judul,
                'date' => $kegiatan->tanggal?->format('Y-m-d'),
                'time' => trim(($kegiatan->jam_mulai ?: '-') . ' - ' . ($kegiatan->jam_selesai ?: '-')),
                'location' => $kegiatan->lokasi,
                'category' => $kegiatan->kategori,
                'status' => $kegiatan->status_kegiatan,
                'description' => $kegiatan->deskripsi,
                'participantsCount' => $kegiatan->partisipasis()->where('status', 'ikut')->count(),
                'imageUrl' => $kegiatan->poster ? Storage::url($kegiatan->poster) : null,
            ])->values();

        return Inertia::render('Warga/Kegiatan', [
            ...$this->wargaContext($request),
            'events' => $this->upcomingEvents($request->user()?->warga?->id),
            'pastEvents' => $pastEvents,
        ]);
    }

    public function ikutKegiatan(Request $request, Kegiatan $kegiatan): RedirectResponse
    {
        $user = $request->user();
        $warga = $user?->warga;

        if (! $warga) {
            abort(403, 'Akun Anda belum terhubung dengan data warga.');
        }

        if (! in_array($kegiatan->status_kegiatan, ['Dijadwalkan', 'Berlangsung'], true)) {
            return back()->withErrors([
                'kegiatan' => 'Kegiatan ini tidak menerima partisipasi warga.',
            ]);
        }

        KegiatanPartisipasi::query()->updateOrCreate(
            [
                'kegiatan_id' => $kegiatan->id,
                'warga_id' => $warga->id,
            ],
            [
                'user_id' => $user->id,
                'status' => 'ikut',
                'catatan' => null,
            ]
        );

        return back()->with('success', 'Anda berhasil ikut kegiatan.');
    }

    public function batalIkutKegiatan(Request $request, Kegiatan $kegiatan): RedirectResponse
    {
        $user = $request->user();
        $warga = $user?->warga;

        if (! $warga) {
            abort(403, 'Akun Anda belum terhubung dengan data warga.');
        }

        $partisipasi = KegiatanPartisipasi::query()
            ->where('kegiatan_id', $kegiatan->id)
            ->where('warga_id', $warga->id)
            ->first();

        if ($partisipasi) {
            $partisipasi->update([
                'status' => 'batal',
                'user_id' => $user->id,
            ]);
        }

        return back()->with('success', 'Partisipasi kegiatan berhasil dibatalkan.');
    }

    public function pengaduan(Request $request): Response
    {
        $context = $this->wargaContext($request);
        $warga = $request->user()?->warga;
        $wargaId = $warga?->id;

        $complaints = collect();

        if ($wargaId) {
            $complaints = Pengaduan::query()
                ->with(['files', 'tanggapans.user'])
                ->where('warga_id', $wargaId)
                ->latest('tanggal_pengaduan')
                ->latest('id')
                ->get();
        }

        return Inertia::render('Warga/Pengaduan', [
            ...$context,
            'complaints' => $complaints->map(fn (Pengaduan $pengaduan) => [
                'id' => $pengaduan->id,
                'nomorPengaduan' => $pengaduan->nomor_pengaduan,
                'judul' => $pengaduan->judul,
                'kategori' => $pengaduan->kategori,
                'kategoriLabel' => $this->complaintCategoryLabel($pengaduan->kategori),
                'prioritas' => $pengaduan->prioritas,
                'prioritasLabel' => $this->complaintPriorityLabel($pengaduan->prioritas),
                'lokasi' => $pengaduan->lokasi,
                'deskripsi' => $pengaduan->deskripsi,
                'status' => $pengaduan->status,
                'statusLabel' => $this->complaintStatusLabel($pengaduan->status),
                'isPrivate' => (bool) $pengaduan->is_private,
                'catatanAdmin' => $pengaduan->catatan_admin,
                'tanggalPengaduan' => $pengaduan->tanggal_pengaduan?->toDateTimeString(),
                'tanggalDiproses' => $pengaduan->tanggal_diproses?->toDateTimeString(),
                'tanggalSelesai' => $pengaduan->tanggal_selesai?->toDateTimeString(),
                'files' => $pengaduan->files->map(fn (PengaduanFile $file) => [
                    'id' => $file->id,
                    'label' => $file->label,
                    'originalName' => $file->original_name,
                    'url' => Storage::url($file->path),
                    'previewUrl' => route('warga.pengaduan.files.preview', $file->id),
                    'mimeType' => $file->mime_type,
                    'size' => (int) $file->size,
                    'isAdminFile' => (bool) $file->is_admin_file,
                ])->values(),
                'tanggapans' => $pengaduan->tanggapans->map(fn ($tanggapan) => [
                    'id' => $tanggapan->id,
                    'statusFrom' => $tanggapan->status_from,
                    'statusTo' => $tanggapan->status_to,
                    'statusToLabel' => $this->complaintStatusLabel($tanggapan->status_to),
                    'pesan' => $tanggapan->pesan,
                    'isAdmin' => (bool) $tanggapan->is_admin,
                    'userName' => $tanggapan->user?->name,
                    'createdAt' => $tanggapan->created_at?->toDateTimeString(),
                ])->values(),
            ])->values(),
            'summary' => [
                'total' => $complaints->count(),
                'diajukan' => $complaints->where('status', 'diajukan')->count(),
                'diproses' => $complaints->where('status', 'diproses')->count(),
                'selesai' => $complaints->where('status', 'selesai')->count(),
                'ditolak' => $complaints->where('status', 'ditolak')->count(),
            ],
            'categoryOptions' => $this->complaintCategoryOptions(),
            'priorityOptions' => $this->complaintPriorityOptions(),
            'canSubmit' => $wargaId !== null,
        ]);
    }

    public function ajukanSurat(Request $request): Response
    {
        $context = $this->wargaContext($request);
        $warga = $request->user()?->warga;
        $kkId = $warga?->kartu_keluarga_id;

        $jenisSurats = JenisSurat::query()
            ->where('is_active', true)
            ->orderBy('urutan')
            ->orderBy('nama')
            ->get();

        $pengajuans = collect();

        if ($kkId) {
            $pengajuans = PengajuanSurat::query()
                ->with(['jenisSurat', 'files', 'approvals.approver'])
                ->where('kartu_keluarga_id', $kkId)
                ->latest('tanggal_pengajuan')
                ->latest('id')
                ->get();
        }

        return Inertia::render('Warga/PengajuanSurat', [
            ...$context,
            'jenisSurats' => $jenisSurats->map(fn (JenisSurat $jenis) => [
                'id' => $jenis->id,
                'nama' => $jenis->nama,
                'kode' => $jenis->kode,
                'deskripsi' => $jenis->deskripsi,
                'fields' => $jenis->fields ?? [],
                'uploadRequirements' => $jenis->upload_requirements ?? [],
            ])->values(),
            'pengajuans' => $pengajuans->map(fn (PengajuanSurat $pengajuan) => [
                'id' => $pengajuan->id,
                'nomorPengajuan' => $pengajuan->nomor_pengajuan,
                'nomorSurat' => $pengajuan->nomor_surat,
                'jenisSurat' => $pengajuan->jenisSurat?->nama ?? '-',
                'kodeJenis' => $pengajuan->jenisSurat?->kode,
                'ringkasanKeperluan' => $pengajuan->ringkasan_keperluan,
                'dataPengajuan' => $pengajuan->data_pengajuan ?? [],
                'catatanWarga' => $pengajuan->catatan_warga,
                'catatanAdmin' => $pengajuan->catatan_admin,
                'status' => $pengajuan->status ?? 'diajukan',
                'statusLabel' => $this->pengajuanStatusLabel($pengajuan->status),
                'tanggalPengajuan' => $pengajuan->tanggal_pengajuan?->toDateString(),
                'tanggalSelesai' => $pengajuan->tanggal_selesai?->toDateString(),
                'files' => $pengajuan->files->map(fn (PengajuanSuratFile $file) => [
                    'id' => $file->id,
                    'label' => $file->label,
                    'originalName' => $file->original_name,
                    'url' => Storage::url($file->path),
                    'mimeType' => $file->mime_type,
                    'isAdminFile' => (bool) $file->is_admin_file,
                ])->values(),
                'approvals' => $pengajuan->approvals->map(fn ($approval) => [
                    'id' => $approval->id,
                    'status' => $approval->status ?? 'diajukan',
                    'statusLabel' => $this->pengajuanStatusLabel($approval->status),
                    'notes' => $approval->notes,
                    'approver' => $approval->approver?->name,
                    'createdAt' => $approval->created_at?->toDateTimeString(),
                ])->values(),
            ])->values(),
            'summary' => [
                'total' => $pengajuans->count(),
                'proses' => $pengajuans->whereIn('status', ['diajukan', 'diverifikasi_rt', 'revisi'])->count(),
                'disetujui' => $pengajuans->whereIn('status', ['disetujui', 'selesai', 'diambil'])->count(),
                'ditolak' => $pengajuans->where('status', 'ditolak')->count(),
            ],
            'canSubmit' => $kkId !== null,
        ]);
    }

    public function profil(Request $request): Response
    {
        return Inertia::render('Warga/ProfilAkun', $this->wargaContext($request));
    }

    public function redirectToDashboard(): RedirectResponse
    {
        return redirect()->route('warga.dashboard');
    }

    public function updateProfil(Request $request): RedirectResponse
{
    $user = $request->user();
    $warga = $user?->warga;

    $validated = $request->validate([
        'email' => [
            'required',
            'email',
            'max:255',
            Rule::unique('users', 'email')->ignore($user?->id),
        ],
        'phone' => ['nullable', 'string', 'max:30'],
        'profile_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
    ]);

    $changes = [];

    if ($user->email !== $validated['email']) {
        $changes[] = [
            'field' => 'email',
            'old_value' => $user->email,
            'new_value' => $validated['email'],
        ];

        $user->email = $validated['email'];
    }

    if (($user->phone ?? '') !== ($validated['phone'] ?? '')) {
        $changes[] = [
            'field' => 'phone',
            'old_value' => $user->phone,
            'new_value' => $validated['phone'] ?? null,
        ];

        $user->phone = $validated['phone'] ?? null;
    }

    if ($request->hasFile('profile_photo')) {
        $oldPath = $user->profile_photo_path;

        $newPath = $request->file('profile_photo')->store('profile-photos', 'public');

        if ($oldPath && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        $changes[] = [
            'field' => 'profile_photo',
            'old_value' => $oldPath ? 'Foto profil lama' : null,
            'new_value' => 'Foto profil diperbarui',
        ];

        $user->profile_photo_path = $newPath;
    }

    $user->save();

    foreach ($changes as $change) {
        WargaProfileChangeLog::create([
            'user_id' => $user->id,
            'warga_id' => $warga?->id,
            'field' => $change['field'],
            'old_value' => $change['old_value'],
            'new_value' => $change['new_value'],
        ]);
    }

    return back()->with('success', 'Profil berhasil diperbarui.');
}

    public function gantiPassword(Request $request): RedirectResponse
    {
        $user = $request->user();
        $warga = $user?->warga;

        $request->validate([
            'current_password'      => ['required', 'string', 'current_password'],
            'new_password'          => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'current_password.current_password' => 'Password saat ini tidak sesuai.',
            'new_password.min'                  => 'Password baru minimal 8 karakter.',
            'new_password.confirmed'            => 'Konfirmasi password tidak cocok.',
        ]);

        $user->password = Hash::make($request->new_password);
        $user->save();

        WargaProfileChangeLog::create([
            'user_id'   => $user->id,
            'warga_id'  => $warga?->id,
            'field'     => 'password',
            'old_value' => null,
            'new_value' => 'Password diperbarui',
        ]);

        return back()->with('success', 'Password berhasil diubah.');
    }

    private function wargaContext(Request $request): array
    {
        $user = $request->user()->load([
            'warga.hunian',
            'warga.kartuKeluarga.wargas',
        ]);

        $warga = $user->warga;
        $hunian = $warga?->hunian;
        $kk = $warga?->kartuKeluarga;
        $anggota = $kk?->wargas ?? collect();
        $name = $warga?->nama_lengkap ?: $user->name;

        return [
            'profile' => [
                'name' => $name,
                'initials' => $this->initials($name),
                'email' => $user->email,
                'phone' => $user->phone ?: $hunian?->kontak_penghuni,
                'profilePhotoUrl' => $this->profilePhotoUrl($user->profile_photo_path, $user->updated_at, $name),
                'houseNumber' => $hunian?->no_rumah,
                'rt' => $kk?->rt,
                'rw' => $kk?->rw,
                'statusHunian' => $hunian?->status_hunian,
                'statusWarga' => $hunian?->status_warga,
                'address' => $kk?->alamat ?: $hunian?->alamat_hunian,
                'hasLinkedWarga' => (bool) $warga,
                'jenisKelamin' => $warga?->jenis_kelamin,
                'hubunganKeluarga' => $warga?->hubungan_keluarga,
                'nik' => $warga?->nik,
            ],
            'kartuKeluarga' => $kk ? [
                'noKK' => $kk->no_kk,
                'namaKepala' => $kk->nama_kepala_keluarga,
                'alamat' => $kk->alamat,
                'rt' => $kk->rt,
                'rw' => $kk->rw,
                'kelurahan' => $kk->kelurahan_desa,
                'kecamatan' => $kk->kecamatan,
                'kota' => $kk->kabupaten_kota,
                'provinsi' => $kk->provinsi,
                'kodePos' => $kk->kode_pos,
                'statusHunian' => $hunian?->status_hunian,
                'statusWarga' => $hunian?->status_warga,
            ] : null,
            'anggotaKeluarga' => $anggota->map(fn ($item) => [
                'id' => $item->id,
                'nama' => $item->nama_lengkap,
                'nik' => $item->nik,
                'jk' => $item->jenis_kelamin,
                'tempatLahir' => $item->tempat_lahir,
                'tanggalLahir' => $this->dateValue($item->tanggal_lahir),
                'agama' => $item->agama,
                'pendidikan' => $item->pendidikan,
                'pekerjaan' => $item->pekerjaan,
                'statusPerkawinan' => $item->status_perkawinan,
                'hubungan' => $item->hubungan_keluarga,
                'kewarganegaraan' => $item->kewarganegaraan,
                'namaAyah' => $item->nama_ayah,
                'namaIbu' => $item->nama_ibu,
            ])->values(),
        ];
    }

    private function profilePhotoUrl(?string $path, mixed $version = null, ?string $userName = null): ?string
    {
        if (! $path) {
            if ($userName) {
                return 'https://ui-avatars.com/api/?name=' . urlencode($userName) . '&background=10B981&color=fff&bold=true';
            }
            return null;
        }

        $url = asset('storage/' . ltrim($path, '/'));

        if ($version && method_exists($version, 'timestamp')) {
            return $url . '?v=' . $version->timestamp;
        }

        return $url;
    }

    private function upcomingEvents(?int $wargaId = null): Collection
    {
        return Kegiatan::query()
            ->with(['partisipasis' => function ($query) {
                $query->where('status', 'ikut')
                    ->with(['warga.hunian']);
            }])
            ->whereIn('status_kegiatan', ['Dijadwalkan', 'Berlangsung'])
            ->orderBy('tanggal')
            ->limit(20)
            ->get()
            ->map(function (Kegiatan $kegiatan) use ($wargaId) {
                $partisipasis = $kegiatan->partisipasis ?? collect();

                return [
                    'id' => $kegiatan->id,
                    'title' => $kegiatan->judul,
                    'date' => $this->dateValue($kegiatan->tanggal),
                    'time' => trim(($kegiatan->jam_mulai ?: '-') . ' - ' . ($kegiatan->jam_selesai ?: '-')),
                    'location' => $kegiatan->lokasi,
                    'category' => $kegiatan->kategori,
                    'status' => $kegiatan->status_kegiatan,
                    'description' => $kegiatan->deskripsi,
                    'mandatory' => (bool) $kegiatan->wajib_hadir,
                    'participantsCount' => $partisipasis->count(),
                    'isJoined' => $wargaId ? $partisipasis->contains('warga_id', $wargaId) : false,
                    'imageUrl' => $kegiatan->poster ? Storage::url($kegiatan->poster) : null,
                    'participants' => $partisipasis
                        ->map(fn (KegiatanPartisipasi $partisipasi) => [
                            'id' => $partisipasi->id,
                            'wargaId' => $partisipasi->warga_id,
                            'name' => $partisipasi->warga?->nama_lengkap ?? 'Warga',
                            'initials' => $this->initials($partisipasi->warga?->nama_lengkap ?? 'Warga'),
                            'houseNumber' => $partisipasi->warga?->hunian?->no_rumah,
                            'joinedAt' => $partisipasi->updated_at?->toDateTimeString(),
                        ])
                        ->values(),
                ];
            });
    }

    private function currentBillingSummary(Request $request): array
    {
        $kkId = $request->user()?->warga?->kartu_keluarga_id;

        if (! $kkId) {
            return [
                'unpaidBillsCount' => 0,
            ];
        }

        $periode = Carbon::now()->startOfMonth();

        $totalIuran = (float) IuranKomponen::query()
            ->where('is_active', true)
            ->sum('nominal');

        $paidThisMonth = (float) IuranPembayaran::query()
            ->where('kartu_keluarga_id', $kkId)
            ->whereDate('periode', $periode->toDateString())
            ->where('status_verifikasi', 'verified')
            ->sum('jumlah_dibayar');

        return [
            'unpaidBillsCount' => $totalIuran > $paidThisMonth ? 1 : 0,
        ];
    }


    private function currentComplaintSummary(Request $request): array
    {
        $wargaId = $request->user()?->warga?->id;

        if (! $wargaId) {
            return [
                'activeComplaintsCount' => 0,
            ];
        }

        return [
            'activeComplaintsCount' => Pengaduan::query()
                ->where('warga_id', $wargaId)
                ->whereIn('status', ['diajukan', 'diproses'])
                ->count(),
        ];
    }

    private function paymentStatus(float $paidAmount, float $pendingAmount, float $totalBill): string
    {
        if ($pendingAmount > 0 && $paidAmount < $totalBill) {
            return 'Menunggu Verifikasi';
        }

        if ($totalBill > 0 && $paidAmount >= $totalBill) {
            return 'Sudah Bayar';
        }

        if ($paidAmount > 0 && $paidAmount < $totalBill) {
            return 'Kurang Bayar';
        }

        return 'Belum Bayar';
    }

    private function paymentVerificationLabel(?string $status): string
    {
        return match ($status) {
            'verified' => 'Sudah Bayar',
            'pending' => 'Menunggu Verifikasi',
            'rejected' => 'Ditolak',
            default => $status ? Str::headline($status) : 'Belum Bayar',
        };
    }

    private function pengajuanStatusLabel(?string $status): string
    {
        return match ($status) {
            'draft' => 'Draft',
            'diajukan' => 'Diajukan',
            'diverifikasi_rt' => 'Diverifikasi RT',
            'revisi' => 'Revisi',
            'disetujui' => 'Disetujui',
            'ditolak' => 'Ditolak',
            'selesai' => 'Selesai',
            'diambil' => 'Diambil',
            default => $status ? Str::headline($status) : 'Diajukan',
        };
    }


    private function complaintCategoryOptions(): array
    {
        return [
            ['value' => 'lingkungan', 'label' => 'Lingkungan'],
            ['value' => 'keamanan', 'label' => 'Keamanan'],
            ['value' => 'fasilitas', 'label' => 'Fasilitas Umum'],
            ['value' => 'sosial', 'label' => 'Sosial'],
            ['value' => 'administrasi', 'label' => 'Administrasi'],
            ['value' => 'lainnya', 'label' => 'Lainnya'],
        ];
    }

    private function complaintPriorityOptions(): array
    {
        return [
            ['value' => 'rendah', 'label' => 'Rendah'],
            ['value' => 'sedang', 'label' => 'Sedang'],
            ['value' => 'tinggi', 'label' => 'Tinggi'],
            ['value' => 'darurat', 'label' => 'Darurat'],
        ];
    }

    private function complaintStatusLabel(?string $status): string
    {
        return match ($status) {
            'diajukan' => 'Diajukan',
            'diproses' => 'Diproses',
            'selesai' => 'Selesai',
            'ditolak' => 'Ditolak',
            default => $status ? Str::headline($status) : 'Diajukan',
        };
    }

    private function complaintCategoryLabel(?string $category): string
    {
        foreach ($this->complaintCategoryOptions() as $option) {
            if ($option['value'] === $category) {
                return $option['label'];
            }
        }

        return $category ? Str::headline($category) : '-';
    }

    private function complaintPriorityLabel(?string $priority): string
    {
        foreach ($this->complaintPriorityOptions() as $option) {
            if ($option['value'] === $priority) {
                return $option['label'];
            }
        }

        return $priority ? Str::headline($priority) : '-';
    }

    private function initials(?string $name): string
    {
        $name = trim((string) $name);

        if ($name === '') {
            return 'WG';
        }

        $words = preg_split('/\s+/', $name) ?: [];

        if (count($words) === 1) {
            return strtoupper(substr($words[0], 0, 2));
        }

        return strtoupper(substr($words[0], 0, 1) . substr($words[1], 0, 1));
    }

    private function dateValue($value): ?string
    {
        if (! $value) {
            return null;
        }

        return method_exists($value, 'format') ? $value->format('Y-m-d') : (string) $value;
    }
}

