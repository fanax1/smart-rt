<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JenisSurat extends Model
{
    protected $fillable = [
        'nama',
        'kode',
        'deskripsi',
        'fields',
        'upload_requirements',
        'is_active',
        'urutan',
    ];

    protected $casts = [
        'fields' => 'array',
        'upload_requirements' => 'array',
        'is_active' => 'boolean',
        'urutan' => 'integer',
    ];

    public function pengajuanSurats(): HasMany
    {
        return $this->hasMany(PengajuanSurat::class);
    }
}
