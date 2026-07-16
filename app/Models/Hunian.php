<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Hunian extends Model
{
    protected $fillable = [
        'no_rumah',
        'status_hunian',
        'status_warga',
        'kontak_penghuni',
        'alamat_hunian',
        'pemilik_nama',
        'pemilik_kontak',
        'pemilik_alamat',
        'tanggal_mulai_menempati',
        'masa_kontrak_selesai',
        'nama_kos',
        'nomor_kamar',
        'catatan_hunian',
    ];

    public function kartuKeluarga(): HasOne
    {
        return $this->hasOne(KartuKeluarga::class);
    }

    public function wargas(): HasMany
    {
        return $this->hasMany(Warga::class);
    }
}