<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kegiatan;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AdminEventController extends Controller
{
    public function index(): Response
    {
        $events = Kegiatan::with(['anggaranItems', 'pengeluarans'])
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Kegiatan $kegiatan) => $this->mapEvent($kegiatan));

        return Inertia::render('Admin/Events', [
            'events' => $events,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateKegiatan($request);

        DB::transaction(function () use ($request, $validated) {
            $posterPath = $request->hasFile('poster')
                ? $request->file('poster')->store('kegiatan/posters', 'public')
                : null;

            $memerlukanDana = $request->boolean('memerlukan_dana');
            $wajibHadir = $request->boolean('wajib_hadir');

            $kegiatan = Kegiatan::create([
                'judul' => $validated['judul'],
                'tanggal' => $validated['tanggal'],
                'jam_mulai' => $validated['jam_mulai'] ?? null,
                'jam_selesai' => $validated['jam_selesai'] ?? null,
                'lokasi' => $validated['lokasi'] ?? null,
                'kategori' => $validated['kategori'],
                'memerlukan_dana' => $memerlukanDana,
                'estimasi_biaya' => $memerlukanDana ? (float) ($validated['estimasi_biaya'] ?? 0) : 0,
                'status_kegiatan' => $validated['status_kegiatan'],
                'deskripsi' => $validated['deskripsi'] ?? null,
                'penanggung_jawab' => $validated['penanggung_jawab'] ?? null,
                'target_peserta' => $validated['target_peserta'] ?? null,
                'wajib_hadir' => $wajibHadir,
                'sumber_dana' => $memerlukanDana ? ($validated['sumber_dana'] ?? null) : null,
                'penanggung_jawab_dana' => $memerlukanDana ? ($validated['penanggung_jawab_dana'] ?? null) : null,
                'catatan_anggaran' => $memerlukanDana ? ($validated['catatan_anggaran'] ?? null) : null,
                'poster' => $posterPath,
                'catatan' => $validated['catatan'] ?? null,
            ]);

            $totalAnggaran = $this->syncAnggaranItems(
                $kegiatan,
                $memerlukanDana ? ($validated['budget_items'] ?? []) : []
            );

            if ($memerlukanDana && $totalAnggaran > 0) {
                $kegiatan->update([
                    'estimasi_biaya' => $totalAnggaran,
                ]);
            }
        });

        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Kegiatan berhasil ditambahkan.');
    }

    public function update(Request $request, Kegiatan $kegiatan): RedirectResponse
    {
        $validated = $this->validateKegiatan($request);

        DB::transaction(function () use ($request, $validated, $kegiatan) {
            $posterPath = $kegiatan->poster;

            if ($request->hasFile('poster')) {
                if ($posterPath) {
                    Storage::disk('public')->delete($posterPath);
                }

                $posterPath = $request->file('poster')->store('kegiatan/posters', 'public');
            }

            $memerlukanDana = $request->boolean('memerlukan_dana');
            $wajibHadir = $request->boolean('wajib_hadir');

            $kegiatan->update([
                'judul' => $validated['judul'],
                'tanggal' => $validated['tanggal'],
                'jam_mulai' => $validated['jam_mulai'] ?? null,
                'jam_selesai' => $validated['jam_selesai'] ?? null,
                'lokasi' => $validated['lokasi'] ?? null,
                'kategori' => $validated['kategori'],
                'memerlukan_dana' => $memerlukanDana,
                'estimasi_biaya' => $memerlukanDana ? (float) ($validated['estimasi_biaya'] ?? 0) : 0,
                'status_kegiatan' => $validated['status_kegiatan'],
                'deskripsi' => $validated['deskripsi'] ?? null,
                'penanggung_jawab' => $validated['penanggung_jawab'] ?? null,
                'target_peserta' => $validated['target_peserta'] ?? null,
                'wajib_hadir' => $wajibHadir,
                'sumber_dana' => $memerlukanDana ? ($validated['sumber_dana'] ?? null) : null,
                'penanggung_jawab_dana' => $memerlukanDana ? ($validated['penanggung_jawab_dana'] ?? null) : null,
                'catatan_anggaran' => $memerlukanDana ? ($validated['catatan_anggaran'] ?? null) : null,
                'poster' => $posterPath,
                'catatan' => $validated['catatan'] ?? null,
            ]);

            $totalAnggaran = $this->syncAnggaranItems(
                $kegiatan,
                $memerlukanDana ? ($validated['budget_items'] ?? []) : []
            );

            if (! $memerlukanDana) {
                $kegiatan->update([
                    'estimasi_biaya' => 0,
                ]);
            } elseif ($totalAnggaran > 0) {
                $kegiatan->update([
                    'estimasi_biaya' => $totalAnggaran,
                ]);
            }
        });

        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Kegiatan berhasil diperbarui.');
    }

    public function destroy(Kegiatan $kegiatan): RedirectResponse
    {
        if ($kegiatan->poster) {
            Storage::disk('public')->delete($kegiatan->poster);
        }

        $kegiatan->delete();

        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Kegiatan berhasil dihapus.');
    }

    public function storeExpense(Request $request, Kegiatan $kegiatan): RedirectResponse
    {
        $validated = $request->validate([
            'tanggal_pengeluaran' => ['required', 'date'],
            'nama_pengeluaran' => ['required', 'string', 'max:150'],
            'kategori_pengeluaran' => ['required', 'string', 'max:100'],
            'nominal' => ['required', 'numeric', 'min:0'],
            'metode_pembayaran' => ['nullable', 'string', 'max:50'],
            'bukti_pembayaran' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf,webp', 'max:2048'],
            'keterangan' => ['nullable', 'string'],
        ]);

        $proofPath = $request->hasFile('bukti_pembayaran')
            ? $request->file('bukti_pembayaran')->store('kegiatan/pengeluaran-bukti', 'public')
            : null;

        $kegiatan->pengeluarans()->create([
            'tanggal_pengeluaran' => $validated['tanggal_pengeluaran'],
            'nama_pengeluaran' => $validated['nama_pengeluaran'],
            'kategori_pengeluaran' => $validated['kategori_pengeluaran'],
            'nominal' => $validated['nominal'],
            'metode_pembayaran' => $validated['metode_pembayaran'] ?? null,
            'bukti_pembayaran' => $proofPath,
            'keterangan' => $validated['keterangan'] ?? null,
        ]);

        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Pengeluaran kegiatan berhasil ditambahkan.');
    }

    private function validateKegiatan(Request $request): array
    {
        return $request->validate([
            'judul' => ['required', 'string', 'max:200'],
            'tanggal' => ['required', 'date'],
            'jam_mulai' => ['nullable', 'date_format:H:i'],
            'jam_selesai' => ['nullable', 'date_format:H:i'],
            'lokasi' => ['nullable', 'string', 'max:200'],
            'kategori' => ['required', 'string', 'max:100'],
            'memerlukan_dana' => ['required', 'boolean'],
            'estimasi_biaya' => ['nullable', 'numeric', 'min:0'],
            'status_kegiatan' => ['required', 'string', 'max:50'],
            'deskripsi' => ['nullable', 'string'],
            'penanggung_jawab' => ['nullable', 'string', 'max:150'],
            'target_peserta' => ['nullable', 'integer', 'min:0'],
            'wajib_hadir' => ['required', 'boolean'],
            'sumber_dana' => ['nullable', 'string', 'max:100'],
            'penanggung_jawab_dana' => ['nullable', 'string', 'max:150'],
            'catatan_anggaran' => ['nullable', 'string'],
            'poster' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'catatan' => ['nullable', 'string'],
            'budget_items' => ['nullable', 'array'],
            'budget_items.*.name' => ['nullable', 'string', 'max:150'],
            'budget_items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'budget_items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'budget_items.*.notes' => ['nullable', 'string'],
        ]);
    }

    private function syncAnggaranItems(Kegiatan $kegiatan, array $items): float
    {
        $kegiatan->anggaranItems()->delete();

        $total = 0;

        foreach ($items as $item) {
            $name = trim((string) ($item['name'] ?? ''));

            if ($name === '') {
                continue;
            }

            $qty = (int) ($item['quantity'] ?? 1);
            $unitPrice = (float) ($item['unit_price'] ?? 0);
            $subtotal = $qty * $unitPrice;

            $kegiatan->anggaranItems()->create([
                'nama_kebutuhan' => $name,
                'qty' => $qty,
                'harga_satuan' => $unitPrice,
                'subtotal' => $subtotal,
                'keterangan' => $item['notes'] ?? null,
            ]);

            $total += $subtotal;
        }

        return $total;
    }


    private function formatTimeForInput($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        try {
            return Carbon::parse($value)->format('H:i');
        } catch (\Throwable $e) {
            return substr((string) $value, 0, 5);
        }
    }

    private function mapEvent(Kegiatan $kegiatan): array
    {
        $actualCost = (float) $kegiatan->pengeluarans->sum('nominal');

        return [
            'id' => $kegiatan->id,
            'title' => $kegiatan->judul,
            'date' => optional($kegiatan->tanggal)->format('Y-m-d'),
            'startTime' => $this->formatTimeForInput($kegiatan->jam_mulai),
            'endTime' => $this->formatTimeForInput($kegiatan->jam_selesai),
            'location' => $kegiatan->lokasi,
            'category' => $kegiatan->kategori,
            'needsBudget' => (bool) $kegiatan->memerlukan_dana,
            'estimatedCost' => (float) $kegiatan->estimasi_biaya,
            'actualCost' => $actualCost,
            'status' => $kegiatan->status_kegiatan,
            'description' => $kegiatan->deskripsi,
            'responsible' => $kegiatan->penanggung_jawab,
            'targetParticipants' => $kegiatan->target_peserta,
            'mandatory' => (bool) $kegiatan->wajib_hadir,
            'budgetSource' => $kegiatan->sumber_dana,
            'financeResponsible' => $kegiatan->penanggung_jawab_dana,
            'budgetNotes' => $kegiatan->catatan_anggaran,
            'posterUrl' => $kegiatan->poster ? Storage::disk('public')->url($kegiatan->poster) : null,
            'notes' => $kegiatan->catatan,
            'budgetItems' => $kegiatan->anggaranItems->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->nama_kebutuhan,
                'quantity' => (int) $item->qty,
                'unitPrice' => (float) $item->harga_satuan,
                'subtotal' => (float) $item->subtotal,
                'notes' => $item->keterangan,
            ])->values(),
            'expenses' => $kegiatan->pengeluarans->map(fn ($expense) => [
                'id' => $expense->id,
                'date' => optional($expense->tanggal_pengeluaran)->format('Y-m-d'),
                'name' => $expense->nama_pengeluaran,
                'category' => $expense->kategori_pengeluaran,
                'amount' => (float) $expense->nominal,
                'paymentMethod' => $expense->metode_pembayaran,
                'hasProof' => ! empty($expense->bukti_pembayaran),
                'proofUrl' => $expense->bukti_pembayaran ? Storage::disk('public')->url($expense->bukti_pembayaran) : null,
                'notes' => $expense->keterangan,
            ])->values(),
        ];
    }
}
