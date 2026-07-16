<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceTransaction extends Model
{
    protected $table = 'finance_transactions';

    protected $fillable = [
        'tipe',
        'kategori',
        'jumlah',
        'deskripsi',
        'tanggal',
        'status',
        'created_by',
    ];

    protected $casts = [
        'jumlah' => 'decimal:2',
        'tanggal' => 'date',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
