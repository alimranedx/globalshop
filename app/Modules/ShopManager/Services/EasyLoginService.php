<?php

namespace App\Modules\ShopManager\Services;

use App\Models\Shop;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Exception;

class EasyLoginService
{
    /**
     * Authenticate the selected user for the given shop.
     *
     * @param Request $request
     * @param Shop $shop
     * @param User $user
     * @throws Exception
     */
    public function authenticate(Request $request, Shop $shop, User $user): void
    {
        // 1. Verify eligibility
        if ($shop->status !== 'active') {
            throw new Exception("Cannot log in: This shop is currently {$shop->status}.");
        }

        if ($shop->owner_id === $user->id) {
            // Owner is eligible if the shop is active
            $roleName = 'Owner';
        } else {
            // Check employee status
            $employee = DB::table('shop_user')
                ->join('roles', 'shop_user.role_id', '=', 'roles.id')
                ->where('shop_user.shop_id', $shop->id)
                ->where('shop_user.user_id', $user->id)
                ->select('shop_user.status', 'roles.name as role_name')
                ->first();

            if (!$employee) {
                throw new Exception("Cannot log in: User is not associated with this shop.");
            }

            if ($employee->status !== 'active') {
                throw new Exception("Cannot log in: User account is currently {$employee->status}.");
            }

            $roleName = $employee->role_name;
        }

        // 2. Terminate existing session
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // 3. Authenticate target user
        Auth::login($user);
        
        // 4. Regenerate session ID and map tenant
        $request->session()->regenerate();
        session(['mock_active_tenant_id' => $shop->id]);

        // 5. Store toast notification message for React SPA
        session(['easy_login_toast' => "Successfully logged in as {$user->name} ({$shop->name})"]);
    }
}
