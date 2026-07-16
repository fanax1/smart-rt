<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PengaduanFile extends Model
{
    protected $table = 'pengaduan_files';

    protected $fillable = [
        'pengaduan_id',
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

    public function pengaduan(): BelongsTo
    {
        return $this->belongsTo(Pengaduan::class);
    }
}
