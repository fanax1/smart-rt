<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IuranKomponen extends Model
{
    protected $table = 'iuran_komponens';

    protected $fillable = [
        'nama',
        'nominal',
        'keterangan',
        'urutan',
        'is_active',
    ];

    protected $casts = [
        'nominal' => 'decimal:2',
        'urutan' => 'integer',
        'is_active' => 'boolean',
    ];
}
