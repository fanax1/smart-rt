<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dokumen extends Model
{
    protected $table = 'dokumens';

    protected $fillable = [
        'judul',
        'slug',
        'deskripsi',
        'kategori',
        'tipe',
        'visibility',
        'status',
        'periode_bulan',
        'periode_tahun',
        'published_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'periode_bulan' => 'integer',
        'periode_tahun' => 'integer',
        'published_at' => 'datetime',
    ];

    public function files(): HasMany
    {
        return $this->hasMany(DokumenFile::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
