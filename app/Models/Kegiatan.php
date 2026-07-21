<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kegiatan extends Model
{
    protected $fillable = [
        'judul',
        'tanggal',
        'lokasi',
        'kategori',
        'memerlukan_dana',
        'estimasi_biaya',
        'status_kegiatan',
        'jam_mulai',
        'jam_selesai',
        'deskripsi',
        'penanggung_jawab',
        'target_peserta',
        'wajib_hadir',
        'sumber_dana',
        'penanggung_jawab_dana',
        'catatan_anggaran',
        'poster',
        'catatan',
        'foto_dokumentasi',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'memerlukan_dana' => 'boolean',
        'wajib_hadir' => 'boolean',
        'estimasi_biaya' => 'decimal:2',
        'foto_dokumentasi' => 'array',
    ];

    public function anggaranItems(): HasMany
    {
        return $this->hasMany(KegiatanAnggaranItem::class);
    }

    public function pengeluarans(): HasMany
    {
        return $this->hasMany(KegiatanPengeluaran::class);
    }

    public function partisipasis(): HasMany
    {
        return $this->hasMany(KegiatanPartisipasi::class);
    }

    public function pesertaAktif(): HasMany
    {
        return $this->hasMany(KegiatanPartisipasi::class)->where('status', 'ikut');
    }
}
