<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class MarketplaceCustomer extends Model
{
    protected $fillable = [
        'phone',
        'email',
        'name',
        'avatar',
        'password',
        'status',
        'last_login_at',
        'shipping_address',
        'otp',
        'otp_expires_at',
        'verified_at',
    ];

    protected $casts = [
        'otp_expires_at' => 'datetime',
        'verified_at'    => 'datetime',
        'last_login_at'   => 'datetime',
        'password'       => 'hashed',
    ];

    protected $hidden = [
        'password',
        'otp',
        'otp_expires_at',
    ];

    /**
     * Support tickets created by this customer.
     */
    public function supportTickets(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(SupportTicket::class, 'customer_id');
    }

    /**
     * The shops this customer has subscribed/preferred.
     * Max 5, enforced at API controller level.
     */
    public function preferredShops(): BelongsToMany
    {
        return $this->belongsToMany(
            Shop::class,
            'customer_preferred_shops',
            'customer_id',
            'shop_id'
        )->withPivot('created_at')->orderBy('customer_preferred_shops.created_at');
    }

    /**
     * Check if phone OTP is still valid (not expired).
     */
    public function isOtpValid(string $otp): bool
    {
        if (!$this->otp || !$this->otp_expires_at) {
            return false;
        }
        return $this->otp === $otp && now()->lessThanOrEqualTo($this->otp_expires_at);
    }

    /**
     * Generate and store a new OTP (simulated — always 123456 in dev for ease).
     */
    public function generateOtp(): string
    {
        $otp = app()->environment('local') || config('app.debug')
            ? '123456'
            : str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $this->update([
            'otp'            => $otp,
            'otp_expires_at' => now()->addMinutes(10),
        ]);

        return $otp;
    }

    /**
     * Whether this customer has verified their phone number.
     */
    public function isVerified(): bool
    {
        return !is_null($this->verified_at);
    }
}
