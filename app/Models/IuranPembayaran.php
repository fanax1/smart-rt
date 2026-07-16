<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IuranPembayaran extends Model
{
    protected $table = 'iuran_pembayarans';

    protected $fillable = [
        'kartu_keluarga_id',
        'periode',
        'jumlah_dibayar',
        'tanggal_bayar',
        'metode_pembayaran',
        'status_verifikasi',
        'bukti_pembayaran',
        'catatan',
        'catatan_verifikasi',
        'created_by',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'periode' => 'date',
        'jumlah_dibayar' => 'decimal:2',
        'tanggal_bayar' => 'date',
        'verified_at' => 'datetime',
    ];

    public function kartuKeluarga(): BelongsTo
    {
        return $this->belongsTo(KartuKeluarga::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
