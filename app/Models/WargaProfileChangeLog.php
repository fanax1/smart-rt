<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WargaProfileChangeLog extends Model
{
    protected $fillable = [
        'user_id',
        'warga_id',
        'editor_id',
        'field',
        'old_value',
        'new_value',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'editor_id');
    }

    public function warga(): BelongsTo
    {
        return $this->belongsTo(Warga::class);
    }
}