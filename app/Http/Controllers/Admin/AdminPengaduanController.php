<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pengaduan;
use App\Models\PengaduanFile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminPengaduanController extends Controller
{
    private array $statusOptions = [
        ['value' => 'diajukan', 'label' => 'Diajukan'],
        ['value' => 'diproses', 'label' => 'Diproses'],
        ['value' => 'selesai', 'label' => 'Selesai'],
        ['value' => 'ditolak', 'label' => 'Ditolak'],
    ];

    private array $categoryOptions = [
        ['value' => 'lingkungan', 'label' => 'Lingkungan'],
        ['value' => 'keamanan', 'label' => 'Keamanan'],
        ['value' => 'fasilitas', 'label' => 'Fasilitas Umum'],
        ['value' => 'sosial', 'label' => 'Sosial'],
        ['value' => 'administrasi', 'label' => 'Administrasi'],
        ['value' => 'lainnya', 'label' => 'Lainnya'],
    ];

    private array $priorityOptions = [
        ['value' => 'rendah', 'label' => 'Rendah'],
        ['value' => 'sedang', 'label' => 'Sedang'],
        ['value' => 'tinggi', 'label' => 'Tinggi'],
        ['value' => 'darurat', 'label' => 'Darurat'],
    ];

    public function index(Request $request): Response
    {
        $filters = [
            'search' => (string) $request->query('search', ''),
            'status' => (string) $request->query('status', 'all'),
            'kategori' => (string) $request->query('kategori', 'all'),
            'prioritas' => (string) $request->query('prioritas', 'all'),
            'archived' => (string) $request->query('archived', '0'),
        ];

        $query = Pengaduan::query()
            ->with(['warga.user', 'hunian', 'kartuKeluarga', 'files', 'tanggapans.user'])
            ->latest('tanggal_pengaduan')
            ->latest('id');

        if ($filters['archived'] === '1') {
            $query->where('is_archived', true);
        } else {
            $query->where('is_archived', false);
        }

        if ($filters['search'] !== '') {
            $query->where(function ($builder) use ($filters) {
                $builder->where('nomor_pengaduan', 'like', '%' . $filters['search'] . '%')
                    ->orWhere('judul', 'like', '%' . $filters['search'] . '%')
                    ->orWhere('deskripsi', 'like', '%' . $filters['search'] . '%')
                    ->orWhere('lokasi', 'like', '%' . $filters['search'] . '%')
                    ->orWhereHas('warga', fn ($wargaQuery) => $wargaQuery->where('nama_lengkap', 'like', '%' . $filters['search'] . '%'))
                    ->orWhereHas('hunian', fn ($hunianQuery) => $hunianQuery->where('no_rumah', 'like', '%' . $filters['search'] . '%'));
            });
        }

        if ($filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if ($filters['kategori'] !== 'all') {
            $query->where('kategori', $filters['kategori']);
        }

        if ($filters['prioritas'] !== 'all') {
            $query->where('prioritas', $filters['prioritas']);
        }

        $complaints = $query->get();

        return Inertia::render('Admin/Complaints', [
            'complaints' => $complaints->map(fn (Pengaduan $pengaduan) => $this->mapComplaint($pengaduan))->values(),
            'filters' => $filters,
            'summary' => [
                'total' => Pengaduan::query()->count(),
                'diajukan' => Pengaduan::query()->where('status', 'diajukan')->count(),
                'diproses' => Pengaduan::query()->where('status', 'diproses')->count(),
                'selesai' => Pengaduan::query()->where('status', 'selesai')->count(),
                'ditolak' => Pengaduan::query()->where('status', 'ditolak')->count(),
            ],
            'statusOptions' => $this->statusOptions,
            'categoryOptions' => $this->categoryOptions,
            'priorityOptions' => $this->priorityOptions,
        ]);
    }

    public function updateStatus(Request $request, Pengaduan $pengaduan): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['diajukan', 'diproses', 'selesai', 'ditolak'])],
            'catatan_admin' => ['nullable', 'string'],
            'lampiran_admin' => ['nullable', 'array', 'max:5'],
            'lampiran_admin.*' => ['file', 'mimes:pdf,jpg,jpeg,png,mp4,mov', 'max:10240'],
        ]);

        $oldStatus = $pengaduan->status;
        $newStatus = $validated['status'];

        $payload = [
            'status' => $newStatus,
            'catatan_admin' => $validated['catatan_admin'] ?? $pengaduan->catatan_admin,
            'updated_by' => $request->user()?->id,
        ];

        if ($newStatus === 'diproses' && ! $pengaduan->tanggal_diproses) {
            $payload['tanggal_diproses'] = now();
        }

        if (in_array($newStatus, ['selesai', 'ditolak'], true)) {
            $payload['tanggal_selesai'] = now();
            $payload['resolved_by'] = $request->user()?->id;
        }

        if ($newStatus === 'diajukan') {
            $payload['tanggal_diproses'] = null;
            $payload['tanggal_selesai'] = null;
            $payload['resolved_by'] = null;
        }

        $pengaduan->update($payload);

        $pengaduan->tanggapans()->create([
            'user_id' => $request->user()?->id,
            'status_from' => $oldStatus,
            'status_to' => $newStatus,
            'pesan' => $validated['catatan_admin'] ?? null,
            'is_admin' => true,
        ]);

        $this->storeAdminFiles($request, $pengaduan);

        return back()->with('success', 'Status pengaduan berhasil diperbarui.');
    }

    public function destroyFile(PengaduanFile $file): RedirectResponse
    {
        Storage::disk('public')->delete($file->path);
        $file->delete();

        return back()->with('success', 'Lampiran pengaduan berhasil dihapus.');
    }

    private function storeAdminFiles(Request $request, Pengaduan $pengaduan): void
    {
        if (! $request->hasFile('lampiran_admin')) {
            return;
        }

        foreach ($request->file('lampiran_admin', []) as $file) {
            $path = $file->store('pengaduan/admin', 'public');

            $pengaduan->files()->create([
                'label' => 'Lampiran admin',
                'original_name' => $file->getClientOriginalName(),
                'path' => $path,
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize() ?: 0,
                'is_admin_file' => true,
            ]);
        }
    }

    private function mapComplaint(Pengaduan $pengaduan): array
    {
        return [
            'id' => $pengaduan->id,
            'nomorPengaduan' => $pengaduan->nomor_pengaduan,
            'judul' => $pengaduan->judul,
            'kategori' => $pengaduan->kategori,
            'kategoriLabel' => $this->optionLabel($this->categoryOptions, $pengaduan->kategori),
            'prioritas' => $pengaduan->prioritas,
            'prioritasLabel' => $this->optionLabel($this->priorityOptions, $pengaduan->prioritas),
            'isPrivate' => (bool) $pengaduan->is_private,
            'isArchived' => (bool) $pengaduan->is_archived,
            'isConfirmed' => (bool) $pengaduan->is_confirmed,
            'wargaAvatar' => $pengaduan->warga?->user?->profile_photo_path
                ? asset('storage/' . ltrim($pengaduan->warga->user->profile_photo_path, '/'))
                : 'https://ui-avatars.com/api/?name=' . urlencode($pengaduan->warga?->nama_lengkap ?? 'Warga') . '&background=10B981&color=fff&bold=true',
            'lokasi' => $pengaduan->lokasi,
            'deskripsi' => $pengaduan->deskripsi,
            'status' => $pengaduan->status,
            'statusLabel' => $this->optionLabel($this->statusOptions, $pengaduan->status),
            'catatanAdmin' => $pengaduan->catatan_admin,
            'tanggalPengaduan' => $pengaduan->tanggal_pengaduan?->toDateTimeString(),
            'tanggalDiproses' => $pengaduan->tanggal_diproses?->toDateTimeString(),
            'tanggalSelesai' => $pengaduan->tanggal_selesai?->toDateTimeString(),
            'wargaName' => $pengaduan->warga?->nama_lengkap ?? '-',
            'houseNumber' => $pengaduan->hunian?->no_rumah ?? '-',
            'kkNumber' => $pengaduan->kartuKeluarga?->no_kk,
            'phone' => $pengaduan->hunian?->kontak_penghuni,
            'files' => $pengaduan->files->map(fn (PengaduanFile $file) => [
                'id' => $file->id,
                'label' => $file->label,
                'originalName' => $file->original_name,
                'url' => Storage::url($file->path),
                'mimeType' => $file->mime_type,
                'size' => (int) $file->size,
                'isAdminFile' => (bool) $file->is_admin_file,
            ])->values(),
            'tanggapans' => $pengaduan->tanggapans->map(fn ($tanggapan) => [
                'id' => $tanggapan->id,
                'statusFrom' => $tanggapan->status_from,
                'statusTo' => $tanggapan->status_to,
                'statusToLabel' => $this->optionLabel($this->statusOptions, $tanggapan->status_to),
                'pesan' => $tanggapan->pesan,
                'isAdmin' => (bool) $tanggapan->is_admin,
                'userName' => $tanggapan->user?->name,
                'createdAt' => $tanggapan->created_at?->toDateTimeString(),
            ])->values(),
        ];
    }

    public function toggleArchive(Request $request, Pengaduan $pengaduan): \Illuminate\Http\RedirectResponse
    {
        $pengaduan->update([
            'is_archived' => ! $pengaduan->is_archived,
        ]);

        $statusMsg = $pengaduan->is_archived ? 'diarsipkan' : 'dikembalikan dari arsip';
        return back()->with('success', "Pengaduan berhasil {$statusMsg}.");
    }

    public function toggleConfirm(Request $request, Pengaduan $pengaduan): \Illuminate\Http\RedirectResponse
    {
        $pengaduan->update([
            'is_confirmed' => ! $pengaduan->is_confirmed,
        ]);

        $statusMsg = $pengaduan->is_confirmed ? 'dikonfirmasi dan dipublikasikan ke homepage' : 'dibatalkan publikasinya';
        return back()->with('success', "Pengaduan berhasil {$statusMsg}.");
    }

    public function destroy(Pengaduan $pengaduan): \Illuminate\Http\RedirectResponse
    {
        // Delete all physical files associated with the complaint
        foreach ($pengaduan->files as $file) {
            Storage::disk('public')->delete($file->path);
        }

        $pengaduan->delete();

        return redirect()
            ->route('admin.complaints.index')
            ->with('success', 'Pengaduan dan data terkait berhasil dihapus.');
    }

    private function optionLabel(array $options, ?string $value): string
    {
        foreach ($options as $option) {
            if ($option['value'] === $value) {
                return $option['label'];
            }
        }

        return $value ? ucfirst($value) : '-';
    }
}
