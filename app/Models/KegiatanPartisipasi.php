<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KegiatanPartisipasi extends Model
{
    protected $table = 'kegiatan_partisipasis';

    protected $fillable = [
        'kegiatan_id',
        'warga_id',
        'user_id',
        'status',
        'catatan',
    ];

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(Kegiatan::class);
    }

    public function warga(): BelongsTo
    {
        return $this->belongsTo(Warga::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
