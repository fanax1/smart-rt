<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class DokumenFile extends Model
{
    protected $table = 'dokumen_files';

    protected $fillable = [
        'dokumen_id',
        'category',
        'original_name',
        'stored_name',
        'stored_path',
        'extension',
        'mime_type',
        'size',
        'is_downloadable',
        'sort_order',
        // kolom lama dipertahankan untuk kompatibilitas
        'path',
        'file_type',
    ];

    protected $casts = [
        'size'            => 'integer',
        'is_downloadable' => 'boolean',
        'sort_order'      => 'integer',
    ];

    // ----------------------------------------------------------------
    // Relasi
    // ----------------------------------------------------------------

    public function dokumen(): BelongsTo
    {
        return $this->belongsTo(Dokumen::class);
    }

    // ----------------------------------------------------------------
    // Accessors & Helpers
    // ----------------------------------------------------------------

    /** Path efektif: gunakan stored_path jika ada, fallback ke path lama */
    public function getEffectivePath(): ?string
    {
        return $this->stored_path ?: $this->path ?: null;
    }

    /** Apakah file benar-benar tersedia di storage local? */
    public function existsOnDisk(): bool
    {
        $path = $this->getEffectivePath();
        return $path && Storage::disk('local')->exists($path);
    }

    /** Apakah file disimpan di disk public lama? */
    public function existsOnPublicDisk(): bool
    {
        $path = $this->getEffectivePath();
        return $path && Storage::disk('public')->exists($path);
    }

    /** Apakah ini file gambar? */
    public function isImage(): bool
    {
        return str_starts_with((string) $this->mime_type, 'image/');
    }

    /** Apakah ini PDF? */
    public function isPdf(): bool
    {
        return $this->mime_type === 'application/pdf';
    }

    /** Kategori yang dinormalisasi */
    public function normalizedCategory(): string
    {
        // Mapping dari file_type lama
        $map = [
            'main_file'     => 'main',
            'cover_image'   => 'cover',
            'attachment'    => 'attachment',
            'gallery_image' => 'gallery',
        ];

        if ($this->category && in_array($this->category, ['main', 'cover', 'attachment', 'gallery'], true)) {
            return $this->category;
        }

        return $map[$this->file_type ?? ''] ?? $map[$this->category ?? ''] ?? 'main';
    }
}
