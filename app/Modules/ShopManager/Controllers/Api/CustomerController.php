<?php

namespace App\Modules\ShopManager\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Modules\ShopManager\TenantManager;
use App\Modules\AuditLog\Actions\LogActivityAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    protected LogActivityAction $logger;

    public function __construct(LogActivityAction $logger)
    {
        $this->logger = $logger;
    }

    /**
     * List all customers with pagination and filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'No active tenant.'], 403);
        }

        $query = Customer::where('shop_id', $shop->id)
            ->withCount('sales')
            ->orderBy('created_at', 'desc');

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('membership_number', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $customers = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $customers,
        ]);
    }

    /**
     * Get a specific customer.
     */
    public function show(Customer $customer): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop || $customer->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Customer not found.'], 404);
        }

        $customer->load(['sales' => function ($q) {
            $q->orderBy('created_at', 'desc')->take(10);
        }]);

        return response()->json([
            'success' => true,
            'data' => $customer,
        ]);
    }

    /**
     * Store a new customer.
     */
    public function store(Request $request): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'No active tenant.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|min:11|max:13|unique:customers,phone,NULL,id,shop_id,' . $shop->id,
            'email' => 'nullable|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $customer = Customer::create([
            'shop_id' => $shop->id,
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'membership_number' => 'MEM-' . strtoupper(Str::random(6)),
            'store_credit_balance' => 0.00,
        ]);

        $this->logger->execute(
            'customer.created',
            "Customer {$customer->name} created.",
            null,
            ['customer_id' => $customer->id, 'name' => $customer->name],
            $shop->id,
            auth()->id()
        );

        return response()->json([
            'success' => true,
            'message' => 'Customer created successfully.',
            'data' => $customer,
        ], 201);
    }

    /**
     * Update an existing customer.
     */
    public function update(Request $request, Customer $customer): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop || $customer->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Customer not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|min:11|max:13|unique:customers,phone,' . $customer->id . ',id,shop_id,' . $shop->id,
            'email' => 'nullable|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $customer->update([
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
        ]);

        $this->logger->execute(
            'customer.updated',
            "Customer {$customer->name} profile updated.",
            null,
            ['customer_id' => $customer->id, 'name' => $customer->name],
            $shop->id,
            auth()->id()
        );

        return response()->json([
            'success' => true,
            'message' => 'Customer updated successfully.',
            'data' => $customer,
        ]);
    }

    /**
     * Update store credit for a customer.
     */
    public function updateCredit(Request $request, Customer $customer): JsonResponse
    {
        $shop = TenantManager::getTenant();
        if (!$shop || $customer->shop_id !== $shop->id) {
            return response()->json(['success' => false, 'message' => 'Customer not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'type' => 'required|in:add,deduct',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $amount = round((float)$request->amount, 2);
        $type = $request->type;
        $reason = $request->reason;
        
        $oldBalance = $customer->store_credit_balance;

        if ($type === 'add') {
            $customer->increment('store_credit_balance', $amount);
            $actionStr = 'Added';
        } else {
            if ($customer->store_credit_balance < $amount) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot deduct {$amount}. Current balance is {$customer->store_credit_balance}.",
                ], 422);
            }
            $customer->decrement('store_credit_balance', $amount);
            $actionStr = 'Deducted';
        }

        $customer->refresh();

        $this->logger->execute(
            'customer.credit_adjusted',
            "{$actionStr} $" . number_format($amount, 2) . " store credit for {$customer->name}. Reason: {$reason}.",
            null,
            [
                'customer_id' => $customer->id,
                'amount' => $amount,
                'type' => $type,
                'reason' => $reason,
                'old_balance' => $oldBalance,
                'new_balance' => $customer->store_credit_balance
            ],
            $shop->id,
            auth()->id()
        );

        return response()->json([
            'success' => true,
            'message' => 'Store credit updated successfully.',
            'data' => $customer,
        ]);
    }
}
