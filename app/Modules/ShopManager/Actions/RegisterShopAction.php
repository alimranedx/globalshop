<?php

namespace App\Modules\ShopManager\Actions;

use App\Models\Plan;
use App\Models\Role;
use App\Models\Shop;
use App\Models\Subscription;
use App\Models\User;
use App\Modules\AuditLog\Actions\LogActivityAction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RegisterShopAction
{
    protected LogActivityAction $logger;

    public function __construct(LogActivityAction $logger)
    {
        $this->logger = $logger;
    }

    /**
     * Execute the shop registration process.
     */
    public function execute(array $shopData, array $ownerData, ?string $planId = null): Shop
    {
        return DB::transaction(function () use ($shopData, $ownerData, $planId) {
            // 1. Resolve or create Owner account
            $owner = User::where('email', $ownerData['email'])->first();

            if (! $owner) {
                $owner = User::create([
                    'name' => $ownerData['name'],
                    'email' => $ownerData['email'],
                    'password' => Hash::make($ownerData['password'] ?? Str::random(16)),
                ]);
            }

            // 2. Create the Shop
            $shop = Shop::create([
                'owner_id' => $owner->id,
                'name' => $shopData['name'],
                'slug' => Str::slug($shopData['slug'] ?? $shopData['name']),
                'domain' => $shopData['domain'] ?? null,
                'status' => 'active',
            ]);

            // 3. Provision Default Roles for the Shop
            $managerRole = Role::create([
                'shop_id' => $shop->id,
                'name' => 'Manager',
                'is_custom' => false,
            ]);

            Role::create([
                'shop_id' => $shop->id,
                'name' => 'Worker',
                'is_custom' => false,
            ]);

            // 4. Provision default Subscription plan (Trial Plan)
            $plan = $planId ? Plan::find($planId) : Plan::where('price', 0)->first();

            if (! $plan) {
                // Fallback plan if none exists in db
                $plan = Plan::create([
                    'name' => 'Default Trial Plan',
                    'price' => 0.00,
                    'limits' => [
                        'max_products' => 100,
                        'max_images_per_product' => 2,
                        'max_employees' => 5,
                    ],
                ]);
            }

            Subscription::create([
                'shop_id' => $shop->id,
                'plan_id' => $plan->id,
                'status' => 'active',
                'starts_at' => now(),
                'ends_at' => now()->addMonth(),
            ]);

            // 5. Log Activity
            $this->logger->execute(
                'shop.created',
                "Shop '{$shop->name}' was successfully registered with owner {$owner->email}.",
                null,
                $shop->toArray(),
                $shop->id,
                $owner->id
            );

            return $shop;
        });
    }
}
