<?php

namespace App\Modules\ShopManager\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Shop;
use App\Models\User;
use App\Models\Role;
use App\Modules\ShopManager\Requests\EasyLoginRequest;
use App\Modules\ShopManager\Services\EasyLoginService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

class EasyLoginController extends Controller
{
    /**
     * Display the easy login dashboard.
     */
    public function index(Request $request)
    {
        // 1. Build Union Query for Shop Owners & Employees
        $ownersQuery = DB::table('shops')
            ->join('users', 'users.id', '=', 'shops.owner_id')
            ->whereNull('shops.deleted_at')
            ->whereNull('users.deleted_at')
            ->select([
                'users.id as user_id', 
                'users.name as user_name', 
                'users.email as user_email', 
                'users.email_verified_at',
                'users.created_at as user_created_at',
                'shops.id as shop_id',
                'shops.name as shop_name',
                'shops.slug as shop_slug',
                'shops.status as shop_status',
                'shops.created_at as shop_created_at',
                DB::raw("'Owner' as role_name"),
                DB::raw("'active' as employee_status"),
                DB::raw('NULL as employee_id'),
            ]);

        $employeesQuery = DB::table('shop_user')
            ->join('shops', 'shops.id', '=', 'shop_user.shop_id')
            ->join('users', 'users.id', '=', 'shop_user.user_id')
            ->join('roles', 'roles.id', '=', 'shop_user.role_id')
            ->whereNull('shops.deleted_at')
            ->whereNull('users.deleted_at')
            ->select([
                'users.id as user_id', 
                'users.name as user_name', 
                'users.email as user_email', 
                'users.email_verified_at',
                'users.created_at as user_created_at',
                'shops.id as shop_id',
                'shops.name as shop_name',
                'shops.slug as shop_slug',
                'shops.status as shop_status',
                'shops.created_at as shop_created_at',
                'roles.name as role_name',
                'shop_user.status as employee_status',
                'shop_user.id as employee_id',
            ]);

        $unionQuery = $ownersQuery->union($employeesQuery);

        // 2. Wrap in an outer query for searches, filters, sorting and pagination
        $query = DB::table(DB::raw("({$unionQuery->toSql()}) as shop_users"))
            ->mergeBindings($unionQuery)
            ->select([
                'shop_users.*',
                DB::raw('(SELECT MAX(last_activity) FROM sessions WHERE sessions.user_id = shop_users.user_id) as last_login'),
            ]);

        // Apply Search
        if ($search = $request->input('search')) {
            $query->where(function($q) use ($search) {
                $q->where('user_name', 'like', "%{$search}%")
                  ->orWhere('user_email', 'like', "%{$search}%")
                  ->orWhere('shop_name', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        // Apply Filters
        if ($shopId = $request->input('shop')) {
            $query->where('shop_id', $shopId);
        }

        if ($role = $request->input('role')) {
            $query->where('role_name', $role);
        }

        if ($status = $request->input('status')) {
            switch ($status) {
                case 'active_shop':
                    $query->where('shop_status', 'active');
                    break;
                case 'suspended_shop':
                    $query->where('shop_status', 'suspended');
                    break;
                case 'pending_shop':
                    $query->where('shop_status', 'pending');
                    break;
                case 'active_user':
                    $query->where('employee_status', 'active');
                    break;
                case 'pending_user':
                    $query->where('employee_status', 'pending');
                    break;
            }
        }

        if ($planId = $request->input('subscription')) {
            $query->whereExists(function($q) use ($planId) {
                $q->select(DB::raw(1))
                  ->from('subscriptions')
                  ->whereColumn('subscriptions.shop_id', '=', 'shop_users.shop_id')
                  ->where('subscriptions.status', '=', 'active')
                  ->where('subscriptions.plan_id', '=', $planId);
            });
        }

        if ($emailVerified = $request->input('email_verified')) {
            if ($emailVerified === 'verified') {
                $query->whereNotNull('email_verified_at');
            } else {
                $query->whereNull('email_verified_at');
            }
        }

        // Apply Sorting
        $sortBy = $request->input('sort_by', 'user_name');
        $sortDir = $request->input('sort_dir', 'asc') === 'desc' ? 'desc' : 'asc';
        
        $allowedSorts = [
            'name' => 'user_name',
            'email' => 'user_email',
            'role' => 'role_name',
            'last_login' => 'last_login',
            'created_at' => 'user_created_at',
        ];
        
        $sortColumn = $allowedSorts[$sortBy] ?? 'user_name';
        $query->orderBy($sortColumn, $sortDir);

        // Paginate results
        $paginatedUsers = $query->paginate(20)->withQueryString();

        // 3. Load Shop details and stats for the paginated items
        $shopIds = collect($paginatedUsers->items())->pluck('shop_id')->unique();
        
        $shops = Shop::with(['owner', 'activeSubscription.plan'])
            ->whereIn('id', $shopIds)
            ->get()
            ->keyBy('id');

        // Load employees statistics per shop
        $stats = DB::table('shop_user')
            ->whereIn('shop_id', $shopIds)
            ->select('shop_id', 'status', DB::raw('count(*) as count'))
            ->groupBy('shop_id', 'status')
            ->get()
            ->groupBy('shop_id');

        $shopDetails = [];
        foreach ($shops as $id => $shop) {
            $shopStats = $stats->get($id) ?? collect();
            $activeCount = $shopStats->where('status', 'active')->first()?->count ?? 0;
            $pendingCount = $shopStats->where('status', 'pending')->first()?->count ?? 0;
            $totalCount = $activeCount + $pendingCount;

            $shopDetails[$id] = [
                'shop' => $shop,
                'owner_name' => $shop->owner->name ?? 'Unknown',
                'plan_name' => $shop->activeSubscription->plan->name ?? 'Free',
                'total_employees' => $totalCount,
                'active_employees' => $activeCount,
                'pending_employees' => $pendingCount,
            ];
        }

        // 4. Load filter dropdown options
        $filterShops = Shop::orderBy('name')->get(['id', 'name']);
        $filterPlans = Plan::where('is_active', true)->get(['id', 'name']);
        $filterRoles = Role::distinct()->pluck('name')->merge(['Owner'])->unique()->sort()->values();

        return view('shop.easy-login', [
            'paginatedUsers' => $paginatedUsers,
            'groupedUsers' => collect($paginatedUsers->items())->groupBy('shop_id'),
            'shopDetails' => $shopDetails,
            'filterShops' => $filterShops,
            'filterPlans' => $filterPlans,
            'filterRoles' => $filterRoles,
            'currentFilters' => $request->only(['search', 'shop', 'role', 'status', 'subscription', 'email_verified', 'sort_by', 'sort_dir', 'view']),
        ]);
    }

    /**
     * Perform one-click easy login.
     */
    public function login(EasyLoginRequest $request, EasyLoginService $service)
    {
        $shop = Shop::findOrFail($request->validated('shop_id'));
        $user = User::findOrFail($request->validated('user_id'));

        try {
            $service->authenticate($request, $shop, $user);
            return redirect()->route('shop.panel', ['any' => 'dashboard']);
        } catch (Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
