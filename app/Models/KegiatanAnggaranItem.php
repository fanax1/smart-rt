<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KegiatanAnggaranItem extends Model
{
    protected $fillable = [
        'kegiatan_id',
        'nama_kebutuhan',
        'qty',
        'harga_satuan',
        'subtotal',
        'keterangan',
    ];

    protected $casts = [
        'qty' => 'integer',
        'harga_satuan' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(Kegiatan::class);
    }
}