<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PengumumanFile extends Model
{
    protected $table = 'pengumuman_files';
    protected $fillable = [
        'pengumuman_id',
        'original_name',
        'path',
        'mime_type',
        'size',
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    public function pengumuman(): BelongsTo
    {
        return $this->belongsTo(Pengumuman::class);
    }
}
