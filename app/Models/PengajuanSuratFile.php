<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PengajuanSuratFile extends Model
{
    protected $fillable = [
        'pengajuan_surat_id',
        'uploaded_by',
        'kategori',
        'label',
        'original_name',
        'path',
        'mime_type',
        'size',
        'is_admin_file',
    ];

    protected $casts = [
        'size' => 'integer',
        'is_admin_file' => 'boolean',
    ];

    public function pengajuanSurat(): BelongsTo
    {
        return $this->belongsTo(PengajuanSurat::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
