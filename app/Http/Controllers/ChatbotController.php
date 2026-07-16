<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Throwable;

class ChatbotController extends Controller
{
    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'min:1', 'max:1000'],
            'mode' => ['nullable', 'string', 'in:public,warga'],
            'history' => ['nullable', 'array', 'max:8'],
            'history.*.role' => ['required_with:history', 'in:user,assistant'],
            'history.*.content' => ['required_with:history', 'string', 'max:3000'],
            'public_context' => ['nullable', 'array'],
        ]);

        $apiKey = config('services.openrouter.api_key');
        $model = config('services.openrouter.model', 'openai/gpt-4o-mini');
        $siteUrl = config('services.openrouter.site_url', 'http://localhost:8000');
        $appName = config('services.openrouter.app_name', 'SMART-RT');

        $mode = $validated['mode'] ?? 'public';
        $user = $request->user();

        $publicContext = $validated['public_context'] ?? [];
        $wargaContext = $mode === 'warga' && $user
            ? $this->buildWargaContext($user)
            : [];

        if (! $apiKey) {
            return response()->json([
                'reply' => 'Konfigurasi AI belum aktif. Admin perlu menambahkan OPENROUTER_API_KEY di file .env terlebih dahulu.',
            ]);
        }

        $messages = [
            [
                'role' => 'system',
                'content' => $this->buildSystemInstruction($mode, $user, $publicContext, $wargaContext),
            ],
        ];

        foreach (($validated['history'] ?? []) as $item) {
            $messages[] = [
                'role' => $item['role'],
                'content' => $item['content'],
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $validated['message'],
        ];

        try {
            $response = Http::timeout(45)
                ->acceptJson()
                ->withToken($apiKey)
                ->withHeaders([
                    'HTTP-Referer' => $siteUrl,
                    'X-Title' => $appName,
                ])
                ->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => $model,
                    'messages' => $messages,
                    'temperature' => 0.15,
                    'max_tokens' => 400,
                ]);

            if (! $response->successful()) {
                report('OpenRouter API error: ' . $response->body());

                return response()->json([
                    'reply' => 'Maaf, asisten sedang mengalami kendala koneksi. Silakan coba lagi beberapa saat.',
                ], 502);
            }

            $reply = data_get($response->json(), 'choices.0.message.content');

            return response()->json([
                'reply' => $reply ?: 'Maaf, saya belum bisa menjawab pertanyaan itu. Silakan coba dengan pertanyaan yang lebih spesifik.',
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'reply' => 'Maaf, terjadi kendala pada layanan asisten. Silakan coba lagi nanti.',
            ], 500);
        }
    }

    private function buildSystemInstruction(string $mode, mixed $user = null, array $publicContext = [], array $wargaContext = []): string
    {
        $publicJson = json_encode(
            $this->minimizePublicContext($publicContext),
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );

        $wargaJson = json_encode(
            $wargaContext,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );

        $instructions = [
            'Anda adalah SMART-RT Assistant untuk portal digital RT.',
            'Jawab dalam bahasa Indonesia yang singkat, jelas, ramah, dan praktis.',
            'Jangan mengarang data yang tidak diberikan oleh sistem.',
            'Gunakan hanya data yang tersedia pada DATA PUBLIK DARI SISTEM dan DATA WARGA LOGIN.',
            'Jika data tidak tersedia, katakan bahwa data tersebut belum tersedia di sistem SMART-RT.',
            'Jangan membuat nama, nomor, alamat, status, periode, tagihan, surat, pengaduan, atau kegiatan secara asumsi.',
            '',
            'ATURAN AKUN SMART-RT:',
            'Warga tidak mendaftar akun sendiri melalui halaman login.',
            'Akun warga dibuat atau diaktifkan berdasarkan data KK dan data warga yang sudah diinput oleh admin RT.',
            'Jika warga belum punya akun, arahkan warga untuk menghubungi Sekretariat RT.',
            'Halaman login hanya digunakan untuk masuk ke akun yang sudah dibuat atau diaktifkan oleh admin.',
            '',
            'DATA PUBLIK DARI SISTEM:',
            $publicJson ?: '{}',
        ];

        if ($mode === 'warga' && $user) {
            $instructions[] = '';
            $instructions[] = 'MODE SAAT INI: WARGA LOGIN.';
            $instructions[] = 'Nama user login: ' . ($user->name ?? 'Warga');
            $instructions[] = 'Jawab data pribadi hanya berdasarkan DATA WARGA LOGIN.';
            $instructions[] = 'Jangan menampilkan data warga lain.';
            $instructions[] = 'Jika warga bertanya iuran, gunakan data iuran berdasarkan kartu_keluarga_id miliknya.';
            $instructions[] = 'Jika warga bertanya surat, gunakan data pengajuan surat berdasarkan pemohon_warga_id miliknya.';
            $instructions[] = 'Jika warga bertanya pengaduan, gunakan data pengaduan berdasarkan warga_id miliknya.';
            $instructions[] = 'Jika warga bertanya kegiatan saya, gunakan data partisipasi berdasarkan warga_id atau user_id miliknya.';
            $instructions[] = '';
            $instructions[] = 'DATA WARGA LOGIN:';
            $instructions[] = $wargaJson ?: '{}';
        } else {
            $instructions[] = '';
            $instructions[] = 'MODE SAAT INI: PUBLIK.';
            $instructions[] = 'Jangan menjawab data pribadi warga, status iuran pribadi, status surat pribadi, atau pengaduan pribadi.';
            $instructions[] = 'Jika pengunjung bertanya data pribadi, arahkan untuk login ke Portal Warga.';
        }

        return implode("\n", $instructions);
    }

    private function buildWargaContext(mixed $user): array
    {
        $user->loadMissing([
            'warga',
            'warga.hunian',
            'warga.kartuKeluarga',
            'warga.kartuKeluarga.hunian',
        ]);

        $warga = $user->warga;

        if (! $warga) {
            return [
                'akun' => [
                    'nama' => $user->name ?? null,
                    'email' => $user->email ?? null,
                    'role' => $user->role ?? null,
                    'status_akun' => $user->is_active ? 'aktif' : 'nonaktif',
                ],
                'catatan' => 'User login belum terhubung dengan data warga.',
            ];
        }

        $kk = $warga->kartuKeluarga;
        $hunian = $warga->hunian ?? $kk?->hunian;

        return [
            'akun' => [
                'nama' => $user->name ?? null,
                'email' => $user->email ?? null,
                'role' => $user->role ?? null,
                'status_akun' => $user->is_active ? 'aktif' : 'nonaktif',
            ],
            'profil_warga' => [
                'id_warga' => $warga->id,
                'nama_lengkap' => $warga->nama_lengkap,
                'nik' => $this->maskNik($warga->nik),
                'jenis_kelamin' => $warga->jenis_kelamin,
                'tempat_lahir' => $warga->tempat_lahir,
                'tanggal_lahir' => optional($warga->tanggal_lahir)->format('d-m-Y'),
                'agama' => $warga->agama,
                'pendidikan' => $warga->pendidikan,
                'pekerjaan' => $warga->pekerjaan,
                'status_perkawinan' => $warga->status_perkawinan,
                'hubungan_keluarga' => $warga->hubungan_keluarga,
                'kepala_keluarga' => (bool) $warga->is_kepala_keluarga,
            ],
            'kartu_keluarga' => [
                'id_kk' => $kk?->id,
                'no_kk' => $this->maskKk($kk?->no_kk),
                'nama_kepala_keluarga' => $kk?->nama_kepala_keluarga,
                'alamat' => $kk?->alamat,
                'rt' => $kk?->rt,
                'rw' => $kk?->rw,
                'kelurahan_desa' => $kk?->kelurahan_desa,
                'kecamatan' => $kk?->kecamatan,
                'kabupaten_kota' => $kk?->kabupaten_kota,
                'provinsi' => $kk?->provinsi,
                'kode_pos' => $kk?->kode_pos,
            ],
            'hunian' => [
                'id_hunian' => $hunian?->id,
                'no_rumah' => $hunian?->no_rumah,
                'alamat_hunian' => $hunian?->alamat_hunian,
                'status_hunian' => $hunian?->status_hunian,
                'status_warga' => $hunian?->status_warga,
                'kontak_penghuni' => $hunian?->kontak_penghuni,
                'nama_kos' => $hunian?->nama_kos,
                'nomor_kamar' => $hunian?->nomor_kamar,
            ],
            'iuran_terakhir' => $this->getIuranTerakhir($warga),
            'surat_terakhir' => $this->getSuratTerakhir($warga),
            'pengaduan_terakhir' => $this->getPengaduanTerakhir($warga),
            'kegiatan_saya' => $this->getKegiatanSaya($warga, $user),
        ];
    }

    private function getIuranTerakhir(mixed $warga): array
    {
        if (! class_exists(\App\Models\IuranPembayaran::class) || ! $warga->kartu_keluarga_id) {
            return [];
        }

        return \App\Models\IuranPembayaran::query()
            ->where('kartu_keluarga_id', $warga->kartu_keluarga_id)
            ->latest()
            ->limit(3)
            ->get()
            ->map(fn ($item) => [
                'periode' => data_get($item, 'periode') ?? data_get($item, 'bulan') ?? data_get($item, 'tahun'),
                'jumlah' => data_get($item, 'jumlah') ?? data_get($item, 'nominal') ?? data_get($item, 'total_bayar'),
                'status' => data_get($item, 'status') ?? data_get($item, 'status_verifikasi'),
                'tanggal_bayar' => $this->formatDate(data_get($item, 'tanggal_bayar') ?? data_get($item, 'paid_at') ?? data_get($item, 'created_at')),
            ])
            ->toArray();
    }

    private function getSuratTerakhir(mixed $warga): array
    {
        if (! class_exists(\App\Models\PengajuanSurat::class)) {
            return [];
        }

        return \App\Models\PengajuanSurat::query()
            ->where('pemohon_warga_id', $warga->id)
            ->latest()
            ->limit(3)
            ->get()
            ->map(fn ($item) => [
                'nomor' => data_get($item, 'nomor_surat') ?? data_get($item, 'kode_pengajuan'),
                'jenis_surat' => data_get($item, 'jenis_surat') ?? data_get($item, 'jenis'),
                'keperluan' => data_get($item, 'keperluan'),
                'status' => data_get($item, 'status'),
                'tanggal_pengajuan' => $this->formatDate(data_get($item, 'created_at') ?? data_get($item, 'tanggal_pengajuan')),
            ])
            ->toArray();
    }

    private function getPengaduanTerakhir(mixed $warga): array
    {
        if (! class_exists(\App\Models\Pengaduan::class)) {
            return [];
        }

        return \App\Models\Pengaduan::query()
            ->where('warga_id', $warga->id)
            ->latest()
            ->limit(3)
            ->get()
            ->map(fn ($item) => [
                'judul' => data_get($item, 'judul') ?? data_get($item, 'title'),
                'kategori' => data_get($item, 'kategori'),
                'status' => data_get($item, 'status'),
                'tanggal' => $this->formatDate(data_get($item, 'created_at') ?? data_get($item, 'tanggal_pengaduan')),
            ])
            ->toArray();
    }

    private function getKegiatanSaya(mixed $warga, mixed $user): array
    {
        if (! class_exists(\App\Models\KegiatanPartisipasi::class)) {
            return [];
        }

        return \App\Models\KegiatanPartisipasi::query()
            ->where(function ($query) use ($warga, $user) {
                $query->where('warga_id', $warga->id)
                    ->orWhere('user_id', $user->id);
            })
            ->latest()
            ->limit(3)
            ->get()
            ->map(fn ($item) => [
                'kegiatan_id' => data_get($item, 'kegiatan_id'),
                'status' => data_get($item, 'status'),
                'tanggal_ikut' => $this->formatDate(data_get($item, 'created_at')),
            ])
            ->toArray();
    }

    private function minimizePublicContext(array $context): array
    {
        return [
            'profil_rt' => $context['profil_rt'] ?? null,
            'statistik' => $context['statistik'] ?? [],
            'struktur_rt' => $context['struktur_rt'] ?? null,
            'pengumuman_publik' => array_slice($context['pengumuman_publik'] ?? [], 0, 3),
            'kegiatan_publik' => array_slice($context['kegiatan_publik'] ?? [], 0, 3),
            'dokumen_publik' => array_slice($context['dokumen_publik'] ?? [], 0, 3),
            'galeri_publik' => array_slice($context['galeri_publik'] ?? [], 0, 3),
        ];
    }

    private function maskNik(?string $nik): ?string
    {
        if (! $nik) {
            return null;
        }

        return substr($nik, 0, 6) . '******' . substr($nik, -4);
    }

    private function maskKk(?string $noKk): ?string
    {
        if (! $noKk) {
            return null;
        }

        return substr($noKk, 0, 6) . '******' . substr($noKk, -4);
    }

    private function formatDate(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        try {
            return \Illuminate\Support\Carbon::parse($value)->format('d-m-Y H:i');
        } catch (Throwable) {
            return (string) $value;
        }
    }
}