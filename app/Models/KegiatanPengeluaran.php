<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KegiatanPengeluaran extends Model
{
    protected $fillable = [
        'kegiatan_id',
        'tanggal_pengeluaran',
        'nama_pengeluaran',
        'kategori_pengeluaran',
        'nominal',
        'metode_pembayaran',
        'bukti_pembayaran',
        'keterangan',
    ];

    protected $casts = [
        'tanggal_pengeluaran' => 'date',
        'nominal' => 'decimal:2',
    ];

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(Kegiatan::class);
    }
}