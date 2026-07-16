<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IuranKomponen;
use App\Models\IuranPembayaran;
use App\Models\KartuKeluarga;
use App\Models\FinanceTransaction;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminFinanceController extends Controller
{
    public function index(Request $request): Response
    {
        $selectedMonth = $this->normalizeMonth($request->query('month'));
        $periodDate = Carbon::createFromFormat('Y-m', $selectedMonth)->startOfMonth();

        // Seed mock finance transactions if completely empty to show a beautiful wave chart instantly
        if (FinanceTransaction::count() === 0) {
            $mockTransactions = [
                [
                    'tipe' => 'pemasukan',
                    'kategori' => 'Donasi',
                    'jumlah' => 1200000.00,
                    'deskripsi' => 'Donasi Sosial - Masjid Jami',
                    'tanggal' => Carbon::now()->subDays(27)->toDateString(),
                ],
                [
                    'tipe' => 'pemasukan',
                    'kategori' => 'Iuran',
                    'jumlah' => 250000.00,
                    'deskripsi' => 'Iuran Tipe Ruko - Blok A',
                    'tanggal' => Carbon::now()->subDays(26)->toDateString(),
                ],
                [
                    'tipe' => 'pemasukan',
                    'kategori' => 'Iuran',
                    'jumlah' => 1800000.00,
                    'deskripsi' => 'Iuran Keamanan Warga',
                    'tanggal' => Carbon::now()->subDays(20)->toDateString(),
                ],
                [
                    'tipe' => 'pemasukan',
                    'kategori' => 'Sponsorship',
                    'jumlah' => 3120000.00,
                    'deskripsi' => 'Sponsor Toko Sembako Berkah',
                    'tanggal' => Carbon::now()->subDays(15)->toDateString(),
                ],
                [
                    'tipe' => 'pengeluaran',
                    'kategori' => 'Operasional',
                    'jumlah' => 450000.00,
                    'deskripsi' => 'Perbaikan Lampu Jalan RT',
                    'tanggal' => Carbon::now()->subDays(10)->toDateString(),
                ],
                [
                    'tipe' => 'pengeluaran',
                    'kategori' => 'Kegiatan',
                    'jumlah' => 7790000.00,
                    'deskripsi' => 'Acara Kerja Bakti RT',
                    'tanggal' => Carbon::now()->subDays(5)->toDateString(),
                ],
            ];
            foreach ($mockTransactions as $t) {
                FinanceTransaction::create(array_merge($t, [
                    'status' => 'Berhasil',
                    'created_by' => $request->user()?->id,
                ]));
            }
        }

        $components = IuranKomponen::query()
            ->where('is_active', true)
            ->orderBy('urutan')
            ->orderBy('id')
            ->get();

        $feeComponents = IuranKomponen::query()
            ->orderBy('urutan')
            ->orderBy('id')
            ->get();

        $totalMonthlyFee = (float) $components->sum('nominal');

        $families = KartuKeluarga::query()
            ->with(['hunian', 'iuranPembayarans' => function ($query) use ($periodDate) {
                $query->whereDate('periode', $periodDate->toDateString())
                    ->latest('tanggal_bayar')
                    ->latest('id');
            }])
            ->whereHas('hunian')
            ->orderBy(
                \App\Models\Hunian::select('no_rumah')
                    ->whereColumn('hunians.id', 'kartu_keluargas.hunian_id')
                    ->limit(1)
            )
            ->get();

        $payments = $families->map(function (KartuKeluarga $kk) use ($selectedMonth, $totalMonthlyFee) {
            $history = $kk->iuranPembayarans;
            $verifiedPayments = $history->where('status_verifikasi', 'verified');
            $pendingPayment = $history->firstWhere('status_verifikasi', 'pending');
            $latestPayment = $history->first();
            $paidAmount = (float) $verifiedPayments->sum('jumlah_dibayar');
            $status = $this->paymentStatus($paidAmount, $totalMonthlyFee, $pendingPayment !== null);

            return [
                'id' => $kk->id,
                'kartuKeluargaId' => $kk->id,
                'houseNumber' => $kk->hunian?->no_rumah ?? '-',
                'headOfFamily' => $kk->nama_kepala_keluarga,
                'kkNumber' => $kk->no_kk ? $this->maskKkNumber($kk->no_kk) : '-',
                'period' => $this->formatPeriodLabel($selectedMonth),
                'periodValue' => $selectedMonth,
                'totalBill' => $totalMonthlyFee,
                'status' => $status,
                'paymentDate' => $latestPayment?->tanggal_bayar?->toDateString(),
                'paymentMethod' => $latestPayment?->metode_pembayaran,
                'hasProof' => $latestPayment?->bukti_pembayaran ? true : false,
                'proofUrl' => $latestPayment?->bukti_pembayaran ? Storage::url($latestPayment->bukti_pembayaran) : null,
                'paidAmount' => $paidAmount,
                'verificationNotes' => $latestPayment?->catatan_verifikasi,
                'paymentHistory' => $history->map(fn (IuranPembayaran $payment) => [
                    'id' => $payment->id,
                    'date' => $payment->tanggal_bayar?->toDateString(),
                    'amount' => (float) $payment->jumlah_dibayar,
                    'method' => $payment->metode_pembayaran,
                    'status' => $this->historyStatus($payment->status_verifikasi),
                    'verificationStatus' => $payment->status_verifikasi,
                    'proofUrl' => $payment->bukti_pembayaran ? Storage::url($payment->bukti_pembayaran) : null,
                    'notes' => $payment->catatan,
                    'verificationNotes' => $payment->catatan_verifikasi,
                ])->values(),
            ];
        })->values();

        // Calculate statistics
        $sumPemasukan = (float) FinanceTransaction::where('tipe', 'pemasukan')->sum('jumlah');
        $sumPengeluaran = (float) FinanceTransaction::where('tipe', 'pengeluaran')->sum('jumlah');
        $totalKasBalance = $sumPemasukan - $sumPengeluaran;

        $currentYear = Carbon::now()->year;
        $currentMonth = Carbon::now()->month;

        $pemasukanBulanIni = (float) FinanceTransaction::where('tipe', 'pemasukan')
            ->whereYear('tanggal', $currentYear)
            ->whereMonth('tanggal', $currentMonth)
            ->sum('jumlah');

        $pengeluaranBulanIni = (float) FinanceTransaction::where('tipe', 'pengeluaran')
            ->whereYear('tanggal', $currentYear)
            ->whereMonth('tanggal', $currentMonth)
            ->sum('jumlah');

        // Percentage for source categories
        $totalPemasukanForSources = FinanceTransaction::where('tipe', 'pemasukan')->sum('jumlah') ?: 1;
        $sumberPemasukan = [
            'Iuran' => round((FinanceTransaction::where('tipe', 'pemasukan')->where('kategori', 'Iuran')->sum('jumlah') / $totalPemasukanForSources) * 100),
            'Donasi' => round((FinanceTransaction::where('tipe', 'pemasukan')->where('kategori', 'Donasi')->sum('jumlah') / $totalPemasukanForSources) * 100),
            'Sponsorship' => round((FinanceTransaction::where('tipe', 'pemasukan')->where('kategori', 'Sponsorship')->sum('jumlah') / $totalPemasukanForSources) * 100),
            'Lain-lain' => round((FinanceTransaction::where('tipe', 'pemasukan')->whereNotIn('kategori', ['Iuran', 'Donasi', 'Sponsorship'])->sum('jumlah') / $totalPemasukanForSources) * 100),
        ];

        // Chart data
        $monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $arusKasData = [];
        for ($m = 1; $m <= 12; $m++) {
            $p = (float) FinanceTransaction::where('tipe', 'pemasukan')
                ->whereYear('tanggal', $currentYear)
                ->whereMonth('tanggal', $m)
                ->sum('jumlah');
            $e = (float) FinanceTransaction::where('tipe', 'pengeluaran')
                ->whereYear('tanggal', $currentYear)
                ->whereMonth('tanggal', $m)
                ->sum('jumlah');
            $arusKasData[] = [
                'label' => $monthsShort[$m - 1],
                'pemasukan' => $p,
                'pengeluaran' => $e,
            ];
        }

        // Recent transactions
        $transactions = FinanceTransaction::latest('tanggal')
            ->latest('id')
            ->get()
            ->map(fn(FinanceTransaction $t) => [
                'id' => $t->id,
                'tipe' => $t->tipe,
                'kategori' => $t->kategori,
                'jumlah' => (float)$t->jumlah,
                'deskripsi' => $t->deskripsi,
                'tanggal' => $t->tanggal->toDateString(),
                'status' => $t->status,
            ])
            ->values();

        return Inertia::render('Admin/Finance', [
            'selectedMonth' => $selectedMonth,
            'monthlyFees' => $components->map(fn (IuranKomponen $component) => [
                'id' => $component->id,
                'name' => $component->nama,
                'amount' => (float) $component->nominal,
                'note' => $component->keterangan,
            ])->values(),
            'feeComponents' => $feeComponents->map(fn (IuranKomponen $component) => [
                'id' => $component->id,
                'name' => $component->nama,
                'amount' => (float) $component->nominal,
                'note' => $component->keterangan,
                'order' => (int) $component->urutan,
                'isActive' => (bool) $component->is_active,
            ])->values(),
            'payments' => $payments,
            'familyOptions' => $families->map(fn (KartuKeluarga $kk) => [
                'id' => $kk->id,
                'houseNumber' => $kk->hunian?->no_rumah ?? '-',
                'headOfFamily' => $kk->nama_kepala_keluarga,
                'kkNumber' => $kk->no_kk ? $this->maskKkNumber($kk->no_kk) : '-',
            ])->values(),
            'financeStats' => [
                'totalKasBalance' => $totalKasBalance,
                'pemasukanBulanIni' => $pemasukanBulanIni,
                'pengeluaranBulanIni' => $pengeluaranBulanIni,
                'sumberPemasukan' => $sumberPemasukan,
                'arusKasData' => $arusKasData,
                'transactions' => $transactions,
            ],
        ]);
    }


    public function storeComponent(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:100'],
            'nominal' => ['required', 'numeric', 'min:0'],
            'keterangan' => ['nullable', 'string'],
            'urutan' => ['nullable', 'integer', 'min:0'],
        ]);

        IuranKomponen::create([
            'nama' => $validated['nama'],
            'nominal' => $validated['nominal'],
            'keterangan' => $validated['keterangan'] ?? null,
            'urutan' => $validated['urutan'] ?? 0,
            'is_active' => true,
        ]);

        return back()->with('success', 'Komponen iuran berhasil ditambahkan.');
    }

    public function updateComponent(Request $request, IuranKomponen $component): RedirectResponse
    {
        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:100'],
            'nominal' => ['required', 'numeric', 'min:0'],
            'keterangan' => ['nullable', 'string'],
            'urutan' => ['nullable', 'integer', 'min:0'],
        ]);

        $component->update([
            'nama' => $validated['nama'],
            'nominal' => $validated['nominal'],
            'keterangan' => $validated['keterangan'] ?? null,
            'urutan' => $validated['urutan'] ?? 0,
        ]);

        return back()->with('success', 'Komponen iuran berhasil diperbarui.');
    }

    public function toggleComponent(IuranKomponen $component): RedirectResponse
    {
        $component->update([
            'is_active' => ! $component->is_active,
        ]);

        return back()->with('success', $component->is_active ? 'Komponen iuran berhasil diaktifkan.' : 'Komponen iuran berhasil dinonaktifkan.');
    }

    public function storePayment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'kartu_keluarga_id' => ['required', 'exists:kartu_keluargas,id'],
            'periode' => ['required', 'date_format:Y-m'],
            'jumlah_dibayar' => ['required', 'numeric', 'min:0'],
            'tanggal_bayar' => ['required', 'date'],
            'metode_pembayaran' => ['required', 'string', 'max:50', Rule::in(['Tunai', 'Transfer Bank', 'E-Wallet'])],
            'status_verifikasi' => ['required', 'string', Rule::in(['verified', 'pending'])],
            'bukti_pembayaran' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:2048'],
            'catatan' => ['nullable', 'string'],
        ]);

        $periodDate = Carbon::createFromFormat('Y-m', $validated['periode'])->startOfMonth();
        $proofPath = $request->hasFile('bukti_pembayaran')
            ? $request->file('bukti_pembayaran')->store('iuran/bukti-pembayaran', 'public')
            : null;

        $payment = IuranPembayaran::create([
            'kartu_keluarga_id' => $validated['kartu_keluarga_id'],
            'periode' => $periodDate->toDateString(),
            'jumlah_dibayar' => $validated['jumlah_dibayar'],
            'tanggal_bayar' => $validated['tanggal_bayar'],
            'metode_pembayaran' => $validated['metode_pembayaran'],
            'status_verifikasi' => $validated['status_verifikasi'],
            'bukti_pembayaran' => $proofPath,
            'catatan' => $validated['catatan'] ?? null,
            'created_by' => $request->user()?->id,
            'verified_by' => $validated['status_verifikasi'] === 'verified' ? $request->user()?->id : null,
            'verified_at' => $validated['status_verifikasi'] === 'verified' ? now() : null,
        ]);

        if ($validated['status_verifikasi'] === 'verified') {
            $kk = KartuKeluarga::find($validated['kartu_keluarga_id']);
            FinanceTransaction::create([
                'tipe' => 'pemasukan',
                'kategori' => 'Iuran',
                'jumlah' => $validated['jumlah_dibayar'],
                'deskripsi' => 'Pembayaran Iuran Warga - Rumah No. ' . ($kk?->hunian?->no_rumah ?? '-') . ' (' . ($kk?->nama_kepala_keluarga ?? '-') . ')',
                'tanggal' => $validated['tanggal_bayar'],
                'status' => 'Berhasil',
                'created_by' => $request->user()?->id,
            ]);
        }

        return redirect()
            ->route('admin.finance.index', ['month' => $validated['periode']])
            ->with('success', 'Pembayaran iuran berhasil disimpan.');
    }

    public function verifyPayment(Request $request, IuranPembayaran $payment): RedirectResponse
    {
        $payment->update([
            'status_verifikasi' => 'verified',
            'catatan_verifikasi' => $request->input('catatan_verifikasi'),
            'verified_by' => $request->user()?->id,
            'verified_at' => now(),
        ]);

        FinanceTransaction::create([
            'tipe' => 'pemasukan',
            'kategori' => 'Iuran',
            'jumlah' => $payment->jumlah_dibayar,
            'deskripsi' => 'Pembayaran Iuran Warga (Diverifikasi) - Rumah No. ' . ($payment->kartuKeluarga?->hunian?->no_rumah ?? '-') . ' (' . ($payment->kartuKeluarga?->nama_kepala_keluarga ?? '-') . ')',
            'tanggal' => $payment->tanggal_bayar ?? now(),
            'status' => 'Berhasil',
            'created_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'Pembayaran berhasil diverifikasi.');
    }

    public function rejectPayment(Request $request, IuranPembayaran $payment): RedirectResponse
    {
        $validated = $request->validate([
            'catatan_verifikasi' => ['nullable', 'string'],
        ]);

        $payment->update([
            'status_verifikasi' => 'rejected',
            'catatan_verifikasi' => $validated['catatan_verifikasi'] ?? null,
            'verified_by' => $request->user()?->id,
            'verified_at' => now(),
        ]);

        return back()->with('success', 'Pembayaran berhasil ditolak.');
    }

    public function storeTransaction(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tipe' => ['required', 'in:pemasukan,pengeluaran'],
            'kategori' => ['required', 'string', 'max:50'],
            'jumlah' => ['required', 'numeric', 'min:0'],
            'deskripsi' => ['required', 'string'],
            'tanggal' => ['required', 'date'],
        ]);

        FinanceTransaction::create([
            'tipe' => $validated['tipe'],
            'kategori' => $validated['kategori'],
            'jumlah' => $validated['jumlah'],
            'deskripsi' => $validated['deskripsi'],
            'tanggal' => $validated['tanggal'],
            'status' => 'Berhasil',
            'created_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'Transaksi berhasil ditambahkan.');
    }

    public function destroyTransaction(FinanceTransaction $transaction): RedirectResponse
    {
        $transaction->delete();
        return back()->with('success', 'Transaksi berhasil dihapus.');
    }

    private function normalizeMonth(?string $month): string
    {
        if ($month && preg_match('/^\d{4}-\d{2}$/', $month)) {
            return $month;
        }

        return now()->format('Y-m');
    }

    private function paymentStatus(float $paidAmount, float $totalBill, bool $hasPending): string
    {
        if ($hasPending) {
            return 'Menunggu Verifikasi';
        }

        if ($totalBill <= 0 && $paidAmount <= 0) {
            return 'Belum Bayar';
        }

        if ($paidAmount <= 0) {
            return 'Belum Bayar';
        }

        if ($paidAmount >= $totalBill) {
            return 'Sudah Bayar';
        }

        return 'Kurang Bayar';
    }

    private function historyStatus(string $verificationStatus): string
    {
        return match ($verificationStatus) {
            'pending' => 'Menunggu Verifikasi',
            'verified' => 'Sudah Bayar',
            'rejected' => 'Ditolak',
            default => 'Belum Bayar',
        };
    }

    private function formatPeriodLabel(string $month): string
    {
        return Carbon::createFromFormat('Y-m', $month)
            ->locale('id')
            ->translatedFormat('F Y');
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
