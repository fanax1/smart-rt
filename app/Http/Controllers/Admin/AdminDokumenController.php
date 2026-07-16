<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dokumen;
use App\Models\DokumenFile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminDokumenController extends Controller
{
    private const DISK = 'local';

    private array $categoryOptions = [
        'Jadwal',
        'Laporan Keuangan',
        'Laporan Kegiatan',
        'Dokumentasi Kegiatan',
        'Notulen Rapat',
        'Formulir',
        'Peraturan RT',
        'Struktur Pengurus',
        'Lainnya',
    ];

    private array $typeOptions = [
        'manual_upload'       => 'Manual Upload',
        'schedule'            => 'Jadwal',
        'generated_report'    => 'Generated Report',
        'event_documentation' => 'Dokumentasi Kegiatan',
        'form_template'       => 'Template Formulir',
    ];

    private array $visibilityOptions = [
        'publik' => 'Publik',
        'admin'  => 'Admin',
    ];

    private array $statusOptions = [
        'draft'     => 'Draft',
        'published' => 'Published',
        'archived'  => 'Archived',
    ];

    // ================================================================
    // INDEX
    // ================================================================

    public function index(Request $request): Response
    {
        $filters = [
            'search'     => (string) $request->query('search', ''),
            'kategori'   => (string) $request->query('kategori', 'all'),
            'tipe'       => (string) $request->query('tipe', 'all'),
            'visibility' => (string) $request->query('visibility', 'all'),
            'status'     => (string) $request->query('status', 'all'),
            'tab'        => (string) $request->query('tab', 'semua'),
        ];

        $query = Dokumen::query()
            ->with(['files', 'creator'])
            ->latest('published_at')
            ->latest('id');

        if ($filters['search'] !== '') {
            $query->where(function ($inner) use ($filters) {
                $inner->where('judul', 'like', '%' . $filters['search'] . '%')
                    ->orWhere('deskripsi', 'like', '%' . $filters['search'] . '%');
            });
        }

        if ($filters['kategori'] !== 'all') {
            $query->where('kategori', $filters['kategori']);
        }

        if ($filters['tipe'] !== 'all') {
            $query->where('tipe', $filters['tipe']);
        }

        if ($filters['visibility'] !== 'all') {
            $query->where('visibility', $filters['visibility']);
        }

        if ($filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        match ($filters['tab']) {
            'publik'       => $query->where('visibility', 'publik')->where('status', 'published'),
            'jadwal'       => $query->where('kategori', 'Jadwal'),
            'laporan'      => $query->whereIn('kategori', ['Laporan Keuangan', 'Laporan Kegiatan']),
            'dokumentasi'  => $query->where(function ($inner) {
                $inner->where('tipe', 'event_documentation')
                    ->orWhere('kategori', 'Dokumentasi Kegiatan');
            }),
            'arsip'        => $query->where('status', 'archived'),
            default        => null,
        };

        $dokumens = $query->get();

        return Inertia::render('Admin/Documents', [
            'documents'         => $dokumens->map(fn (Dokumen $d) => $this->mapDokumen($d))->values(),
            'filters'           => $filters,
            'summary'           => [
                'total'         => Dokumen::query()->count(),
                'published'     => Dokumen::query()->where('status', 'published')->count(),
                'draft'         => Dokumen::query()->where('status', 'draft')->count(),
                'archived'      => Dokumen::query()->where('status', 'archived')->count(),
                'documentation' => Dokumen::query()
                    ->where(function ($inner) {
                        $inner->where('tipe', 'event_documentation')
                            ->orWhere('kategori', 'Dokumentasi Kegiatan');
                    })
                    ->count(),
            ],
            'categoryOptions'   => $this->categoryOptions,
            'typeOptions'       => collect($this->typeOptions)
                ->map(fn ($label, $value) => ['value' => $value, 'label' => $label])
                ->values(),
            'visibilityOptions' => collect($this->visibilityOptions)
                ->map(fn ($label, $value) => ['value' => $value, 'label' => $label])
                ->values(),
            'statusOptions'     => collect($this->statusOptions)
                ->map(fn ($label, $value) => ['value' => $value, 'label' => $label])
                ->values(),
        ]);
    }

    // ================================================================
    // STORE
    // ================================================================

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatedData($request);

        $uploadedPaths = [];

        try {
            DB::transaction(function () use ($request, $validated, &$uploadedPaths) {
                $dokumen = Dokumen::create([
                    ...$validated,
                    'slug'         => $this->uniqueSlug($validated['judul']),
                    'published_at' => $validated['status'] === 'published' ? now() : null,
                    'created_by'   => $request->user()?->id,
                    'updated_by'   => $request->user()?->id,
                ]);

                $uploadedPaths = $this->storeUploadedFiles($request, $dokumen);
            });
        } catch (\Throwable $e) {
            // Rollback: hapus file yang terlanjur diunggah
            foreach ($uploadedPaths as $path) {
                Storage::disk(self::DISK)->delete($path);
            }
            Log::error('[AdminDokumen] Gagal store dokumen', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return back()->withErrors(['judul' => 'Gagal menyimpan dokumen: ' . $e->getMessage()]);
        }

        return back()->with('success', 'Dokumen berhasil ditambahkan.');
    }

    // ================================================================
    // UPDATE
    // ================================================================

    public function update(Request $request, Dokumen $dokumen): RedirectResponse
    {
        $validated = $this->validatedData($request);

        $uploadedPaths = [];
        $oldPathsToDelete = [];

        try {
            DB::transaction(function () use ($request, $validated, $dokumen, &$uploadedPaths, &$oldPathsToDelete) {
                $publishedAt = $dokumen->published_at;

                if ($validated['status'] === 'published' && ! $publishedAt) {
                    $publishedAt = now();
                }

                if ($validated['status'] !== 'published') {
                    $publishedAt = null;
                }

                $dokumen->update([
                    ...$validated,
                    'slug'         => $dokumen->judul !== $validated['judul']
                        ? $this->uniqueSlug($validated['judul'], $dokumen->id)
                        : $dokumen->slug,
                    'published_at' => $publishedAt,
                    'updated_by'   => $request->user()?->id,
                ]);

                // Ganti file utama jika ada file baru
                if ($request->hasFile('main_file')) {
                    $existingMain = $dokumen->files()->where(function ($q) {
                        $q->where('category', 'main')
                          ->orWhere('file_type', 'main_file');
                    })->first();

                    $newPath = $this->storeFile($dokumen, $request->file('main_file'), 'main');
                    $uploadedPaths[] = $newPath->getEffectivePath();

                    if ($existingMain) {
                        $oldPathsToDelete[] = $existingMain->getEffectivePath();
                        $existingMain->delete();
                    }
                }

                // Ganti cover jika ada file baru
                if ($request->hasFile('cover_image')) {
                    $existingCover = $dokumen->files()->where(function ($q) {
                        $q->where('category', 'cover')
                          ->orWhere('file_type', 'cover_image');
                    })->first();

                    $newPath = $this->storeFile($dokumen, $request->file('cover_image'), 'cover');
                    $uploadedPaths[] = $newPath->getEffectivePath();

                    if ($existingCover) {
                        $oldPathsToDelete[] = $existingCover->getEffectivePath();
                        $existingCover->delete();
                    }
                }

                // Folder Foto Kegiatan baru ditambahkan
                $folderFiles = $request->file('folder_foto_kegiatan', []);
                $folderPaths = $request->input('folder_foto_kegiatan_paths', []);
                foreach ($folderFiles as $index => $file) {
                    if ($file instanceof UploadedFile) {
                        $relPath = $folderPaths[$index] ?? $file->getClientOriginalName();
                        $new = $this->storeFile($dokumen, $file, 'attachment', $relPath);
                        $uploadedPaths[] = $new->getEffectivePath();
                    }
                }

                // Galeri baru ditambahkan
                $galleryFiles = $request->file('gallery_files', []);
                $galleryPaths = $request->input('gallery_paths', []);
                foreach ($galleryFiles as $index => $file) {
                    if ($file instanceof UploadedFile) {
                        $relPath = $galleryPaths[$index] ?? $file->getClientOriginalName();
                        $new = $this->storeFile($dokumen, $file, 'gallery', $relPath);
                        $uploadedPaths[] = $new->getEffectivePath();
                    }
                }
            });

            // Hapus file lama hanya setelah transaksi berhasil
            foreach ($oldPathsToDelete as $oldPath) {
                if ($oldPath) {
                    Storage::disk(self::DISK)->delete($oldPath);
                    // Coba juga hapus dari disk public (file lama)
                    Storage::disk('public')->delete($oldPath);
                }
            }
        } catch (\Throwable $e) {
            // Rollback: hapus file baru yang terlanjur diunggah
            foreach ($uploadedPaths as $path) {
                if ($path) {
                    Storage::disk(self::DISK)->delete($path);
                }
            }
            Log::error('[AdminDokumen] Gagal update dokumen', [
                'dokumen_id' => $dokumen->id,
                'error'      => $e->getMessage(),
                'trace'      => $e->getTraceAsString(),
            ]);

            return back()->withErrors(['judul' => 'Gagal memperbarui dokumen: ' . $e->getMessage()]);
        }

        return back()->with('success', 'Dokumen berhasil diperbarui.');
    }

    // ================================================================
    // PUBLISH / UNPUBLISH / ARCHIVE
    // ================================================================

    public function publish(Request $request, Dokumen $dokumen): RedirectResponse
    {
        $dokumen->update([
            'status'       => 'published',
            'published_at' => $dokumen->published_at ?: now(),
            'updated_by'   => $request->user()?->id,
        ]);

        return back()->with('success', 'Dokumen berhasil dipublish.');
    }

    public function unpublish(Request $request, Dokumen $dokumen): RedirectResponse
    {
        $dokumen->update([
            'status'       => 'draft',
            'published_at' => null,
            'updated_by'   => $request->user()?->id,
        ]);

        return back()->with('success', 'Dokumen berhasil dikembalikan ke draft.');
    }

    public function archive(Request $request, Dokumen $dokumen): RedirectResponse
    {
        $dokumen->update([
            'status'       => 'archived',
            'published_at' => null,
            'updated_by'   => $request->user()?->id,
        ]);

        return back()->with('success', 'Dokumen berhasil diarsipkan.');
    }

    // ================================================================
    // DESTROY DOKUMEN
    // ================================================================

    public function destroy(Dokumen $dokumen): RedirectResponse
    {
        foreach ($dokumen->files as $file) {
            $path = $file->getEffectivePath();
            if ($path) {
                Storage::disk(self::DISK)->delete($path);
                Storage::disk('public')->delete($path);
            }
        }
        $dokumen->delete(); // cascade akan hapus records dokumen_files

        return back()->with('success', 'Dokumen beserta seluruh berkasnya berhasil dihapus secara permanen.');
    }

    // ================================================================
    // DESTROY FILE (per file, verifikasi relasi)
    // ================================================================

    public function destroyFile(Dokumen $dokumen, DokumenFile $file): RedirectResponse
    {
        // Verifikasi file benar-benar milik dokumen ini
        if ($file->dokumen_id !== $dokumen->id) {
            abort(403, 'File tidak terkait dengan dokumen ini.');
        }

        $path = $file->getEffectivePath();

        $file->delete();

        if ($path) {
            Storage::disk(self::DISK)->delete($path);
            Storage::disk('public')->delete($path);
        }

        return back()->with('success', 'File berhasil dihapus.');
    }

    // ================================================================
    // PREVIEW FILE (admin)
    // ================================================================

    public function previewFile(Dokumen $dokumen, DokumenFile $file)
    {
        if ($file->dokumen_id !== $dokumen->id) {
            abort(403, 'File tidak terkait dengan dokumen ini.');
        }

        $path = $file->getEffectivePath();

        // Coba disk local terlebih dahulu
        if ($path && Storage::disk(self::DISK)->exists($path)) {
            return response()->file(Storage::disk(self::DISK)->path($path), [
                'Content-Type'           => $file->mime_type ?: 'application/octet-stream',
                'Content-Disposition'    => 'inline; filename="' . addslashes($file->original_name ?: 'file') . '"',
                'X-Content-Type-Options' => 'nosniff',
            ]);
        }

        // Fallback: coba disk public (file lama)
        if ($path && Storage::disk('public')->exists($path)) {
            return response()->file(Storage::disk('public')->path($path), [
                'Content-Type'           => $file->mime_type ?: 'application/octet-stream',
                'Content-Disposition'    => 'inline; filename="' . addslashes($file->original_name ?: 'file') . '"',
                'X-Content-Type-Options' => 'nosniff',
            ]);
        }

        abort(404, 'File tidak ditemukan di penyimpanan.');
    }

    // ================================================================
    // DOWNLOAD FILE (admin)
    // ================================================================

    public function downloadFile(Dokumen $dokumen, DokumenFile $file)
    {
        if ($file->dokumen_id !== $dokumen->id) {
            abort(403, 'File tidak terkait dengan dokumen ini.');
        }

        $path = $file->getEffectivePath();

        // Coba disk local
        if ($path && Storage::disk(self::DISK)->exists($path)) {
            return Storage::disk(self::DISK)->download($path, $file->original_name ?: basename($path));
        }

        // Fallback disk public
        if ($path && Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->download($path, $file->original_name ?: basename($path));
        }

        return back()->with('error', 'File tidak ditemukan di penyimpanan.');
    }

    // ================================================================
    // PRIVATE: STORE FILE HELPER
    // ================================================================

    private function storeFile(Dokumen $dokumen, UploadedFile $file, string $category, ?string $customOriginalName = null): DokumenFile
    {
        $ext        = strtolower($file->getClientOriginalExtension());
        $storedName = Str::uuid() . '.' . $ext;
        $folder     = 'documents/' . $dokumen->id . '/' . $category;
        $storedPath = $folder . '/' . $storedName;

        $disk = in_array($category, ['cover', 'gallery'], true) ? 'public' : self::DISK;
        Storage::disk($disk)->putFileAs($folder, $file, $storedName);

        $origName = $customOriginalName ?: $file->getClientOriginalName();

        return $dokumen->files()->create([
            'category'       => $category,
            'original_name'  => $origName,
            'stored_name'    => $storedName,
            'stored_path'    => $storedPath,
            'extension'      => $ext,
            'mime_type'      => $file->getMimeType() ?: $file->getClientMimeType(),
            'size'           => $file->getSize() ?: 0,
            'is_downloadable'=> true,
            'sort_order'     => $dokumen->files()->where('category', $category)->count(),
            // kolom lama untuk kompatibilitas
            'path'           => $storedPath,
            'file_type'      => match ($category) {
                'main'       => 'main_file',
                'cover'      => 'cover_image',
                'gallery'    => 'gallery_image',
                default      => $category,
            },
        ]);
    }

    // ================================================================
    // PRIVATE: STORE ALL UPLOADED FILES (store action)
    // ================================================================

    private function storeUploadedFiles(Request $request, Dokumen $dokumen): array
    {
        $paths = [];

        if ($request->hasFile('main_file')) {
            $f      = $this->storeFile($dokumen, $request->file('main_file'), 'main');
            $paths[] = $f->getEffectivePath();
        }

        if ($request->hasFile('cover_image')) {
            $f      = $this->storeFile($dokumen, $request->file('cover_image'), 'cover');
            $paths[] = $f->getEffectivePath();
        }

        $folderFiles = $request->file('folder_foto_kegiatan', []);
        $folderPaths = $request->input('folder_foto_kegiatan_paths', []);
        foreach ($folderFiles as $index => $file) {
            if ($file instanceof UploadedFile) {
                $relPath = $folderPaths[$index] ?? $file->getClientOriginalName();
                $f      = $this->storeFile($dokumen, $file, 'attachment', $relPath);
                $paths[] = $f->getEffectivePath();
            }
        }

        $galleryFiles = $request->file('gallery_files', []);
        $galleryPaths = $request->input('gallery_paths', []);
        foreach ($galleryFiles as $index => $file) {
            if ($file instanceof UploadedFile) {
                $relPath = $galleryPaths[$index] ?? $file->getClientOriginalName();
                $f      = $this->storeFile($dokumen, $file, 'gallery', $relPath);
                $paths[] = $f->getEffectivePath();
            }
        }

        return array_filter($paths);
    }

    // ================================================================
    // PRIVATE: VALIDATION
    // ================================================================

    private function validatedData(Request $request): array
    {
        $dangerousExts = ['php', 'phtml', 'phar', 'exe', 'bat', 'sh', 'js', 'html', 'htm', 'asp', 'aspx', 'cgi', 'pl', 'py', 'rb'];

        return $request->validate([
            'judul'                        => ['required', 'string', 'max:255'],
            'deskripsi'                    => ['nullable', 'string'],
            'kategori'                     => ['required', 'string', Rule::in($this->categoryOptions)],
            'tipe'                         => ['required', 'string', Rule::in(array_keys($this->typeOptions))],
            'visibility'                   => ['required', 'string', Rule::in(array_keys($this->visibilityOptions))],
            'status'                       => ['required', 'string', Rule::in(array_keys($this->statusOptions))],
            'periode_bulan'                => ['nullable', 'integer', 'between:1,12'],
            'periode_tahun'                => ['nullable', 'integer', 'between:2000,2100'],
            'main_file'                    => ['nullable', 'file', 'max:10240', 'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,webp,zip'],
            'cover_image'                  => ['nullable', 'file', 'max:10240', 'mimes:jpg,jpeg,png,webp'],
            'folder_foto_kegiatan'         => ['nullable', 'array'],
            'folder_foto_kegiatan.*'       => ['nullable', 'file', 'max:10240', 'mimes:jpg,jpeg,png,webp'],
            'folder_foto_kegiatan_paths'   => ['nullable', 'array'],
            'folder_foto_kegiatan_paths.*' => ['nullable', 'string'],
            'gallery_files'                => ['nullable', 'array'],
            'gallery_files.*'              => ['nullable', 'file', 'max:10240', 'mimes:jpg,jpeg,png,webp'],
            'gallery_paths'                => ['nullable', 'array'],
            'gallery_paths.*'              => ['nullable', 'string'],
        ], [
            'judul.required'               => 'Judul dokumen wajib diisi.',
            'judul.max'                    => 'Judul dokumen maksimal 255 karakter.',
            'kategori.required'            => 'Kategori dokumen wajib dipilih.',
            'kategori.in'                  => 'Kategori dokumen tidak valid.',
            'tipe.required'                => 'Tipe dokumen wajib dipilih.',
            'tipe.in'                      => 'Tipe dokumen tidak valid.',
            'visibility.required'          => 'Visibility dokumen wajib dipilih.',
            'status.required'              => 'Status dokumen wajib dipilih.',
            'main_file.file'               => 'File utama harus berupa file yang valid.',
            'main_file.max'                => 'File utama maksimal 10 MB.',
            'main_file.mimes'              => 'File utama harus berformat PDF, Word, Excel, PowerPoint, gambar, atau ZIP.',
            'cover_image.file'             => 'Cover harus berupa file gambar yang valid.',
            'cover_image.max'              => 'Cover maksimal 10 MB.',
            'cover_image.mimes'            => 'Cover harus berformat JPG, JPEG, PNG, atau WEBP.',
            'folder_foto_kegiatan.*.file'   => 'Setiap foto kegiatan harus berupa file yang valid.',
            'folder_foto_kegiatan.*.max'    => 'Setiap foto kegiatan maksimal 10 MB.',
            'folder_foto_kegiatan.*.mimes'  => 'Setiap foto kegiatan harus berformat JPG, JPEG, PNG, atau WEBP.',
            'gallery_files.*.file'         => 'Setiap foto galeri harus berupa file gambar yang valid.',
            'gallery_files.*.max'          => 'Setiap foto galeri maksimal 10 MB.',
            'gallery_files.*.mimes'        => 'Foto galeri harus berformat JPG, JPEG, PNG, atau WEBP.',
        ]);
    }

    // ================================================================
    // PRIVATE: MAP DOKUMEN FOR FRONTEND
    // ================================================================

    private function mapDokumen(Dokumen $dokumen): array
    {
        return [
            'id'              => $dokumen->id,
            'title'           => $dokumen->judul,
            'slug'            => $dokumen->slug,
            'description'     => $dokumen->deskripsi,
            'category'        => $dokumen->kategori,
            'type'            => $dokumen->tipe,
            'typeLabel'       => $this->typeOptions[$dokumen->tipe] ?? Str::headline($dokumen->tipe),
            'visibility'      => $dokumen->visibility,
            'visibilityLabel' => $this->visibilityOptions[$dokumen->visibility] ?? Str::headline($dokumen->visibility),
            'status'          => $dokumen->status,
            'statusLabel'     => $this->statusOptions[$dokumen->status] ?? Str::headline($dokumen->status),
            'periodMonth'     => $dokumen->periode_bulan,
            'periodYear'      => $dokumen->periode_tahun,
            'publishedAt'     => $dokumen->published_at?->toDateString(),
            'createdAt'       => $dokumen->created_at?->toDateString(),
            'createdBy'       => $dokumen->creator?->name,
            'files'           => $dokumen->files
                ->sortBy('sort_order')
                ->map(fn (DokumenFile $file) => $this->mapFile($file, $dokumen))
                ->values(),
        ];
    }

    private function mapFile(DokumenFile $file, Dokumen $dokumen): array
    {
        $cat        = $file->normalizedCategory();
        $path       = $file->getEffectivePath();
        $existsLocal  = $path && Storage::disk(self::DISK)->exists($path);
        $existsPublic = $path && Storage::disk('public')->exists($path);
        $exists       = $existsLocal || $existsPublic;

        // URL preview: gunakan route controller (bukan direct URL untuk disk local)
        $previewUrl  = $path ? route('admin.documents.files.preview', ['dokumen' => $dokumen->id, 'file' => $file->id]) : null;
        $downloadUrl = $path ? route('admin.documents.files.download', ['dokumen' => $dokumen->id, 'file' => $file->id]) : null;

        // Untuk gambar di disk public (file lama), sediakan juga URL langsung
        $directUrl = ($existsPublic && ! $existsLocal)
            ? Storage::disk('public')->url($path)
            : null;

        return [
            'id'            => $file->id,
            'category'      => $cat,
            'originalName'  => $file->original_name,
            'mimeType'      => $file->mime_type,
            'size'          => (int) $file->size,
            'extension'     => $file->extension ?: pathinfo((string) $file->original_name, PATHINFO_EXTENSION),
            'isImage'       => $file->isImage(),
            'isPdf'         => $file->isPdf(),
            'isDownloadable'=> (bool) $file->is_downloadable,
            'exists'        => $exists,
            'previewUrl'    => $previewUrl,
            'downloadUrl'   => $downloadUrl,
            'directUrl'     => $directUrl, // URL langsung untuk gambar lama di disk public
            'createdAt'     => $file->created_at?->toDateString(),
            // kolom lama tetap dikirim untuk kompatibilitas frontend
            'url'           => $directUrl ?? $previewUrl,
            'fileType'      => $file->file_type,
        ];
    }

    // ================================================================
    // PRIVATE: UNIQUE SLUG
    // ================================================================

    private function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($title) ?: 'dokumen';
        $slug     = $baseSlug;
        $counter  = 2;

        while (
            Dokumen::query()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}
