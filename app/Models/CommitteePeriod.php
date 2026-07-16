<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommitteePeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'start_year',
        'end_year',
        'status',
        'is_active',
        'description',
    ];

    protected $casts = [
        'start_year' => 'integer',
        'end_year' => 'integer',
        'is_active' => 'boolean',
    ];

    public function members(): HasMany
    {
        return $this->hasMany(CommitteeMember::class)->orderBy('sort_order')->orderBy('id');
    }

    public function activeMembers(): HasMany
    {
        return $this->hasMany(CommitteeMember::class)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id');
    }
}