<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommitteeMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'committee_period_id',
        'name',
        'position',
        'category',
        'phone',
        'email',
        'photo_path',
        'description',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'committee_period_id' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function period(): BelongsTo
    {
        return $this->belongsTo(CommitteePeriod::class, 'committee_period_id');
    }
}