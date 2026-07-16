<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PengajuanSuratApproval extends Model
{
    protected $fillable = [
        'pengajuan_surat_id',
        'approved_by',
        'status',
        'notes',
    ];

    public function pengajuanSurat(): BelongsTo
    {
        return $this->belongsTo(PengajuanSurat::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
