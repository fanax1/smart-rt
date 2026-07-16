<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KartuKeluarga extends Model
{
    protected $fillable = [
        'hunian_id',
        'no_kk',
        'nama_kepala_keluarga',
        'alamat',
        'rt',
        'rw',
        'kelurahan_desa',
        'kecamatan',
        'kabupaten_kota',
        'provinsi',
        'kode_pos',
    ];

    public function hunian(): BelongsTo
    {
        return $this->belongsTo(Hunian::class);
    }

    public function wargas(): HasMany
    {
        return $this->hasMany(Warga::class);
    }

    public function iuranPembayarans(): HasMany
    {
        return $this->hasMany(IuranPembayaran::class);
    }
}