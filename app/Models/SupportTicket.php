<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_number',
        'user_id',
        'customer_id',
        'user_type',
        'shop_id',
        'name',
        'email',
        'phone',
        'category',
        'subject',
        'message',
        'priority',
        'status',
        'assigned_admin_id',
        'device_info',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(MarketplaceCustomer::class, 'customer_id');
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class, 'shop_id');
    }

    public function assignedAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_admin_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(SupportTicketMessage::class, 'ticket_id');
    }

    /**
     * Generate a unique human-readable ticket number (GS-2026-XXXXXX).
     */
    public static function generateTicketNumber(): string
    {
        $year = date('Y');
        $count = static::whereYear('created_at', $year)->count() + 1;
        do {
            $ticketNumber = sprintf('GS-%s-%06d', $year, $count++);
        } while (static::where('ticket_number', $ticketNumber)->exists());

        return $ticketNumber;
    }
}
