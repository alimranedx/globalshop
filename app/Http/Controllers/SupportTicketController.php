<?php

namespace App\Http\Controllers;

use App\Models\MarketplaceCustomer;
use App\Models\Shop;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SupportTicketController extends Controller
{
    /**
     * Create a support ticket from public form (unauthenticated / login trouble).
     */
    public function createPublicTicket(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'user_type' => 'nullable|string|in:customer,shop_owner,shop_employee,guest',
            'category' => 'nullable|string|in:login_problem,password_reset,account_locked,account_suspended,email_change,shop_access_problem,employee_access_problem,permission_problem,other',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
            'shop_slug' => 'nullable|string',
            'device_info' => 'nullable|string',
        ]);

        $shopId = null;
        if (!empty($validated['shop_slug'])) {
            $shop = Shop::where('slug', $validated['shop_slug'])->first();
            $shopId = $shop?->id;
        }

        // Check if user or customer exists by email
        $user = User::where('email', $validated['email'])->first();
        $customer = MarketplaceCustomer::where('email', $validated['email'])
            ->orWhere('phone', $validated['phone'] ?? '')
            ->first();

        $ticket = SupportTicket::create([
            'ticket_number' => SupportTicket::generateTicketNumber(),
            'user_id' => $user?->id,
            'customer_id' => $customer?->id,
            'user_type' => $validated['user_type'] ?? ($customer ? 'customer' : ($user ? 'shop_owner' : 'guest')),
            'shop_id' => $shopId,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'category' => $validated['category'] ?? 'login_problem',
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'priority' => 'normal',
            'status' => 'open',
            'device_info' => $validated['device_info'] ?? $request->header('User-Agent'),
        ]);

        // Record initial message
        SupportTicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => $ticket->user_type === 'customer' ? 'customer' : 'shop_owner',
            'sender_id' => $user?->id ?? $customer?->id,
            'message' => $validated['message'],
            'message_type' => 'public_reply',
        ]);

        // Log notification from system sender noreply@globalshop.com
        Log::info("Support ticket created [sender: noreply@globalshop.com]: Ticket #{$ticket->ticket_number} for {$ticket->email}");

        return response()->json([
            'success' => true,
            'message' => 'Your support ticket has been created successfully.',
            'ticket_number' => $ticket->ticket_number,
            'data' => $ticket,
        ], 201);
    }

    /**
     * Create a support ticket for authenticated user.
     */
    public function createAuthTicket(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => 'required|string',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
            'priority' => 'nullable|string|in:low,normal,high,urgent',
            'shop_id' => 'nullable|integer',
        ]);

        $user = $request->user();
        $customer = null;

        if (!$user && session('marketplace_customer_id')) {
            $customer = MarketplaceCustomer::find(session('marketplace_customer_id'));
        }

        if (!$user && !$customer) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $userType = $customer ? 'customer' : ($user->ownedShops()->count() > 0 ? 'shop_owner' : 'shop_employee');

        $ticket = SupportTicket::create([
            'ticket_number' => SupportTicket::generateTicketNumber(),
            'user_id' => $user?->id,
            'customer_id' => $customer?->id,
            'user_type' => $userType,
            'shop_id' => $validated['shop_id'] ?? null,
            'name' => $user->name ?? $customer->name ?? 'User',
            'email' => $user->email ?? $customer->email ?? 'no-email',
            'phone' => $user->phone ?? $customer->phone ?? null,
            'category' => $validated['category'],
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'priority' => $validated['priority'] ?? 'normal',
            'status' => 'open',
            'device_info' => $request->header('User-Agent'),
        ]);

        SupportTicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => $userType,
            'sender_id' => $user?->id ?? $customer?->id,
            'message' => $validated['message'],
            'message_type' => 'public_reply',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Your ticket #{$ticket->ticket_number} has been created.",
            'ticket_number' => $ticket->ticket_number,
            'data' => $ticket,
        ], 201);
    }

    /**
     * Get user's own tickets.
     */
    public function getUserTickets(Request $request): JsonResponse
    {
        $user = $request->user();
        $customer = null;

        if (!$user && session('marketplace_customer_id')) {
            $customer = MarketplaceCustomer::find(session('marketplace_customer_id'));
        }

        if (!$user && !$customer) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $query = SupportTicket::with('shop');

        if ($customer) {
            $query->where('customer_id', $customer->id);
        } else {
            $query->where('user_id', $user->id);
        }

        $tickets = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $tickets,
        ]);
    }

    /**
     * Get details of a single user ticket (only public replies, NO internal notes!).
     */
    public function getUserTicketDetails(Request $request, string $idOrNumber): JsonResponse
    {
        $user = $request->user();
        $customer = null;

        if (!$user && session('marketplace_customer_id')) {
            $customer = MarketplaceCustomer::find(session('marketplace_customer_id'));
        }

        $ticket = SupportTicket::with(['shop', 'assignedAdmin'])
            ->where(function ($q) use ($idOrNumber) {
                $q->where('id', $idOrNumber)->orWhere('ticket_number', $idOrNumber);
            })->firstOrFail();

        // Enforce IDOR protection: only platform admin or ticket owner can access!
        $isOwner = ($customer && $ticket->customer_id === $customer->id) || ($user && $ticket->user_id === $user->id);
        $isAdmin = $user && $user->is_platform_admin;

        if (!$isOwner && !$isAdmin) {
            return response()->json(['success' => false, 'message' => 'Access denied.'], 403);
        }

        // Load ONLY public replies — internal notes are strictly filtered out!
        $messages = SupportTicketMessage::where('ticket_id', $ticket->id)
            ->where('message_type', 'public_reply')
            ->orderBy('created_at', 'asc')
            ->get();

        $ticket->public_messages = $messages;

        return response()->json([
            'success' => true,
            'data' => $ticket,
        ]);
    }

    /**
     * Post a user reply to an existing open ticket.
     */
    public function replyUserTicket(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string',
        ]);

        $user = $request->user();
        $customer = null;

        if (!$user && session('marketplace_customer_id')) {
            $customer = MarketplaceCustomer::find(session('marketplace_customer_id'));
        }

        $ticket = SupportTicket::findOrFail($id);

        if ($customer && $ticket->customer_id !== $customer->id) {
            return response()->json(['success' => false, 'message' => 'Access denied.'], 403);
        }
        if ($user && $ticket->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Access denied.'], 403);
        }

        $senderType = $customer ? 'customer' : ($user->ownedShops()->count() > 0 ? 'shop_owner' : 'shop_employee');

        $msg = SupportTicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => $senderType,
            'sender_id' => $user?->id ?? $customer?->id,
            'message' => $validated['message'],
            'message_type' => 'public_reply',
        ]);

        if ($ticket->status === 'resolved' || $ticket->status === 'closed') {
            $ticket->update(['status' => 'open']);
        } elseif ($ticket->status === 'waiting_for_customer') {
            $ticket->update(['status' => 'in_progress']);
        }

        return response()->json([
            'success' => true,
            'data' => $msg,
            'message' => 'Reply posted successfully.',
        ]);
    }
}
