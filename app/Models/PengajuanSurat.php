<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PengajuanSurat extends Model
{
    public const STATUSES = [
        'draft',
        'diajukan',
        'diverifikasi_rt',
        'revisi',
        'disetujui',
        'ditolak',
        'selesai',
        'diambil',
    ];

    protected $fillable = [
        'kartu_keluarga_id',
        'pemohon_warga_id',
        'jenis_surat_id',
        'nomor_pengajuan',
        'nomor_surat',
        'ringkasan_keperluan',
        'data_pengajuan',
        'catatan_warga',
        'catatan_admin',
        'status',
        'tanggal_pengajuan',
        'tanggal_diverifikasi',
        'tanggal_disetujui',
        'tanggal_selesai',
        'tanggal_diambil',
        'processed_by',
    ];

    protected $casts = [
        'data_pengajuan' => 'array',
        'tanggal_pengajuan' => 'datetime',
        'tanggal_diverifikasi' => 'datetime',
        'tanggal_disetujui' => 'datetime',
        'tanggal_selesai' => 'datetime',
        'tanggal_diambil' => 'datetime',
    ];

    public function kartuKeluarga(): BelongsTo
    {
        return $this->belongsTo(KartuKeluarga::class);
    }

    public function pemohon(): BelongsTo
    {
        return $this->belongsTo(Warga::class, 'pemohon_warga_id');
    }

    public function jenisSurat(): BelongsTo
    {
        return $this->belongsTo(JenisSurat::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(PengajuanSuratFile::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(PengajuanSuratApproval::class);
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
