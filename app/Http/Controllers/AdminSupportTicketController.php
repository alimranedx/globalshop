<?php

namespace App\Http\Controllers;

use App\Models\MarketplaceCustomer;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\User;
use App\Modules\AuditLog\Actions\LogActivityAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminSupportTicketController extends Controller
{
    protected LogActivityAction $logger;

    public function __construct(LogActivityAction $logger)
    {
        $this->logger = $logger;
    }

    /**
     * Get paginated platform support tickets with multi-filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = SupportTicket::with(['shop', 'assignedAdmin']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('user_type')) {
            $query->where('user_type', $request->input('user_type'));
        }

        if ($request->filled('shop_id')) {
            $query->where('shop_id', $request->input('shop_id'));
        }

        if ($request->filled('assigned_admin_id')) {
            $query->where('assigned_admin_id', $request->input('assigned_admin_id'));
        }

        $tickets = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $tickets,
            'counts' => [
                'total' => SupportTicket::count(),
                'open' => SupportTicket::where('status', 'open')->count(),
                'in_progress' => SupportTicket::where('status', 'in_progress')->count(),
                'waiting_for_customer' => SupportTicket::where('status', 'waiting_for_customer')->count(),
                'resolved' => SupportTicket::where('status', 'resolved')->count(),
            ],
        ]);
    }

    /**
     * Get detailed ticket info with full conversation thread & account investigation data.
     */
    public function show(SupportTicket $ticket): JsonResponse
    {
        $ticket->load(['shop', 'assignedAdmin', 'messages']);

        // Account investigation data for Admin
        $investigation = null;
        if ($ticket->user_id) {
            $user = User::with(['ownedShops', 'shops'])->find($ticket->user_id);
            if ($user) {
                $investigation = [
                    'account_found' => true,
                    'model' => 'User',
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'status' => $user->status ?? 'active',
                    'last_login_at' => $user->last_login_at?->toIso8601String(),
                    'owned_shops' => $user->ownedShops->map(fn($s) => ['id' => $s->id, 'name' => $s->name, 'slug' => $s->slug]),
                    'employee_shops' => $user->shops->map(fn($s) => ['id' => $s->id, 'name' => $s->name, 'role_name' => $s->pivot->role_id ? 'Role #' . $s->pivot->role_id : 'Staff', 'status' => $s->pivot->status]),
                ];
            }
        } elseif ($ticket->customer_id || $ticket->user_type === 'customer') {
            $customer = MarketplaceCustomer::where('id', $ticket->customer_id)
                ->orWhere('email', $ticket->email)
                ->orWhere('phone', $ticket->phone)
                ->first();
            if ($customer) {
                $investigation = [
                    'account_found' => true,
                    'model' => 'MarketplaceCustomer',
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'status' => $customer->status ?? 'active',
                    'verified_at' => $customer->verified_at?->toIso8601String(),
                    'last_login_at' => $customer->last_login_at?->toIso8601String(),
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'ticket' => $ticket,
                'investigation' => $investigation,
            ],
        ]);
    }

    /**
     * Reply to ticket (Public Reply or Internal Note).
     */
    public function reply(Request $request, SupportTicket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'message_type' => 'required|string|in:public_reply,internal_note',
            'status' => 'nullable|string|in:open,in_progress,waiting_for_customer,resolved,closed',
        ]);

        $admin = $request->user();

        $msg = SupportTicketMessage::create([
            'ticket_id' => $ticket->id,
            'sender_type' => 'admin',
            'sender_id' => $admin->id,
            'message' => $validated['message'],
            'message_type' => $validated['message_type'],
        ]);

        // Auto update status if provided or if public reply
        if (!empty($validated['status'])) {
            $ticket->status = $validated['status'];
            if ($validated['status'] === 'resolved') {
                $ticket->resolved_at = now();
            }
            $ticket->save();
        } elseif ($validated['message_type'] === 'public_reply' && $ticket->status === 'open') {
            $ticket->update(['status' => 'waiting_for_customer']);
        }

        // Send simulated email notification from sender noreply@globalshop.com to user
        if ($validated['message_type'] === 'public_reply') {
            Log::info("Notification sent [from: noreply@globalshop.com to {$ticket->email}]: Admin replied to ticket #{$ticket->ticket_number}");
        }

        $this->logger->execute(
            'support_ticket.replied',
            "Admin '{$admin->name}' posted a {$validated['message_type']} on ticket #{$ticket->ticket_number}.",
            null,
            ['ticket_id' => $ticket->id, 'type' => $validated['message_type']],
            $ticket->shop_id,
            $admin->id
        );

        return response()->json([
            'success' => true,
            'data' => $msg,
            'ticket' => $ticket->fresh(['assignedAdmin', 'shop', 'messages']),
            'message' => 'Reply posted successfully.',
        ]);
    }

    /**
     * Update ticket attributes (status, priority, assigned_admin_id).
     */
    public function updateStatus(Request $request, SupportTicket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'nullable|string|in:open,in_progress,waiting_for_customer,resolved,closed',
            'priority' => 'nullable|string|in:low,normal,high,urgent',
            'assigned_admin_id' => 'nullable|exists:users,id',
        ]);

        $oldValues = $ticket->toArray();
        $ticket->fill(array_filter($validated, fn($v) => $v !== null));

        if (isset($validated['status']) && $validated['status'] === 'resolved' && !$ticket->resolved_at) {
            $ticket->resolved_at = now();
            Log::info("Notification sent [from: noreply@globalshop.com to {$ticket->email}]: Your support ticket #{$ticket->ticket_number} has been resolved.");
        }

        $ticket->save();

        $this->logger->execute(
            'support_ticket.updated',
            "Ticket #{$ticket->ticket_number} attributes were updated by admin.",
            $oldValues,
            $ticket->toArray(),
            $ticket->shop_id,
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'data' => $ticket->fresh(['assignedAdmin', 'shop', 'messages']),
            'message' => 'Ticket updated successfully.',
        ]);
    }
}
