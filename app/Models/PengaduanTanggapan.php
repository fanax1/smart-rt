<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PengaduanTanggapan extends Model
{
    protected $table = 'pengaduan_tanggapans';

    protected $fillable = [
        'pengaduan_id',
        'user_id',
        'status_from',
        'status_to',
        'pesan',
        'is_admin',
    ];

    protected $casts = [
        'is_admin' => 'boolean',
    ];

    public function pengaduan(): BelongsTo
    {
        return $this->belongsTo(Pengaduan::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
