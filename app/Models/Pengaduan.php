<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pengaduan extends Model
{
    protected $table = 'pengaduans';

    protected $fillable = [
        'nomor_pengaduan',
        'warga_id',
        'kartu_keluarga_id',
        'hunian_id',
        'judul',
        'kategori',
        'prioritas',
        'lokasi',
        'deskripsi',
        'is_private',
        'is_archived',
        'is_confirmed',
        'status',
        'catatan_admin',
        'tanggal_pengaduan',
        'tanggal_diproses',
        'tanggal_selesai',
        'created_by',
        'updated_by',
        'resolved_by',
    ];

    protected $casts = [
        'is_private' => 'boolean',
        'is_archived' => 'boolean',
        'is_confirmed' => 'boolean',
        'tanggal_pengaduan' => 'datetime',
        'tanggal_diproses' => 'datetime',
        'tanggal_selesai' => 'datetime',
    ];

    public function warga(): BelongsTo
    {
        return $this->belongsTo(Warga::class);
    }

    public function kartuKeluarga(): BelongsTo
    {
        return $this->belongsTo(KartuKeluarga::class);
    }

    public function hunian(): BelongsTo
    {
        return $this->belongsTo(Hunian::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(PengaduanFile::class);
    }

    public function tanggapans(): HasMany
    {
        return $this->hasMany(PengaduanTanggapan::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', ['diajukan', 'diproses']);
    }
}
