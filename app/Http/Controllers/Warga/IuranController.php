<?php

namespace App\Http\Controllers\Warga;

use App\Http\Controllers\Controller;
use App\Models\IuranPembayaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class IuranController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user()->load(['warga.kartuKeluarga.hunian', 'warga.hunian']);
        $warga = $user->warga;
        $kartuKeluarga = $warga?->kartuKeluarga;

        if (! $warga || ! $kartuKeluarga) {
            return Inertia::render('Warga/Iuran', [
                'profile' => $this->profile($user, $warga),
                'currentBills' => [],
                'payments' => [],
            ]);
        }

        $period = now()->startOfMonth();
        $activeComponentSummary = $this->activeComponentSummary();

        $actualIurans = IuranPembayaran::query()
            ->where('kartu_keluarga_id', $kartuKeluarga->id)
            ->orderByRaw("\n                CASE\n                    WHEN status_verifikasi IN ('belum_bayar', 'menunggu_verifikasi', 'pending', 'ditolak', 'rejected') THEN 0\n                    ELSE 1\n                END\n            ")
            ->orderByDesc('periode')
            ->orderByDesc('id')
            ->get();

        $currentPayment = $this->currentPeriodPayment($kartuKeluarga->id, $period);

        if ($currentPayment) {
            $currentBills = collect([$this->mapBill($currentPayment, $activeComponentSummary)]);
        } elseif ($activeComponentSummary['amount'] > 0) {
            $currentBills = collect([$this->virtualCurrentBill($period, $activeComponentSummary)]);
        } else {
            $currentBills = collect();
        }

        $payments = $actualIurans
            ->filter(fn (IuranPembayaran $iuran) => $this->isPaymentHistory($iuran->status_verifikasi))
            ->map(fn (IuranPembayaran $iuran) => $this->mapPayment($iuran, $activeComponentSummary))
            ->values();

        return Inertia::render('Warga/Iuran', [
            'profile' => $this->profile($user, $warga),
            'currentBills' => $currentBills->values(),
            'payments' => $payments,
        ]);
    }

    public function uploadBukti(Request $request): RedirectResponse
{
    $user = $request->user();
    $warga = $user->warga()->with('kartuKeluarga')->first();
    $kartuKeluarga = $warga?->kartuKeluarga;

    if (! $warga || ! $kartuKeluarga) {
        abort(403, 'Akun Anda belum terhubung dengan data kartu keluarga.');
    }

    $validated = $request->validate([
        'periode' => ['required', 'date'],
        'amount' => ['required', 'numeric', 'min:1'],
        'metode_pembayaran' => ['required', 'string', 'max:100'],
        'bukti_pembayaran' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:2048'],
        'catatan' => ['nullable', 'string', 'max:1000'],
    ]);

    $iuran = IuranPembayaran::query()
        ->where('kartu_keluarga_id', $kartuKeluarga->id)
        ->whereDate('periode', $validated['periode'])
        ->first();

    if (! $iuran) {
        $iuran = IuranPembayaran::create([
            'kartu_keluarga_id' => $kartuKeluarga->id,
            'periode' => $validated['periode'],
            'jumlah_dibayar' => $validated['amount'],
            'tanggal_bayar' => null,
            'metode_pembayaran' => null,
            'status_verifikasi' => 'belum_bayar',
            'bukti_pembayaran' => null,
            'catatan' => null,
            'created_by' => $user->id,
        ]);
    }

    if ($iuran->bukti_pembayaran) {
        Storage::disk('public')->delete($iuran->bukti_pembayaran);
    }

    $path = $request->file('bukti_pembayaran')->store('bukti-iuran', 'public');

    $iuran->update([
        'jumlah_dibayar' => $validated['amount'],
        'tanggal_bayar' => now()->toDateString(),
        'metode_pembayaran' => $validated['metode_pembayaran'],
        'bukti_pembayaran' => $path,
        'catatan' => $validated['catatan'] ?? null,
        'status_verifikasi' => 'menunggu_verifikasi',
        'created_by' => $user->id,
        'catatan_verifikasi' => null,
        'verified_by' => null,
        'verified_at' => null,
    ]);

    return redirect()
        ->route('warga.iuran')
        ->with('success', 'Bukti pembayaran berhasil dikirim dan menunggu verifikasi admin.');
}

    private function profile($user, $warga): array
    {
        $houseNumber = data_get($warga, 'hunian.nomor_rumah')
            ?? data_get($warga, 'hunian.no_rumah')
            ?? data_get($warga, 'hunian.blok_nomor')
            ?? data_get($warga, 'kartuKeluarga.hunian.nomor_rumah')
            ?? data_get($warga, 'kartuKeluarga.hunian.no_rumah')
            ?? data_get($warga, 'kartuKeluarga.hunian.blok_nomor')
            ?? '-';

        $name = $warga?->nama_lengkap ?? $user->name ?? 'Warga';

        return [
            'name' => $name,
            'initials' => $this->initials($name),
            'houseNumber' => (string) $houseNumber,
            'hasLinkedWarga' => (bool) $warga,
        ];
    }

    private function currentPeriodPayment(int $kartuKeluargaId, Carbon $period): ?IuranPembayaran
    {
        return IuranPembayaran::query()
            ->where('kartu_keluarga_id', $kartuKeluargaId)
            ->whereYear('periode', $period->year)
            ->whereMonth('periode', $period->month)
            ->latest('id')
            ->first();
    }

    private function activeComponentSummary(): array
    {
        $table = $this->componentTableName();

        if (! $table) {
            return [
                'amount' => 0,
                'notes' => null,
                'items' => [],
            ];
        }

        $query = DB::table($table);

        if ($this->columnExists($table, 'is_active')) {
            $query->where('is_active', true);
        } elseif ($this->columnExists($table, 'status')) {
            $query->whereIn('status', ['aktif', 'active', 1, true]);
        }

        if ($this->columnExists($table, 'urutan')) {
            $query->orderBy('urutan');
        } elseif ($this->columnExists($table, 'sort_order')) {
            $query->orderBy('sort_order');
        }

        $rows = $query->get();

        $items = $rows->map(function ($row) use ($table) {
            $name = $this->rowValue($row, ['nama_komponen', 'nama', 'name', 'title']) ?? 'Komponen Iuran';
            $amount = (float) ($this->rowValue($row, ['nominal', 'jumlah', 'amount', 'nilai']) ?? 0);
            $note = $this->rowValue($row, ['catatan', 'deskripsi', 'description', 'keterangan']);

            return [
                'name' => $name,
                'amount' => $amount,
                'note' => $note,
            ];
        })->filter(fn (array $item) => $item['amount'] > 0)->values();

        $notes = $items
            ->map(fn (array $item) => $item['name'] . ' : Rp' . number_format($item['amount'], 0, ',', '.'))
            ->implode(' ');

        return [
            'amount' => $items->sum('amount'),
            'notes' => $notes ?: null,
            'items' => $items->all(),
        ];
    }

    private function componentTableName(): ?string
    {
        foreach (['iuran_komponens', 'iuran_components', 'komponen_iurans', 'iuran_komponen'] as $table) {
            if (Schema::hasTable($table)) {
                return $table;
            }
        }

        return null;
    }

    private function mapBill(IuranPembayaran $iuran, array $componentSummary = []): array
    {
        $amount = (float) ($iuran->jumlah_dibayar ?: ($componentSummary['amount'] ?? 0));
        $status = $iuran->status_verifikasi ?: 'belum_bayar';

        return [
            'id' => $iuran->id,
            'title' => $this->titleFromPeriod($iuran->periode),
            'period' => optional($iuran->periode)->translatedFormat('F Y') ?? '-',
            'amount' => $amount,
            'dueDate' => optional($iuran->periode)->endOfMonth()->toDateString(),
            'status' => $this->statusLabel($status),
            'rawStatus' => $status,
            'method' => $iuran->metode_pembayaran,
            'proofUrl' => $iuran->bukti_pembayaran ? Storage::url($iuran->bukti_pembayaran) : null,
            'notes' => $iuran->catatan ?: ($componentSummary['notes'] ?? null),
            'isVirtual' => false,
        ];
    }

    private function virtualCurrentBill(Carbon $period, array $componentSummary): array
    {
        return [
            'id' => null,
            'title' => 'Iuran Bulanan ' . $period->translatedFormat('F Y'),
            'period' => $period->translatedFormat('F Y'),
            'amount' => (float) $componentSummary['amount'],
            'dueDate' => $period->copy()->endOfMonth()->toDateString(),
            'status' => 'Belum Bayar',
            'rawStatus' => 'belum_bayar',
            'method' => null,
            'proofUrl' => null,
            'notes' => $componentSummary['notes'] ?? null,
            'isVirtual' => true,
        ];
    }

    private function mapPayment(IuranPembayaran $iuran, array $componentSummary = []): array
    {
        $status = $iuran->status_verifikasi ?: 'belum_bayar';

        return [
            'id' => $iuran->id,
            'title' => $this->titleFromPeriod($iuran->periode),
            'date' => optional($iuran->tanggal_bayar ?? $iuran->updated_at)->toDateString(),
            'amount' => (float) ($iuran->jumlah_dibayar ?: ($componentSummary['amount'] ?? 0)),
            'method' => $this->methodLabel($iuran->metode_pembayaran),
            'status' => $this->statusLabel($status),
            'rawStatus' => $status,
            'proofUrl' => $iuran->bukti_pembayaran ? Storage::url($iuran->bukti_pembayaran) : null,
        ];
    }

    private function titleFromPeriod($period): string
    {
        $date = $period instanceof Carbon ? $period : ($period ? Carbon::parse($period) : null);

        return $date ? 'Iuran Bulanan ' . $date->translatedFormat('F Y') : 'Iuran Bulanan';
    }

    private function isPaymentHistory(?string $status): bool
    {
        return in_array($status, [
            'lunas',
            'sudah_bayar',
            'verified',
            'terverifikasi',
            'menunggu_verifikasi',
            'pending',
            'ditolak',
            'rejected',
        ], true);
    }

    private function isPaid(?string $status): bool
    {
        return in_array($status, ['lunas', 'sudah_bayar', 'verified', 'terverifikasi'], true);
    }

    private function statusLabel(?string $status): string
    {
        return match ($status) {
            'lunas', 'sudah_bayar', 'verified', 'terverifikasi' => 'Lunas',
            'menunggu_verifikasi', 'pending' => 'Menunggu Verifikasi',
            'ditolak', 'rejected' => 'Ditolak',
            default => 'Belum Bayar',
        };
    }

    private function methodLabel(?string $method): ?string
    {
        return match ($method) {
            'transfer_bank' => 'Transfer Bank',
            'qris' => 'QRIS',
            'tunai' => 'Tunai',
            null, '' => null,
            default => $method,
        };
    }

    private function initials(string $name): string
    {
        return collect(explode(' ', trim($name)))
            ->filter()
            ->take(2)
            ->map(fn (string $word) => strtoupper(mb_substr($word, 0, 1)))
            ->implode('') ?: 'WG';
    }

    private function columnExists(string $table, string $column): bool
    {
        return Schema::hasColumn($table, $column);
    }

    private function rowValue(object $row, array $columns): mixed
    {
        foreach ($columns as $column) {
            if (property_exists($row, $column)) {
                return $row->{$column};
            }
        }

        return null;
    }
}
