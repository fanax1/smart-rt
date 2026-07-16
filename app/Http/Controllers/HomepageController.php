<?php

namespace App\Http\Controllers;

use App\Models\EmergencyContact;
use App\Models\RtSetting;
use App\Models\Dokumen;
use App\Models\DokumenFile;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Kegiatan;

class HomepageController extends Controller
{
    public function index(Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        if ($request->user() && $request->user()->role === 'admin') {
            return redirect()->route('admin.dashboard');
        }

        return Inertia::render('Public/HomePage', [
            'site'             => $this->siteProfile(),
            'stats'            => $this->stats(),
            'announcements'    => $this->announcements(),
            'events'           => $this->events($request),
            'documents'        => $this->documents(),
            'gallery'          => $this->gallery(),
            'heroImages'       => $this->heroImages(),
            'committeePeriods' => $this->committeePeriods(),
            'complaints'       => $this->complaints(),
        ]);
    }

    /**
     * Download File Utama saja.
     */
    public function downloadMainFile(Dokumen $dokumen)
    {
        // 1. Memastikan dokumen berstatus published dan visibility publik
        if ($dokumen->status !== 'published' || $dokumen->visibility !== 'publik') {
            abort(404, 'Dokumen tidak tersedia.');
        }

        // 2. Mengambil File Utama milik dokumen
        $mainFile = DokumenFile::where('dokumen_id', $dokumen->id)
            ->where(function ($q) {
                $q->where('category', 'main')
                  ->orWhere('file_type', 'main_file');
            })
            ->first();

        if (! $mainFile) {
            abort(404, 'File Utama tidak tersedia.');
        }

        $path = $mainFile->stored_path ?: $mainFile->path;
        if (! $path) {
            abort(404, 'File Utama tidak tersedia.');
        }

        // 3. Memastikan file benar-benar tersedia di storage
        $disk = 'local';
        if (! Storage::disk('local')->exists($path) && Storage::disk('public')->exists($path)) {
            $disk = 'public';
        }

        if (! Storage::disk($disk)->exists($path)) {
            abort(404, 'File Utama tidak ditemukan di penyimpanan.');
        }

        // 4. Mengunduh file menggunakan nama aslinya
        return Storage::disk($disk)->download(
            $path,
            basename($mainFile->original_name ?: basename($path))
        );
    }

