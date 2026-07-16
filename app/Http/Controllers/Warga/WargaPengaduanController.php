<?php

namespace App\Http\Controllers\Warga;

use App\Http\Controllers\Controller;
use App\Models\Pengaduan;
use App\Models\PengaduanFile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class WargaPengaduanController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $warga = $request->user()?->warga()->with(['hunian', 'kartuKeluarga'])->first();

        if (! $warga) {
            return back()->withErrors([
                'warga' => 'Akun Anda belum terhubung dengan data warga. Hubungi admin RT.',
            ]);
        }

        $validated = $request->validate([
            'judul' => ['required', 'string', 'max:180'],
            'kategori' => ['required', Rule::in(['lingkungan', 'keamanan', 'fasilitas', 'sosial', 'administrasi', 'lainnya'])],
            'prioritas' => ['required', Rule::in(['rendah', 'sedang', 'tinggi', 'darurat'])],
            'lokasi' => ['nullable', 'string', 'max:180'],
            'deskripsi' => ['required', 'string'],
            'is_private' => ['required', 'boolean'],
            'lampiran' => ['nullable', 'array', 'max:5'],
            'lampiran.*' => ['file', 'mimes:pdf,jpg,jpeg,png,mp4,mov', 'max:10240'],
        ]);

        $pengaduan = Pengaduan::create([
            'nomor_pengaduan' => $this->generateNomorPengaduan(),
            'warga_id' => $warga->id,
            'kartu_keluarga_id' => $warga->kartu_keluarga_id,
            'hunian_id' => $warga->hunian_id,
            'judul' => $validated['judul'],
            'kategori' => $validated['kategori'],
            'prioritas' => $validated['prioritas'],
            'lokasi' => $validated['lokasi'] ?? null,
            'deskripsi' => $validated['deskripsi'],
            'is_private' => $request->boolean('is_private'),
            'status' => 'diajukan',
            'tanggal_pengaduan' => now(),
            'created_by' => $request->user()?->id,
            'updated_by' => $request->user()?->id,
        ]);

        $pengaduan->tanggapans()->create([
            'user_id' => $request->user()?->id,
            'status_from' => null,
            'status_to' => 'diajukan',
            'pesan' => 'Pengaduan diajukan oleh warga.',
            'is_admin' => false,
        ]);

        $this->storeFiles($request, $pengaduan);

        return redirect()
            ->route('warga.pengaduan')
            ->with('success', 'Pengaduan berhasil dikirim.');
    }

    public function cancel(Request $request, Pengaduan $pengaduan): RedirectResponse
    {
        $user = $request->user();
        $warga = $user?->warga;

        if (! $user || ! $warga) {
            abort(403);
        }

        if ((int) $pengaduan->warga_id !== (int) $warga->id) {
            abort(403);
        }

        if (! in_array(strtolower((string) $pengaduan->status), ['diajukan', 'pending', 'menunggu'], true)) {
            return back()->with('error', 'Pengaduan tidak dapat dibatalkan karena sudah diproses.');
        }

        $statusSebelumnya = $pengaduan->status;

        $pengaduan->update([
            'status' => 'dibatalkan',
            'updated_by' => $user->id,
        ]);

        $pengaduan->tanggapans()->create([
            'user_id' => $user->id,
            'status_from' => $statusSebelumnya,
            'status_to' => 'dibatalkan',
            'pesan' => 'Pengaduan dibatalkan oleh warga.',
            'is_admin' => false,
        ]);

        return redirect()
            ->route('warga.pengaduan')
            ->with('success', 'Pengaduan berhasil dibatalkan.');
    }

    public function previewFile(Request $request, PengaduanFile $file): BinaryFileResponse
    {
        $file->load('pengaduan');

        $wargaId = $request->user()?->warga?->id;

        if (! $wargaId || (int) $file->pengaduan?->warga_id !== (int) $wargaId) {
            abort(403);
        }

        if (! Storage::disk('public')->exists($file->path)) {
            abort(404, 'File tidak ditemukan.');
        }

        return response()->file(Storage::disk('public')->path($file->path), [
            'Content-Type' => $file->mime_type ?: 'application/octet-stream',
            'Content-Disposition' => 'inline; filename="' . ($file->original_name ?: 'lampiran-pengaduan') . '"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function storeFiles(Request $request, Pengaduan $pengaduan): void
    {
        if (! $request->hasFile('lampiran')) {
            return;
        }

        foreach ($request->file('lampiran', []) as $file) {
            $path = $file->store('pengaduan/warga', 'public');

            $pengaduan->files()->create([
                'label' => 'Lampiran warga',
                'original_name' => $file->getClientOriginalName(),
                'path' => $path,
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize() ?: 0,
                'is_admin_file' => false,
            ]);
        }
    }

    private function generateNomorPengaduan(): string
    {
        $prefix = 'ADU-' . now()->format('Ymd');

        $nextNumber = Pengaduan::query()
            ->where('nomor_pengaduan', 'like', $prefix . '-%')
            ->count() + 1;

        return $prefix . '-' . str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);
    }
}