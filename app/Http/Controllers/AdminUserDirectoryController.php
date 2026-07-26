<?php

namespace App\Http\Controllers;

use App\Models\MarketplaceCustomer;
use App\Models\Shop;
use App\Models\User;
use App\Modules\AuditLog\Actions\LogActivityAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AdminUserDirectoryController extends Controller
{
    protected LogActivityAction $logger;

    public function __construct(LogActivityAction $logger)
    {
        $this->logger = $logger;
    }

    /**
     * Get Marketplace Customers Directory.
     */
    public function getCustomers(Request $request): JsonResponse
    {
        $query = MarketplaceCustomer::with('preferredShops');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $customers = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $customers,
        ]);
    }

    /**
     * Get Shop Owners Directory.
     */
    public function getShopOwners(Request $request): JsonResponse
    {
        $query = User::has('ownedShops')->with('ownedShops');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $owners = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $owners,
        ]);
    }

    /**
     * Get Shop Employees Directory.
     */
    public function getEmployees(Request $request): JsonResponse
    {
        $query = User::has('shops')->with(['shops' => function ($q) {
            $q->withPivot('role_id', 'status');
        }]);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $employees = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $employees,
        ]);
    }

    /**
     * Activate / Suspend / Deactivate a Marketplace Customer.
     */
    public function updateCustomerStatus(Request $request, MarketplaceCustomer $customer): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:active,suspended,deactivated',
        ]);

        $customer->update(['status' => $validated['status']]);

        $this->logger->execute(
            'customer.status_updated',
            "Marketplace customer '{$customer->name}' status changed to {$validated['status']}.",
            null,
            ['customer_id' => $customer->id, 'status' => $validated['status']],
            null,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'data' => $customer,
            'message' => "Customer status updated to {$validated['status']}.",
        ]);
    }

    /**
     * Activate / Suspend / Deactivate a Platform User (Owner/Employee).
     */
    public function updateUserStatus(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:active,suspended,deactivated',
        ]);

        $user->update(['status' => $validated['status']]);

        $this->logger->execute(
            'user.status_updated',
            "User '{$user->name}' status changed to {$validated['status']}.",
            null,
            ['user_id' => $user->id, 'status' => $validated['status']],
            null,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => "User status updated to {$validated['status']}.",
        ]);
    }

    /**
     * Trigger secure password reset link or set new password for User.
     */
    public function resetUserPassword(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|string|in:send_link,set_password',
            'new_password' => 'required_if:action,set_password|nullable|string|min:6',
        ]);

        if ($validated['action'] === 'set_password') {
            $user->update(['password' => Hash::make($validated['new_password'])]);
            $msg = "Password for user '{$user->name}' was reset successfully.";
        } else {
            // Trigger simulated password reset email from sender noreply@globalshop.com
            $token = Str::random(60);
            Log::info("Password Reset Link sent [from: noreply@globalshop.com to {$user->email}]: Token: {$token}");
            $msg = "Password reset link has been sent to {$user->email}.";
        }

        $this->logger->execute(
            'user.password_reset',
            "Password reset performed for user '{$user->name}' by admin.",
            null,
            ['user_id' => $user->id, 'action' => $validated['action']],
            null,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'message' => $msg,
        ]);
    }

    /**
     * Trigger secure password reset link or set new password for Marketplace Customer.
     */
    public function resetCustomerPassword(Request $request, MarketplaceCustomer $customer): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|string|in:send_link,set_password',
            'new_password' => 'required_if:action,set_password|nullable|string|min:6',
        ]);

        if ($validated['action'] === 'set_password') {
            $customer->update(['password' => Hash::make($validated['new_password'])]);
            $msg = "Password for customer '{$customer->name}' was reset successfully.";
        } else {
            $token = Str::random(60);
            Log::info("Password Reset Link sent [from: noreply@globalshop.com to {$customer->email}]: Token: {$token}");
            $msg = "Password reset link has been sent to customer.";
        }

        $this->logger->execute(
            'customer.password_reset',
            "Password reset performed for customer '{$customer->name}' by admin.",
            null,
            ['customer_id' => $customer->id, 'action' => $validated['action']],
            null,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'message' => $msg,
        ]);
    }
}