    /**
     * Download seluruh Foto Kegiatan sekaligus sebagai satu file ZIP.
     */
    public function downloadActivityPhotos(Dokumen $dokumen)
    {
        // 1. Validasi status & visibility dokumen
        if ($dokumen->status !== 'published' || $dokumen->visibility !== 'publik') {
            abort(404, 'Dokumen tidak tersedia.');
        }

        // 2. Cek ketersediaan ekstensi ZipArchive
        if (! class_exists(\ZipArchive::class)) {
            return back()->with(
                'error',
                'Fitur download ZIP belum tersedia karena ekstensi ZIP PHP belum aktif.'
            );
        }

        // 3. Ambil semua file foto kegiatan (dari category attachment dan gallery)
        $files = DokumenFile::where('dokumen_id', $dokumen->id)
            ->whereIn('category', ['attachment', 'gallery'])
            ->get()
            ->filter(function ($file) {
                // Pastikan file benar-benar gambar
                $mime = strtolower((string) $file->mime_type);
                $ext = strtolower((string) $file->extension);
                return str_starts_with($mime, 'image/') || in_array($ext, ['jpg', 'jpeg', 'png', 'webp']);
            });

        if ($files->isEmpty()) {
            return back()->with('error', 'Tidak ada foto kegiatan yang tersedia untuk diunduh.');
        }

        // Buat temporary directory jika belum ada
        $tempDir = storage_path('app/temp-downloads');
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $zipFileName = 'foto-kegiatan-' . Str::slug($dokumen->judul) . '.zip';
        $zipFilePath = $tempDir . '/' . Str::uuid() . '.zip';

        $zip = new \ZipArchive();

        if ($zip->open($zipFilePath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            Log::error('[HomepageController] Gagal membuat file ZIP', ['dokumen_id' => $dokumen->id]);
            return back()->with('error', 'Gagal membuat file ZIP. Silakan coba lagi.');
        }

        $addedCount = 0;
        $usedNames  = []; // Menghindari nama duplikat dalam folder ZIP yang sama

        foreach ($files as $file) {
            $path = $file->stored_path ?: $file->path;
            if (! $path) {
                Log::warning('[HomepageController] File path kosong', ['file_id' => $file->id]);
                continue;
            }

            $disk = null;
            if (Storage::disk('local')->exists($path)) {
                $disk = 'local';
            } elseif (Storage::disk('public')->exists($path)) {
                $disk = 'public';
            } else {
                Log::warning('[HomepageController] File tidak ditemukan di storage', [
                    'file_id' => $file->id,
                    'path'    => $path,
                ]);
                continue;
            }

            $physicalPath = Storage::disk($disk)->path($path);
            if (! file_exists($physicalPath)) {
                Log::warning('[HomepageController] File fisik tidak ada', ['path' => $physicalPath]);
                continue;
            }

            $originalName = $file->original_name ?: basename($path);

            // Bersihkan nama file dan folder jika ada relative path
            $parts = explode('/', str_replace('\\', '/', $originalName));
            $cleanParts = array_map(function ($part) {
                return trim(preg_replace('/[^\w\s\-\.]/u', '', $part));
            }, $parts);
            $cleanName = implode('/', array_filter($cleanParts));
            if (empty($cleanName)) {
                $cleanName = 'foto-' . $file->id;
            }

            // Dapatkan info nama file dan ekstensi untuk deteksi duplikat
            $info = pathinfo($cleanName);
            $dirPrefix = (isset($info['dirname']) && $info['dirname'] !== '.' && $info['dirname'] !== '') ? $info['dirname'] . '/' : '';
            $filenameOnly = $info['filename'] ?? 'file';
            $extension = isset($info['extension']) ? '.' . $info['extension'] : '';

            $targetName = 'Foto-Kegiatan/' . $dirPrefix . $filenameOnly . $extension;
            $counter = 2;
            while (in_array($targetName, $usedNames, true)) {
                $targetName = 'Foto-Kegiatan/' . $dirPrefix . $filenameOnly . '-' . $counter . $extension;
                $counter++;
            }
            $usedNames[] = $targetName;

            $zip->addFile($physicalPath, $targetName);
            $addedCount++;
        }

        $zip->close();

        if ($addedCount === 0) {
            @unlink($zipFilePath);
            return back()->with('error', 'Tidak ada foto kegiatan yang tersedia untuk diunduh.');
        }

        if (! file_exists($zipFilePath) || filesize($zipFilePath) === 0) {
            return back()->with('error', 'Gagal membuat file ZIP. File ZIP kosong atau tidak valid.');
        }

        return response()
            ->download(
                $zipFilePath,
                $zipFileName,
                ['Content-Type' => 'application/zip']
            )
            ->deleteFileAfterSend(true);
    }

    /**
     * Download File Utama dan seluruh Foto Kegiatan sekaligus.
     */
    public function downloadAll(Dokumen $dokumen)
    {
        // 1. Validasi status & visibility dokumen
        if ($dokumen->status !== 'published' || $dokumen->visibility !== 'publik') {
            abort(404, 'Dokumen tidak tersedia.');
        }

        // 2. Cek ketersediaan ekstensi ZipArchive
        if (! class_exists(\ZipArchive::class)) {
            return back()->with(
                'error',
                'Fitur download ZIP belum tersedia karena ekstensi ZIP PHP belum aktif.'
            );
        }

        // Ambil File Utama
        $mainFile = DokumenFile::where('dokumen_id', $dokumen->id)
            ->where(function ($q) {
                $q->where('category', 'main')
                  ->orWhere('file_type', 'main_file');
            })
            ->first();

        // Ambil Foto Kegiatan
        $photos = DokumenFile::where('dokumen_id', $dokumen->id)
            ->whereIn('category', ['attachment', 'gallery'])
            ->get()
            ->filter(function ($file) {
                $mime = strtolower((string) $file->mime_type);
                $ext = strtolower((string) $file->extension);
                return str_starts_with($mime, 'image/') || in_array($ext, ['jpg', 'jpeg', 'png', 'webp']);
            });

        // 3. Pastikan minimal ada File Utama atau Foto Kegiatan
        if (! $mainFile && $photos->isEmpty()) {
            return back()->with('error', 'Tidak ada file yang tersedia untuk diunduh.');
        }

        // Buat temporary directory jika belum ada
        $tempDir = storage_path('app/temp-downloads');
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $zipFileName = Str::slug($dokumen->judul) . '-semua-file.zip';
        $zipFilePath = $tempDir . '/' . Str::uuid() . '.zip';

        $zip = new \ZipArchive();

        if ($zip->open($zipFilePath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            Log::error('[HomepageController] Gagal membuat file ZIP', ['dokumen_id' => $dokumen->id]);
            return back()->with('error', 'Gagal membuat file ZIP. Silakan coba lagi.');
        }

        $addedCount = 0;
        $usedNames  = []; // Menghindari nama duplikat dalam ZIP

        // Masukkan File Utama ke ZIP jika ada
        if ($mainFile) {
            $path = $mainFile->stored_path ?: $mainFile->path;
            if ($path) {
                $disk = null;
                if (Storage::disk('local')->exists($path)) {
                    $disk = 'local';
                } elseif (Storage::disk('public')->exists($path)) {
                    $disk = 'public';
                }

                if ($disk) {
                    $physicalPath = Storage::disk($disk)->path($path);
                    if (file_exists($physicalPath)) {
                        $originalName = $mainFile->original_name ?: basename($path);
                        $cleanName = trim(preg_replace('/[^\w\s\-\.]/u', '', basename($originalName)));
                        if (empty($cleanName)) {
                            $cleanName = 'main-file-' . $mainFile->id;
                        }

                        $targetName = 'File-Utama/' . $cleanName;
                        $zip->addFile($physicalPath, $targetName);
                        $addedCount++;
                    }
                }
            }
        }

        // Masukkan Foto Kegiatan ke ZIP jika ada
        foreach ($photos as $file) {
            $path = $file->stored_path ?: $file->path;
            if (! $path) {
                continue;
            }

            $disk = null;
            if (Storage::disk('local')->exists($path)) {
                $disk = 'local';
            } elseif (Storage::disk('public')->exists($path)) {
                $disk = 'public';
            }

            if ($disk) {
                $physicalPath = Storage::disk($disk)->path($path);
                if (file_exists($physicalPath)) {
                    $originalName = $file->original_name ?: basename($path);

                    $parts = explode('/', str_replace('\\', '/', $originalName));
                    $cleanParts = array_map(function ($part) {
                        return trim(preg_replace('/[^\w\s\-\.]/u', '', $part));
                    }, $parts);
                    $cleanName = implode('/', array_filter($cleanParts));
                    if (empty($cleanName)) {
                        $cleanName = 'foto-' . $file->id;
                    }

                    $info = pathinfo($cleanName);
                    $dirPrefix = (isset($info['dirname']) && $info['dirname'] !== '.' && $info['dirname'] !== '') ? $info['dirname'] . '/' : '';
                    $filenameOnly = $info['filename'] ?? 'file';
                    $extension = isset($info['extension']) ? '.' . $info['extension'] : '';

                    $targetName = 'Foto-Kegiatan/' . $dirPrefix . $filenameOnly . $extension;
                    $counter = 2;
                    while (in_array($targetName, $usedNames, true)) {
                        $targetName = 'Foto-Kegiatan/' . $dirPrefix . $filenameOnly . '-' . $counter . $extension;
                        $counter++;
                    }
                    $usedNames[] = $targetName;

                    $zip->addFile($physicalPath, $targetName);
                    $addedCount++;
                }
            }
        }

        $zip->close();

        if ($addedCount === 0) {
            @unlink($zipFilePath);
            return back()->with('error', 'Tidak ada file yang tersedia untuk diunduh.');
        }

        if (! file_exists($zipFilePath) || filesize($zipFilePath) === 0) {
            return back()->with('error', 'Gagal membuat file ZIP. File ZIP kosong atau tidak valid.');
        }

        return response()
            ->download(
                $zipFilePath,
                $zipFileName,
                ['Content-Type' => 'application/zip']
            )
            ->deleteFileAfterSend(true);
    }

    private function siteProfile(): array
    {
        // Load settings from rt_settings table when available
        $settings = [];
        if (Schema::hasTable('rt_settings')) {
            $settings = RtSetting::pluck('value', 'key')->toArray();
        }

        // Load active emergency contacts
        $emergencyContacts = [];
        if (Schema::hasTable('emergency_contacts')) {
            $emergencyContacts = EmergencyContact::active()
                ->ordered()
                ->get()
                ->map(fn ($c) => [
                    'label' => $c->name . ($c->role ? ' (' . $c->role . ')' : ''),
                    'phone' => $c->phone,
                ])
                ->values()
                ->toArray();
        }

        // Fall back to hardcoded defaults if no custom contacts
        if (empty($emergencyContacts)) {
            $emergencyContacts = [
                ['label' => 'Darurat', 'phone' => '112'],
                ['label' => 'Pemadam', 'phone' => '113'],
                ['label' => 'Ambulans', 'phone' => '118'],
            ];
        }

        $siteName   = $settings['site_name']   ?? config('app.name', 'SMART-RT');
        $rtName     = $settings['rt_name']      ?? config('app.rt_name', 'RT');
        $rtNumber   = $settings['rt_number']    ?? null;
        $kelurahan  = $settings['kelurahan']    ?? null;
        $kota       = $settings['kota']         ?? null;
        $logoPath   = $settings['logo_path']    ?? null;

        // Build a display name for the RT
        $rtDisplayName = collect(array_filter([
            $rtName ? 'RT ' . $rtNumber : null,
            $kelurahan,
            $kota,
        ]))->implode(', ');
        if (empty(trim($rtDisplayName))) {
            $rtDisplayName = config('app.rt_name', 'RT 004');
        }

        // Build address from individual fields
        $addressParts = array_filter([
            $settings['alamat_kantor'] ?? config('app.rt_address', null),
            $settings['kecamatan'] ?? null,
            $kota,
            $settings['provinsi'] ?? null,
        ]);
        $address = implode(', ', $addressParts) ?: null;

        return [
            'rtName'            => $rtDisplayName,
            'title'             => $siteName,
            'tagline'           => $settings['tagline'] ?? null,
            'subtitle'          => $settings['deskripsi'] ?? 'Portal resmi informasi warga, pengumuman, kegiatan, dokumen publik, dan layanan administrasi RT.',
            'address'           => $address,
            'email'             => $settings['email_rt'] ?? $settings['email_publik'] ?? config('mail.from.address'),
            'phone'             => $settings['telepon_rt'] ?? config('app.rt_phone', null),
            'logoUrl'           => $logoPath ? Storage::url($logoPath) : null,
            'accentColor'       => $settings['warna_aksen'] ?? '#10B981',
            'footerText'        => $settings['footer_text'] ?? null,
            'copyright'         => $settings['copyright'] ?? null,
            'waLink'            => $settings['wa_link'] ?? null,
            'instagram'         => $settings['instagram'] ?? null,
            'facebook'          => $settings['facebook'] ?? null,
            'youtube'           => $settings['youtube'] ?? null,
            'gmapsUrl'          => $settings['gmaps_url'] ?? null,
            'gmapsEmbedUrl'     => $settings['gmaps_embed_url'] ?? null,
            'emergencyContacts' => $emergencyContacts,
        ];
    }

    private function announcements(): array
    {
        if (! Schema::hasTable('pengumumans')) {
            return [];
        }

        $query = DB::table('pengumumans')
            ->where('status', 'published')
            ->where('target_audiens', 'semua')
            ->where(function ($builder) {
                $builder->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            })
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit(8);

        $items = $query->get();

        $filesByAnnouncement = $this->groupFiles('pengumuman_files', 'pengumuman_id', $items->pluck('id'));

        return $items->map(function ($item) use ($filesByAnnouncement) {
            $files = $filesByAnnouncement->get($item->id, collect());
            $firstImage = $files->first(fn ($file) => str_starts_with((string) $file->mime_type, 'image/'));

            return [
                'id' => (int) $item->id,
                'title' => $item->judul,
                'excerpt' => $this->excerpt((string) $item->isi),
                'content' => $item->isi,
                'category' => $item->kategori,
                'publishedAt' => $this->dateString($item->published_at ?? $item->created_at),
                'isPinned' => in_array($item->kategori, ['penting', 'umum'], true),
                'imageUrl' => $firstImage ? Storage::url($firstImage->path) : null,
                'files' => $files->map(fn ($file) => [
                    'id' => (int) $file->id,
                    'originalName' => $file->original_name,
                    'url' => Storage::url($file->path),
                    'mimeType' => $file->mime_type,
                    'size' => (int) ($file->size ?? 0),
                ])->values(),
            ];
        })->values()->all();
    }

    private function events(Request $request): array
{
    if (! Schema::hasTable('kegiatans')) {
        return [];
    }

    $dateColumn = $this->firstExistingColumn('kegiatans', ['tanggal', 'tanggal_mulai', 'start_date', 'date']);
    $titleColumn = $this->firstExistingColumn('kegiatans', ['judul', 'nama_kegiatan', 'nama', 'title']);
    $statusColumn = $this->firstExistingColumn('kegiatans', ['status_kegiatan', 'status']);
    $startTimeColumn = $this->firstExistingColumn('kegiatans', ['jam_mulai', 'waktu_mulai', 'start_time', 'jam']);
    $endTimeColumn = $this->firstExistingColumn('kegiatans', ['jam_selesai', 'waktu_selesai', 'end_time']);

    if (! $titleColumn) {
        return [];
    }

    $query = DB::table('kegiatans');

    if ($statusColumn) {
        $query->whereNotIn($statusColumn, [
            'Dibatalkan',
            'dibatalkan',
            'Batal',
            'batal',
            'cancelled',
        ]);
    }

    if ($dateColumn) {
        $query
            ->orderByRaw("CASE WHEN {$dateColumn} >= ? THEN 0 ELSE 1 END", [now()->toDateString()])
            ->orderBy($dateColumn);
    } else {
        $query->orderByDesc('id');
    }

    $kegiatans = $query
        ->limit(6)
        ->get();

    $kegiatanIds = $kegiatans->pluck('id')->values();

    $user = $request->user();
    $wargaId = $user?->warga_id;

    $participantsByKegiatan = collect();

    if (
        $kegiatanIds->isNotEmpty()
        && Schema::hasTable('kegiatan_partisipasis')
        && Schema::hasTable('wargas')
    ) {
        $participantQuery = DB::table('kegiatan_partisipasis as kp')
            ->leftJoin('wargas as w', 'w.id', '=', 'kp.warga_id')
            ->whereIn('kp.kegiatan_id', $kegiatanIds);

        if ($this->columnExists('kegiatan_partisipasis', 'status')) {
            $participantQuery->where(function ($builder) {
                $builder
                    ->whereNull('kp.status')
                    ->orWhereNotIn('kp.status', [
                        'batal',
                        'Batal',
                        'dibatalkan',
                        'Dibatalkan',
                        'cancelled',
                    ]);
            });
        }

        $participantsByKegiatan = $participantQuery
            ->select([
                'kp.id',
                'kp.kegiatan_id',
                'kp.warga_id',
                'kp.user_id',
                'kp.created_at',
                'w.nama_lengkap',
            ])
            ->orderBy('kp.created_at')
            ->get()
            ->groupBy('kegiatan_id');
    }

    return $kegiatans
        ->map(function ($item) use (
            $dateColumn,
            $titleColumn,
            $statusColumn,
            $startTimeColumn,
            $endTimeColumn,
            $participantsByKegiatan,
            $wargaId
        ) {
            $startTime = $startTimeColumn ? ($item->{$startTimeColumn} ?? null) : null;
            $endTime = $endTimeColumn ? ($item->{$endTimeColumn} ?? null) : null;

            if ($startTime && $endTime) {
                $time = "{$startTime} - {$endTime}";
            } elseif ($startTime) {
                $time = $startTime;
            } else {
                $time = $this->valueFromRow($item, ['waktu', 'jam']) ?: null;
            }

            $participants = $participantsByKegiatan
                ->get($item->id, collect())
                ->map(fn ($participant) => [
                    'id' => (int) $participant->id,
                    'warga_id' => $participant->warga_id ? (int) $participant->warga_id : null,
                    'user_id' => $participant->user_id ? (int) $participant->user_id : null,
                    'name' => $participant->nama_lengkap ?: 'Warga',
                    'joinedAt' => $participant->created_at,
                ])
                ->values();

            return [
                'id' => (int) $item->id,
                'title' => $item->{$titleColumn},
                'date' => $dateColumn ? $this->dateString($item->{$dateColumn}) : null,
                'time' => $time,
                'location' => $this->valueFromRow($item, ['lokasi', 'tempat', 'location']) ?: 'Lokasi menyusul',
                'type' => $this->valueFromRow($item, ['kategori', 'jenis', 'type']) ?: 'Kegiatan',
                'description' => $this->valueFromRow($item, ['deskripsi', 'keterangan', 'description']) ?: null,
                'status' => $statusColumn ? ($item->{$statusColumn} ?? null) : null,

                'participantsCount' => $participants->count(),
                'participants' => $participants,
                'isJoined' => $wargaId
                    ? $participants->contains(fn ($participant) => (int) $participant['warga_id'] === (int) $wargaId)
                    : false,
                'canJoin' => (bool) $wargaId,
            ];
        })
        ->values()
        ->all();
}

    private function documents(): array
    {
        if (! Schema::hasTable('dokumens')) {
            return [];
        }

        $query = DB::table('dokumens')
            ->where('status', 'published')
            ->orderByDesc($this->columnExists('dokumens', 'published_at') ? 'published_at' : 'id')
            ->limit(8);

        if ($this->columnExists('dokumens', 'visibility')) {
            $query->where('visibility', 'publik');
        }

        $items           = $query->get();
        $filesByDocument = $this->groupFiles('dokumen_files', 'dokumen_id', $items->pluck('id'));

        $downloadableCount = DB::table('dokumen_files')
            ->whereIn('dokumen_id', $items->pluck('id'))
            ->where('is_downloadable', true)
            ->count();

        return $items->map(function ($item) use ($filesByDocument) {
            $files = $filesByDocument->get($item->id, collect());

            $downloadableFiles = $files->filter(fn ($f) => (bool) ($f->is_downloadable ?? true));
            $hasDownloadable   = $downloadableFiles->isNotEmpty();

            return [
                'id'              => (int) $item->id,
                'title'           => $item->judul,
                'slug'            => $item->slug ?? null,
                'description'     => $item->deskripsi ?? null,
                'category'        => $item->kategori ?? 'Dokumen',
                'type'            => $item->tipe ?? 'manual_upload',
                'publishedAt'     => $this->dateString($item->published_at ?? $item->created_at ?? null),
                'hasDownloadable' => $hasDownloadable,
                'fileCount'       => $downloadableFiles->count(),
                'downloadAllUrl'  => route('documents.download-all', ['dokumen' => $item->id]),
                'files'           => $files->map(fn ($file) => $this->mapFileForHomepage($file, (int) $item->id))->values()->all(),
            ];
        })->values()->all();
    }

    private function gallery(): array
    {
        if (! Schema::hasTable('dokumens') || ! Schema::hasTable('dokumen_files')) {
            return [];
        }

        if (! $this->columnExists('dokumens', 'tipe') && ! $this->columnExists('dokumens', 'kategori')) {
            return [];
        }

        $documentQuery = DB::table('dokumens')->where('status', 'published');

        if ($this->columnExists('dokumens', 'visibility')) {
            $documentQuery->where('visibility', 'publik');
        }

        $documentQuery->where(function ($builder) {
            if ($this->columnExists('dokumens', 'tipe')) {
                $builder->orWhere('tipe', 'event_documentation');
            }

            if ($this->columnExists('dokumens', 'kategori')) {
                $builder->orWhere('kategori', 'like', '%Dokumentasi%');
            }
        });

        $orderColumn = $this->columnExists('dokumens', 'published_at') ? 'published_at' : 'id';

        $documents = $documentQuery
            ->orderByDesc($orderColumn)
            ->orderByDesc('id')
            ->limit(24)
            ->get();

        if ($documents->isEmpty()) {
            return [];
        }

        $documentIds = $documents->pluck('id')->values();

        // Query files specifically of type 'gallery_image'
        $filesByDocument = DB::table('dokumen_files')
            ->whereIn('dokumen_id', $documentIds)
            ->where('file_type', 'gallery_image')
            ->get()
            ->groupBy('dokumen_id');

        // Fallback: If no files of type gallery_image exist, fetch all associated files
        if ($filesByDocument->isEmpty()) {
            $filesByDocument = DB::table('dokumen_files')
                ->whereIn('dokumen_id', $documentIds)
                ->get()
                ->groupBy('dokumen_id');
        }

        return $documents
            ->flatMap(function ($document) use ($filesByDocument) {
                return $filesByDocument
                    ->get($document->id, collect())
                    ->filter(fn ($file) => str_starts_with((string) $file->mime_type, 'image/'))
                    ->map(fn ($file) => [
                        'id' => (int) $file->id,
                        'title' => $document->judul,
                        'imageUrl' => $this->resolveImageUrl($file, (int) $document->id),
                        'publishedAt' => $this->dateString($document->published_at ?? $document->created_at ?? null),
                        'description' => $this->valueFromRow($document, ['deskripsi', 'description', 'keterangan']) ?: null,
                        'category' => $this->valueFromRow($document, ['kategori', 'category']) ?: 'Dokumentasi',
                        'fileName' => $file->original_name ?? null,
                        'fileSize' => (int) ($file->size ?? 0),
                    ]);
            })
            ->take(30)
            ->values()
            ->all();
    }

    private function heroImages(): array
    {
        if (! Schema::hasTable('dokumens') || ! Schema::hasTable('dokumen_files')) {
            return [];
        }

        $documentQuery = DB::table('dokumens')->where('status', 'published');

        if ($this->columnExists('dokumens', 'visibility')) {
            $documentQuery->where('visibility', 'publik');
        }

        $orderColumn = $this->columnExists('dokumens', 'published_at') ? 'published_at' : 'id';

        $documents = $documentQuery
            ->orderByDesc($orderColumn)
            ->orderByDesc('id')
            ->limit(24)
            ->get();

        if ($documents->isEmpty()) {
            return [];
        }

        $documentIds = $documents->pluck('id')->values();

        // Query files specifically of type 'cover_image' (for homepage header)
        $filesByDocument = DB::table('dokumen_files')
            ->whereIn('dokumen_id', $documentIds)
            ->where('file_type', 'cover_image')
            ->get()
            ->groupBy('dokumen_id');

        return $documents
            ->flatMap(function ($document) use ($filesByDocument) {
                return $filesByDocument
                    ->get($document->id, collect())
                    ->filter(fn ($file) => str_starts_with((string) $file->mime_type, 'image/'))
                    ->map(fn ($file) => [
                        'id' => (int) $file->id,
                        'title' => $document->judul,
                        'imageUrl' => $this->resolveImageUrl($file, (int) $document->id),
                        'publishedAt' => $this->dateString($document->published_at ?? $document->created_at ?? null),
                        'description' => $this->valueFromRow($document, ['deskripsi', 'description', 'keterangan']) ?: null,
                        'category' => $this->valueFromRow($document, ['kategori', 'category']) ?: 'Dokumentasi',
                        'fileName' => $file->original_name ?? null,
                        'fileSize' => (int) ($file->size ?? 0),
                    ]);
            })
            ->values()
            ->all();
    }

    private function committeePeriods(): array
{
    if (
        Schema::hasTable('committee_periods')
        && Schema::hasTable('committee_members')
        && $this->columnExists('committee_periods', 'name')
        && $this->columnExists('committee_members', 'name')
        && $this->columnExists('committee_members', 'position')
    ) {
        $periodsQuery = DB::table('committee_periods')
            ->where(function ($query) {
                $query->where('is_active', true)
                    ->orWhere('status', 'completed');
            })
            ->orderByDesc('is_active')
            ->orderByDesc('start_year')
            ->orderByDesc('id');

        $periods = $periodsQuery->get();

        if ($periods->isNotEmpty()) {
            $periodIds = $periods->pluck('id');

            $membersQuery = DB::table('committee_members')
                ->whereIn('committee_period_id', $periodIds);

            if ($this->columnExists('committee_members', 'is_active')) {
                $membersQuery->where('is_active', true);
            }

            if ($this->columnExists('committee_members', 'sort_order')) {
                $membersQuery->orderBy('sort_order');
            }

            $members = $membersQuery
                ->orderBy('id')
                ->get()
                ->groupBy('committee_period_id');

            return $periods->map(function ($period) use ($members) {
                $isActive = (bool) ($period->is_active ?? false) || ($period->status ?? null) === 'active';

                if ($period->start_year && $period->end_year) {
                    $periodYear = "{$period->start_year} - {$period->end_year}";
                } elseif ($period->start_year) {
                    $periodYear = "{$period->start_year} - Sekarang";
                } else {
                    $periodYear = $period->name;
                }

                return [
                    'id' => 'committee-period-' . $period->id,
                    'tahun' => $periodYear,
                    'label' => $isActive ? 'Periode Aktif' : 'Periode Selesai',
                    'status' => $isActive ? 'aktif' : 'selesai',
                    'anggota' => $members
                        ->get($period->id, collect())
                        ->map(fn ($member) => [
                            'id' => (int) $member->id,
                            'nama' => $member->name,
                            'jabatan' => $member->position,
                            'jabatanSingkat' => $member->position,
                            'phone' => $member->phone ?? null,
                            'email' => $member->email ?? null,
                            'avatar' => $this->initials($member->name),
                            'foto' => ! empty($member->photo_path) ? Storage::url($member->photo_path) : null,
                            'deskripsi' => $member->description ?? null,
                            'isKetua' => str_contains(strtolower($member->position), 'ketua'),
                        ])
                        ->values(),
                ];
            })->values()->all();
        }
    }

    if (! Schema::hasTable('rt_pengurus') || ! $this->columnExists('rt_pengurus', 'nama') || ! $this->columnExists('rt_pengurus', 'jabatan')) {
        return [];
    }

    $itemsQuery = DB::table('rt_pengurus');

    if ($this->columnExists('rt_pengurus', 'is_published')) {
        $itemsQuery->where('is_published', true);
    }

    if ($this->columnExists('rt_pengurus', 'periode_mulai')) {
        $itemsQuery->orderByDesc('periode_mulai');
    }

    if ($this->columnExists('rt_pengurus', 'urutan')) {
        $itemsQuery->orderBy('urutan');
    }

    $items = $itemsQuery->get();

    return $items->groupBy(fn ($item) => ($item->periode_mulai ?? '-') . ' - ' . ($item->periode_selesai ?? 'Sekarang'))
        ->map(function ($members, $periodLabel) {
            return [
                'id' => str($periodLabel)->slug()->toString(),
                'tahun' => $periodLabel,
                'label' => str_contains($periodLabel, 'Sekarang') ? 'Periode Aktif' : 'Periode Selesai',
                'status' => str_contains($periodLabel, 'Sekarang') ? 'aktif' : 'selesai',
                'anggota' => $members->map(fn ($member) => [
                    'id' => (int) $member->id,
                    'nama' => $member->nama,
                    'jabatan' => $member->jabatan,
                    'jabatanSingkat' => $member->jabatan_singkat ?? $member->jabatan,
                    'phone' => $member->phone ?? null,
                    'email' => $member->email ?? null,
                    'avatar' => $this->initials($member->nama),
                    'foto' => $member->foto_path ? Storage::url($member->foto_path) : null,
                    'deskripsi' => $member->deskripsi ?? null,
                    'isKetua' => str_contains(strtolower($member->jabatan), 'ketua'),
                ])->values(),
            ];
        })->values()->all();
}
    private function stats(): array
    {
        $totalWarga = Schema::hasTable('wargas') ? DB::table('wargas')->count() : 0;
        $totalKk = Schema::hasTable('kartu_keluargas') ? DB::table('kartu_keluargas')->count() : 0;
        $totalEvents = 0;

        if (Schema::hasTable('kegiatans')) {
            $dateColumn = $this->firstExistingColumn('kegiatans', ['tanggal', 'tanggal_mulai', 'start_date', 'date']);
            $eventQuery = DB::table('kegiatans');

            if ($dateColumn) {
                $eventQuery->whereYear($dateColumn, now()->year);
            }

            $totalEvents = $eventQuery->count();
        }

        $iuranRate = $this->iuranRate($totalKk);

        return [
            ['label' => 'Total Warga', 'value' => (string) $totalWarga, 'unit' => 'jiwa'],
            ['label' => 'Kepala Keluarga', 'value' => (string) $totalKk, 'unit' => 'KK'],
            ['label' => 'Kegiatan Tahun Ini', 'value' => (string) $totalEvents, 'unit' => 'agenda'],
            ['label' => 'Tingkat Iuran', 'value' => (string) $iuranRate, 'unit' => '%'],
        ];
    }

    private function iuranRate(int $totalKk): int
    {
        if ($totalKk <= 0 || ! Schema::hasTable('iuran_pembayarans')) {
            return 0;
        }

        $period = now()->startOfMonth()->toDateString();

        $paid = DB::table('iuran_pembayarans')
            ->whereDate('periode', $period)
            ->where('status_verifikasi', 'verified')
            ->distinct('kartu_keluarga_id')
            ->count('kartu_keluarga_id');

        return (int) round(($paid / $totalKk) * 100);
    }

    private function complaints(): array
    {
        if (! Schema::hasTable('pengaduans')) {
            return [];
        }

        $hasPrivate = $this->columnExists('pengaduans', 'is_private');
        $hasArchived = $this->columnExists('pengaduans', 'is_archived');

        $query = DB::table('pengaduans as p')
            ->join('wargas as w', 'w.id', '=', 'p.warga_id')
            ->leftJoin('hunians as h', 'h.id', '=', 'p.hunian_id')
            ->leftJoin('users as u', 'u.warga_id', '=', 'w.id') // LEFT JOIN: warga may not have a user account
            ->select([
                'p.id',
                'p.judul',
                'p.kategori',
                'p.prioritas',
                'p.status',
                'p.deskripsi',
                'p.tanggal_pengaduan',
                'p.lokasi',
                'w.nama_lengkap',
                'h.no_rumah',
                'u.profile_photo_path',
            ])
            ->where('p.is_private', false)
            ->where('p.is_confirmed', true)
            ->where('p.is_archived', false)
            ->whereIn('p.status', ['diajukan', 'diproses', 'selesai']) // include 'diajukan' for newly confirmed ones
            ->orderByDesc('p.tanggal_pengaduan')
            ->limit(6);

        $items = $query->get();

        // Count tanggapans per complaint
        $commentCounts = collect();
        if ($items->isNotEmpty() && Schema::hasTable('pengaduan_tanggapans')) {
            $commentCounts = DB::table('pengaduan_tanggapans')
                ->whereIn('pengaduan_id', $items->pluck('id'))
                ->select('pengaduan_id', DB::raw('count(*) as total'))
                ->groupBy('pengaduan_id')
                ->get()
                ->pluck('total', 'pengaduan_id');
        }

        return $items->map(function ($item) use ($commentCounts) {
            $namaLengkap = $item->nama_lengkap ?? 'Warga RT';
            $initials = collect(explode(' ', $namaLengkap))->filter()->take(2)->map(fn ($p) => mb_substr($p, 0, 1))->implode('');

            return [
                'id'              => (int) $item->id,
                'judul'           => $item->judul,
                'kategori'        => $item->kategori,
                'prioritas'       => $item->prioritas,
                'status'          => $item->status,
                'lokasi'          => $item->lokasi ?? null,
                'excerpt'         => $this->excerpt((string) $item->deskripsi, 120),
                'tanggal'         => $this->dateString($item->tanggal_pengaduan),
                'authorName'      => 'Warga ' . explode(' ', $namaLengkap)[0],
                'authorInitials'  => strtoupper($initials) ?: 'WG',
                'authorAvatar'    => $item->profile_photo_path
                    ? asset('storage/' . ltrim($item->profile_photo_path, '/'))
                    : 'https://ui-avatars.com/api/?name=' . urlencode($namaLengkap) . '&background=10B981&color=fff&bold=true',
                'houseNumber'     => $item->no_rumah ?? null,
                'commentCount'    => (int) ($commentCounts->get($item->id) ?? 0),
            ];
        })->values()->all();
    }

    private function groupFiles(string $table, string $foreignKey, Collection $ids): Collection
    {
        if ($ids->isEmpty() || ! Schema::hasTable($table)) {
            return collect();
        }

        return DB::table($table)
            ->whereIn($foreignKey, $ids->values())
            ->get()
            ->groupBy($foreignKey);
    }

    private function firstExistingColumn(string $table, array $columns): ?string
    {
        foreach ($columns as $column) {
            if ($this->columnExists($table, $column)) {
                return $column;
            }
        }

        return null;
    }

    private function columnExists(string $table, string $column): bool
    {
        return Schema::hasTable($table) && Schema::hasColumn($table, $column);
    }

    private function valueFromRow(object $row, array $columns): mixed
    {
        foreach ($columns as $column) {
            if (property_exists($row, $column) && $row->{$column}) {
                return $row->{$column};
            }
        }

        return null;
    }

    private function dateString(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        return Carbon::parse($value)
            ->locale('id')
            ->translatedFormat('d F Y');
    }

    private function excerpt(string $value, int $limit = 160): string
    {
        $plain = trim(strip_tags($value));

        return str($plain)->limit($limit)->toString();
    }

    private function initials(?string $name): string
    {
        $name = trim((string) $name);

        if ($name === '') {
            return 'RT';
        }

        return collect(explode(' ', $name))
            ->filter()
            ->take(2)
            ->map(fn ($part) => mb_substr($part, 0, 1))
            ->implode('');
    }

    /**
     * Preview file satuan dari homepage.
     * Hanya dokumen published + publik yang bisa di-preview.
     */
    public function previewFile(Dokumen $dokumen, DokumenFile $file)
    {
        // Validasi dokumen
        if ($dokumen->status !== 'published' || $dokumen->visibility !== 'publik') {
            abort(404, 'Dokumen tidak tersedia.');
        }

        // Verifikasi file milik dokumen ini
        if ($file->dokumen_id !== $dokumen->id) {
            abort(404, 'File tidak ditemukan.');
        }

        $path = $file->stored_path ?: $file->path;

        if (! $path) {
            abort(404, 'File tidak ditemukan.');
        }

        // Coba disk local
        if (Storage::disk('local')->exists($path)) {
            return response()->file(Storage::disk('local')->path($path), [
                'Content-Type'           => $file->mime_type ?: 'application/octet-stream',
                'Content-Disposition'    => 'inline; filename="' . addslashes($file->original_name ?: 'file') . '"',
                'X-Content-Type-Options' => 'nosniff',
            ]);
        }

        // Fallback disk public
        if (Storage::disk('public')->exists($path)) {
            return response()->file(Storage::disk('public')->path($path), [
                'Content-Type'           => $file->mime_type ?: 'application/octet-stream',
                'Content-Disposition'    => 'inline; filename="' . addslashes($file->original_name ?: 'file') . '"',
                'X-Content-Type-Options' => 'nosniff',
            ]);
        }

        abort(404, 'File tidak ditemukan di penyimpanan.');
    }

    /**
     * Helper to map file database object to frontend format.
     */
    private function mapFileForHomepage(object $file, int $dokumenId): array
    {
        $path = $file->stored_path ?: $file->path;
        $existsLocal = $path && Storage::disk('local')->exists($path);
        $existsPublic = $path && Storage::disk('public')->exists($path);
        $exists = $existsLocal || $existsPublic;

        $category = $file->category ?: $file->file_type ?: 'main';
        $normalizedCategory = match ($category) {
            'main_file', 'main' => 'main',
            'cover_image', 'cover' => 'cover',
            'gallery_image', 'gallery' => 'gallery',
            default => 'attachment',
        };

        $downloadUrl = null;
        $previewUrl = $path ? route('documents.files.preview', ['dokumen' => $dokumenId, 'file' => $file->id]) : null;

        $mimeType = $file->mime_type ?? '';
        $isImage = str_starts_with((string) $mimeType, 'image/');
        $isPdf = $mimeType === 'application/pdf';

        return [
            'id' => (int) $file->id,
            'originalName' => $file->original_name,
            'mimeType' => $mimeType,
            'size' => (int) ($file->size ?? 0),
            'category' => $normalizedCategory,
            'fileType' => $file->file_type ?? $category,
            'downloadUrl' => $downloadUrl,
            'previewUrl' => $previewUrl,
            'url' => ($existsPublic && !$existsLocal) ? asset('storage/' . ltrim($path, '/')) : $previewUrl,
            'exists' => $exists,
            'isImage' => $isImage,
            'isPdf' => $isPdf,
        ];
    }

    /**
     * Resolves the web URL for document files, supporting both local and public disks, and handles fallback.
     */
    private function resolveImageUrl(object $file, int $dokumenId): string
    {
        $rawPath = $file->stored_path ?? $file->path ?? '';
        if (!$rawPath) {
            return asset('images/default-cover.jpg');
        }

        $rawPath = str_replace('\\', '/', trim($rawPath));

        if (str_contains($rawPath, '../')) {
            return asset('images/default-cover.jpg');
        }

        if (filter_var($rawPath, FILTER_VALIDATE_URL)) {
            $parsedPath = parse_url($rawPath, PHP_URL_PATH);
            if (is_string($parsedPath)) {
                $rawPath = ltrim($parsedPath, '/');
            }
        }

        $rawPath = ltrim($rawPath, '/');

        $candidates = [
            $rawPath,
            preg_replace('#^storage/#i', '', $rawPath),
            preg_replace('#^public/#i', '', $rawPath),
            preg_replace('#^public/storage/#i', '', $rawPath),
        ];

        $candidates = array_values(array_unique(array_filter($candidates)));

        foreach ($candidates as $candidate) {
            if (Storage::disk('public')->exists($candidate)) {
                return asset('storage/' . ltrim($candidate, '/'));
            }
        }

        foreach ($candidates as $candidate) {
            if (Storage::disk('local')->exists($candidate)) {
                return route('documents.files.preview', ['dokumen' => $dokumenId, 'file' => $file->id]);
            }
        }

        foreach ($candidates as $candidate) {
            if (is_file(public_path($candidate))) {
                return asset($candidate);
            }
            if (is_file(public_path('storage/' . $candidate))) {
                return asset('storage/' . $candidate);
            }
        }

        return asset('images/default-cover.jpg');
    }
}
