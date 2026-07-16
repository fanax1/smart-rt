<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pengumuman extends Model
{
    protected $table = 'pengumumans';
    protected $fillable = [
        'judul',
        'isi',
        'kategori',
        'target_audiens',
        'status',
        'published_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function files(): HasMany
    {
        return $this->hasMany(PengumumanFile::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopePublishedForWarga(Builder $query): Builder
    {
        return $query
            ->where('status', 'published')
            ->whereIn('target_audiens', ['semua', 'warga'])
            ->where(function (Builder $builder) {
                $builder->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            });
    }
}
