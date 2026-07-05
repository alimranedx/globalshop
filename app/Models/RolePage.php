<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RolePage extends Model
{
    use HasFactory;

    // No default timestamps for mapping table except created_at
    const UPDATED_AT = null;

    protected $fillable = [
        'role_id',
        'page_identifier',
    ];

    /**
     * Get the role associated with this permission.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }
}
