<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JenisSurat;
use App\Models\PengajuanSurat;
use App\Models\PengajuanSuratApproval;
use App\Models\PengajuanSuratFile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminPengajuanSuratController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'all');
        $search = trim((string) $request->query('search', ''));

        $query = PengajuanSurat::query()
            ->with(['jenisSurat', 'pemohon', 'kartuKeluarga.hunian', 'files', 'approvals.approver'])
            ->latest('tanggal_pengajuan')
            ->latest('id');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('nomor_pengajuan', 'like', "%{$search}%")
                    ->orWhere('nomor_surat', 'like', "%{$search}%")
                    ->orWhere('ringkasan_keperluan', 'like', "%{$search}%")
                    ->orWhereHas('jenisSurat', fn ($jenis) => $jenis->where('nama', 'like', "%{$search}%"))
                    ->orWhereHas('pemohon', fn ($pemohon) => $pemohon->where('nama_lengkap', 'like', "%{$search}%"))
                    ->orWhereHas('kartuKeluarga', fn ($kk) => $kk->where('nama_kepala_keluarga', 'like', "%{$search}%"));
            });
        }

        $pengajuans = $query->get();
        $allPengajuans = PengajuanSurat::query()->get(['status']);

        return Inertia::render('Admin/PengajuanSurat', [
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'pengajuans' => $pengajuans->map(fn (PengajuanSurat $pengajuan) => $this->pengajuanPayload($pengajuan))->values(),
            'summary' => [
                'total' => $allPengajuans->count(),
                'diajukan' => $allPengajuans->where('status', 'diajukan')->count(),
                'diproses' => $allPengajuans->whereIn('status', ['diverifikasi_rt', 'revisi'])->count(),
                'selesai' => $allPengajuans->whereIn('status', ['disetujui', 'selesai', 'diambil'])->count(),
                'ditolak' => $allPengajuans->where('status', 'ditolak')->count(),
            ],
            'jenisSurats' => JenisSurat::query()
                ->where('is_active', true)
                ->orderBy('urutan')
                ->get(['id', 'nama', 'kode'])
                ->values(),
            'statuses' => $this->statuses(),
        ]);
    }

    public function updateStatus(Request $request, PengajuanSurat $pengajuan): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(PengajuanSurat::STATUSES)],
            'catatan_admin' => ['nullable', 'string'],
            'nomor_surat' => ['nullable', 'string', 'max:120'],
            'file_surat' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:4096'],
        ]);

        $status = $validated['status'];
        $updates = [
            'status' => $status,
            'catatan_admin' => $validated['catatan_admin'] ?? null,
            'nomor_surat' => $validated['nomor_surat'] ?? $pengajuan->nomor_surat,
            'processed_by' => $request->user()?->id,
        ];

        if ($status === 'diverifikasi_rt') {
            $updates['tanggal_diverifikasi'] = now();
        }

        if ($status === 'disetujui') {
            $updates['tanggal_disetujui'] = now();
            $updates['nomor_surat'] = $updates['nomor_surat'] ?: $this->generateNomorSurat($pengajuan);
        }

        if ($status === 'selesai') {
            $updates['tanggal_selesai'] = now();
        }

        if ($status === 'diambil') {
            $updates['tanggal_diambil'] = now();
        }

        $pengajuan->update($updates);

        if ($request->hasFile('file_surat')) {
            $file = $request->file('file_surat');
            $path = $file->store('pengajuan-surat/surat-selesai', 'public');

            PengajuanSuratFile::create([
                'pengajuan_surat_id' => $pengajuan->id,
                'uploaded_by' => $request->user()?->id,
                'kategori' => 'file_surat',
                'label' => 'File surat RT',
                'original_name' => $file->getClientOriginalName(),
                'path' => $path,
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
                'is_admin_file' => true,
            ]);
        }

        PengajuanSuratApproval::create([
            'pengajuan_surat_id' => $pengajuan->id,
            'approved_by' => $request->user()?->id,
            'status' => $status,
            'notes' => $validated['catatan_admin'] ?? null,
        ]);

        return back()->with('success', 'Status pengajuan berhasil diperbarui.');
    }

    private function pengajuanPayload(PengajuanSurat $pengajuan): array
    {
        return [
            'id' => $pengajuan->id,
            'nomorPengajuan' => $pengajuan->nomor_pengajuan,
            'nomorSurat' => $pengajuan->nomor_surat,
            'jenisSurat' => $pengajuan->jenisSurat?->nama ?? '-',
            'kodeJenis' => $pengajuan->jenisSurat?->kode,
            'pemohon' => $pengajuan->pemohon?->nama_lengkap
                ?? $pengajuan->kartuKeluarga?->nama_kepala_keluarga
                ?? '-',
            'kepalaKeluarga' => $pengajuan->kartuKeluarga?->nama_kepala_keluarga ?? '-',
            'noRumah' => $pengajuan->kartuKeluarga?->hunian?->no_rumah ?? '-',
            'noKk' => $pengajuan->kartuKeluarga?->no_kk ? $this->maskKkNumber($pengajuan->kartuKeluarga->no_kk) : '-',
            'ringkasanKeperluan' => $pengajuan->ringkasan_keperluan,
            'dataPengajuan' => $pengajuan->data_pengajuan ?? [],
            'catatanWarga' => $pengajuan->catatan_warga,
            'catatanAdmin' => $pengajuan->catatan_admin,
            'status' => $pengajuan->status,
            'statusLabel' => $this->statusLabel($pengajuan->status),
            'tanggalPengajuan' => $pengajuan->tanggal_pengajuan?->toDateString(),
            'tanggalSelesai' => $pengajuan->tanggal_selesai?->toDateString(),
            'files' => $pengajuan->files->map(fn (PengajuanSuratFile $file) => [
                'id' => $file->id,
                'label' => $file->label,
                'originalName' => $file->original_name,
                'url' => Storage::url($file->path),
                'mimeType' => $file->mime_type,
                'isAdminFile' => $file->is_admin_file,
            ])->values(),
            'approvals' => $pengajuan->approvals->map(fn ($approval) => [
                'id' => $approval->id,
                'status' => $approval->status,
                'statusLabel' => $this->statusLabel($approval->status),
                'notes' => $approval->notes,
                'approver' => $approval->approver?->name,
                'createdAt' => $approval->created_at?->toDateTimeString(),
            ])->values(),
        ];
    }

    private function statuses(): array
    {
        return collect(PengajuanSurat::STATUSES)
            ->map(fn (string $status) => [
                'value' => $status,
                'label' => $this->statusLabel($status),
            ])
            ->values()
            ->all();
    }

    private function statusLabel(string $status): string
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
            default => Str::headline($status),
        };
    }

    private function generateNomorSurat(PengajuanSurat $pengajuan): string
    {
        $romanMonths = [1 => 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        $month = $romanMonths[(int) now()->format('n')];
        $code = $pengajuan->jenisSurat?->kode ?: 'SURAT';
        $sequence = PengajuanSurat::query()
            ->whereYear('tanggal_pengajuan', now()->year)
            ->whereNotNull('nomor_surat')
            ->count() + 1;

        return str_pad((string) $sequence, 3, '0', STR_PAD_LEFT) . '/' . $code . '/RT/' . $month . '/' . now()->format('Y');
    }

    private function maskKkNumber(string $number): string
    {
        $clean = preg_replace('/\D/', '', $number) ?: $number;

        if (strlen($clean) <= 8) {
            return $clean;
        }

        return substr($clean, 0, 4) . str_repeat('*', max(strlen($clean) - 8, 0)) . substr($clean, -4);
    }
}
