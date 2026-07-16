<?php

namespace App\Http\Controllers\Warga;

use App\Http\Controllers\Controller;
use App\Models\JenisSurat;
use App\Models\PengajuanSurat;
use App\Models\PengajuanSuratFile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class WargaPengajuanSuratController extends Controller
{
    public function index(Request $request): Response
    {
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
            'jenisSurats' => $jenisSurats->map(fn (JenisSurat $jenis) => $this->jenisSuratPayload($jenis))->values(),
            'pengajuans' => $pengajuans->map(fn (PengajuanSurat $pengajuan) => $this->pengajuanPayload($pengajuan))->values(),
            'summary' => [
                'total' => $pengajuans->count(),
                'proses' => $pengajuans->whereIn('status', ['diajukan', 'diverifikasi_rt', 'revisi'])->count(),
                'disetujui' => $pengajuans->whereIn('status', ['disetujui', 'selesai', 'diambil'])->count(),
                'ditolak' => $pengajuans->where('status', 'ditolak')->count(),
            ],
            'canSubmit' => $kkId !== null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $warga = $request->user()?->warga;

        if (! $warga || ! $warga->kartu_keluarga_id) {
            throw ValidationException::withMessages([
                'pemohon' => 'Akun warga belum terhubung dengan data kartu keluarga.',
            ]);
        }

        $validated = $request->validate([
            'jenis_surat_id' => ['required', 'exists:jenis_surats,id'],
            'ringkasan_keperluan' => ['nullable', 'string', 'max:180'],
            'data_pengajuan' => ['nullable', 'array'],
            'catatan_warga' => ['nullable', 'string'],
            'dokumen_pendukung' => ['nullable', 'array'],
            'dokumen_pendukung.*' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:4096'],
        ]);

        $jenisSurat = JenisSurat::query()
            ->where('is_active', true)
            ->findOrFail($validated['jenis_surat_id']);

        $this->validateDynamicFields($jenisSurat, $validated['data_pengajuan'] ?? [], $request->file('dokumen_pendukung', []));

        $pengajuan = PengajuanSurat::create([
            'kartu_keluarga_id' => $warga->kartu_keluarga_id,
            'pemohon_warga_id' => $warga->id,
            'jenis_surat_id' => $jenisSurat->id,
            'nomor_pengajuan' => $this->generateNomorPengajuan(),
            'ringkasan_keperluan' => $validated['ringkasan_keperluan'] ?: $jenisSurat->nama,
            'data_pengajuan' => $validated['data_pengajuan'] ?? [],
            'catatan_warga' => $validated['catatan_warga'] ?? null,
            'status' => 'diajukan',
            'tanggal_pengajuan' => now(),
        ]);

        $this->storeSupportingFiles($request, $pengajuan, $jenisSurat);

        return redirect()
            ->route('warga.ajukan-surat')
            ->with('success', 'Pengajuan surat berhasil dikirim.');
    }

    private function validateDynamicFields(JenisSurat $jenisSurat, array $data, array $files): void
    {
        $errors = [];

        foreach ($jenisSurat->fields ?? [] as $field) {
            if (($field['required'] ?? false) && blank($data[$field['name']] ?? null)) {
                $errors['data_pengajuan.' . $field['name']] = ($field['label'] ?? $field['name']) . ' wajib diisi.';
            }
        }

        foreach ($jenisSurat->upload_requirements ?? [] as $requirement) {
            if (($requirement['required'] ?? false) && empty($files[$requirement['name']] ?? null)) {
                $errors['dokumen_pendukung.' . $requirement['name']] = ($requirement['label'] ?? $requirement['name']) . ' wajib diupload.';
            }
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function storeSupportingFiles(Request $request, PengajuanSurat $pengajuan, JenisSurat $jenisSurat): void
    {
        $labels = collect($jenisSurat->upload_requirements ?? [])
            ->mapWithKeys(fn (array $item) => [$item['name'] => $item['label'] ?? $item['name']]);

        foreach ($request->file('dokumen_pendukung', []) as $key => $file) {
            if (! $file) {
                continue;
            }

            $path = $file->store('pengajuan-surat/dokumen-pendukung', 'public');

            PengajuanSuratFile::create([
                'pengajuan_surat_id' => $pengajuan->id,
                'uploaded_by' => $request->user()?->id,
                'kategori' => (string) $key,
                'label' => $labels->get($key, Str::headline((string) $key)),
                'original_name' => $file->getClientOriginalName(),
                'path' => $path,
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
                'is_admin_file' => false,
            ]);
        }
    }

    private function generateNomorPengajuan(): string
    {
        $prefix = 'PGJ-' . now()->format('Ymd') . '-';
        $next = PengajuanSurat::query()
            ->where('nomor_pengajuan', 'like', $prefix . '%')
            ->count() + 1;

        return $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }

    private function jenisSuratPayload(JenisSurat $jenis): array
    {
        return [
            'id' => $jenis->id,
            'nama' => $jenis->nama,
            'kode' => $jenis->kode,
            'deskripsi' => $jenis->deskripsi,
            'fields' => $jenis->fields ?? [],
            'uploadRequirements' => $jenis->upload_requirements ?? [],
        ];
    }

    private function pengajuanPayload(PengajuanSurat $pengajuan): array
    {
        return [
            'id' => $pengajuan->id,
            'nomorPengajuan' => $pengajuan->nomor_pengajuan,
            'nomorSurat' => $pengajuan->nomor_surat,
            'jenisSurat' => $pengajuan->jenisSurat?->nama ?? '-',
            'kodeJenis' => $pengajuan->jenisSurat?->kode,
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
}
