<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    protected $table = 'tickets';

    protected $fillable = [
        'nomor_tiket',
        'user_id',
        'nama_lengkap',
        'whatsapp',
        'no_rumah',
        'email',
        'keperluan',
        'kategori',
        'judul',
        'pesan',
        'lampiran_path',
        'lampiran_original_name',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(TicketMessage::class)->orderBy('created_at', 'asc');
    }
}
