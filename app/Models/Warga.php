<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Warga extends Model
{
    protected $fillable = [
        'hunian_id',
        'kartu_keluarga_id',
        'nama_lengkap',
        'nik',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'agama',
        'pendidikan',
        'pekerjaan',
        'status_perkawinan',
        'hubungan_keluarga',
        'kewarganegaraan',
        'nama_ayah',
        'nama_ibu',
        'is_kepala_keluarga',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
        'is_kepala_keluarga' => 'boolean',
    ];

    public function hunian(): BelongsTo
    {
        return $this->belongsTo(Hunian::class);
    }

    public function kartuKeluarga(): BelongsTo
    {
        return $this->belongsTo(KartuKeluarga::class);
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }
}