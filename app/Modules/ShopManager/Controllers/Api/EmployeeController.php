<?php

namespace App\Modules\ShopManager\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Modules\AuditLog\Actions\LogActivityAction;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    protected LogActivityAction $logger;

    public function __construct(LogActivityAction $logger)
    {
        $this->logger = $logger;
    }

    /**
     * List all employees in the active tenant shop.
     */
    public function index(): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'No active tenant.'], 403);
        }

        // Get employees with role details
        $employees = DB::table('shop_user')
            ->join('users', 'shop_user.user_id', '=', 'users.id')
            ->join('roles', 'shop_user.role_id', '=', 'roles.id')
            ->where('shop_user.shop_id', $shop->id)
            ->select('users.id', 'users.name', 'users.email', 'roles.name as role_name', 'roles.id as role_id')
            ->get()
            ->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'email' => $emp->email,
                    'role_name' => $emp->role_name,
                    'role_id' => $emp->role_id,
                ];
            });

        // Prepend owner
        $owner = $shop->owner;
        $list = collect([
            [
                'id' => $owner->id,
                'name' => $owner->name,
                'email' => $owner->email,
                'role_name' => 'Owner',
                'role_id' => null,
            ]
        ])->concat($employees);

        $roles = Role::where('shop_id', $shop->id)->get(['id', 'name']);

        return response()->json([
            'success' => true,
            'data' => $list,
            'roles' => $roles,
        ]);
    }

    /**
     * Add a new employee to the shop.
     */
    public function store(Request $request): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'No active tenant.'], 403);
        }

        // Check if employee quota has been reached
        $maxEmployees = TenantManager::getLimit('max_employees', 5);
        $currentCount = DB::table('shop_user')->where('shop_id', $shop->id)->count();

        if ($currentCount >= $maxEmployees) {
            return response()->json([
                'success' => false,
                'message' => "Employee limit reached. Your subscription plan allows a maximum of {$maxEmployees} employees.",
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        $role = Role::where('shop_id', $shop->id)->where('id', $request->role_id)->first();
        if (!$role) {
            return response()->json(['success' => false, 'message' => 'Selected role does not belong to this shop.'], 422);
        }

        // Create or find user
        $user = User::where('email', $request->email)->first();
        if ($user) {
            // Check if user is already associated with this shop
            $exists = DB::table('shop_user')->where('shop_id', $shop->id)->where('user_id', $user->id)->exists();
            if ($exists || $shop->owner_id === $user->id) {
                return response()->json(['success' => false, 'message' => 'This user is already part of the shop.'], 422);
            }
        } else {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);
        }

        DB::table('shop_user')->insert([
            'shop_id' => $shop->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->logger->execute(
            'employee.created',
            "Employee '{$user->name}' was added with role {$role->name}.",
            null,
            ['user_id' => $user->id, 'role' => $role->name],
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Employee added successfully.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role_name' => $role->name,
                'role_id' => $role->id,
            ]
        ], 201);
    }

    /**
     * Update an employee's details (name, email, password, role).
     */
    public function update(Request $request, User $employee): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'No active tenant.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'role_id'  => 'required|exists:roles,id',
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email,' . $employee->id,
            'password' => 'nullable|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $role = Role::where('shop_id', $shop->id)->where('id', $request->role_id)->first();
        if (!$role) {
            return response()->json(['success' => false, 'message' => 'Selected role does not belong to this shop.'], 422);
        }

        $shopUser = DB::table('shop_user')->where('shop_id', $shop->id)->where('user_id', $employee->id)->first();
        if (!$shopUser) {
            return response()->json(['success' => false, 'message' => 'Employee not found in this shop.'], 404);
        }

        // Build update payload for User
        $userUpdate = [
            'name'  => $request->name,
            'email' => $request->email,
        ];
        if ($request->filled('password')) {
            $userUpdate['password'] = Hash::make($request->password);
        }
        $employee->update($userUpdate);

        // Update role in pivot
        DB::table('shop_user')
            ->where('shop_id', $shop->id)
            ->where('user_id', $employee->id)
            ->update(['role_id' => $role->id, 'updated_at' => now()]);

        $this->logger->execute(
            'employee.updated',
            "Employee '{$employee->name}' profile was updated (role: {$role->name}).",
            ['role_id' => $shopUser->role_id],
            ['role_id' => $role->id],
            $shop->id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Employee updated successfully.',
            'data'    => [
                'id'        => $employee->id,
                'name'      => $employee->name,
                'email'     => $employee->email,
                'role_name' => $role->name,
                'role_id'   => $role->id,
            ]
        ]);
    }

    /**
     * Remove an employee from the shop.
     */
    public function destroy(User $employee): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'No active tenant.'], 403);
        }

        $shopUser = DB::table('shop_user')->where('shop_id', $shop->id)->where('user_id', $employee->id)->first();
        if (!$shopUser) {
            return response()->json(['success' => false, 'message' => 'Employee not found in this shop.'], 404);
        }

        DB::table('shop_user')->where('shop_id', $shop->id)->where('user_id', $employee->id)->delete();

        $this->logger->execute(
            'employee.deleted',
            "Employee '{$employee->name}' was removed from the shop.",
            null,
            null,
            $shop->id,
            auth()->id()
        );

        return response()->json([
            'success' => true,
            'message' => 'Employee removed successfully.'
        ]);
    }
}
