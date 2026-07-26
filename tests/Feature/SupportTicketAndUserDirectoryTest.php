<?php

namespace Tests\Feature;

use App\Models\MarketplaceCustomer;
use App\Models\Shop;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupportTicketAndUserDirectoryTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $shopOwner;
    protected MarketplaceCustomer $customer;
    protected Shop $shop;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@marketplace.com',
            'password' => 'password',
            'is_platform_admin' => true,
        ]);

        $this->shopOwner = User::create([
            'name' => 'Shop Owner',
            'email' => 'owner@testshop.com',
            'password' => 'password',
            'is_platform_admin' => false,
        ]);

        $this->shop = Shop::create([
            'owner_id' => $this->shopOwner->id,
            'name' => 'Test Shop',
            'slug' => 'test-shop',
        ]);

        $this->customer = MarketplaceCustomer::create([
            'name' => 'Alice Customer',
            'email' => 'alice@customer.com',
            'phone' => '+15550199',
            'password' => 'password',
            'verified_at' => now(),
        ]);
    }

    public function test_can_create_public_support_ticket_for_login_trouble(): void
    {
        $response = $this->postJson('/api/v1/support/tickets/public', [
            'name' => 'Troubled User',
            'email' => 'alice@customer.com',
            'phone' => '+15550199',
            'category' => 'login_problem',
            'subject' => 'Cannot log in to my account',
            'message' => 'I am using valid credentials but login fails.',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Your support ticket has been created successfully.',
            ]);

        $this->assertDatabaseHas('support_tickets', [
            'email' => 'alice@customer.com',
            'subject' => 'Cannot log in to my account',
            'category' => 'login_problem',
            'status' => 'open',
        ]);
    }

    public function test_admin_can_view_user_directories(): void
    {
        // Customers Directory
        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/v1/platform/directory/customers');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        // Shop Owners Directory
        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/v1/platform/directory/shop-owners');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_admin_can_reply_and_resolve_support_ticket(): void
    {
        $ticket = SupportTicket::create([
            'ticket_number' => SupportTicket::generateTicketNumber(),
            'customer_id' => $this->customer->id,
            'name' => $this->customer->name,
            'email' => $this->customer->email,
            'subject' => 'Password Reset Assistance',
            'message' => 'Please reset my password.',
            'category' => 'password_reset',
            'status' => 'open',
        ]);

        // Public reply
        $response = $this->actingAs($this->superAdmin)
            ->postJson("/api/v1/platform/support-tickets/{$ticket->id}/reply", [
                'message' => 'We have sent you a password reset link.',
                'message_type' => 'public_reply',
                'status' => 'resolved',
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('support_tickets', [
            'id' => $ticket->id,
            'status' => 'resolved',
        ]);

        $this->assertDatabaseHas('support_ticket_messages', [
            'ticket_id' => $ticket->id,
            'message_type' => 'public_reply',
            'message' => 'We have sent you a password reset link.',
        ]);
    }

    public function test_internal_notes_are_not_exposed_to_customer(): void
    {
        $ticket = SupportTicket::create([
            'ticket_number' => SupportTicket::generateTicketNumber(),
            'customer_id' => $this->customer->id,
            'name' => $this->customer->name,
            'email' => $this->customer->email,
            'subject' => 'Account Issue',
            'message' => 'Help me.',
            'category' => 'other',
            'status' => 'open',
        ]);

        // Add internal note by Admin
        $this->actingAs($this->superAdmin)
            ->postJson("/api/v1/platform/support-tickets/{$ticket->id}/reply", [
                'message' => 'Internal Note: Investigating fraud status.',
                'message_type' => 'internal_note',
            ]);

        // Customer views ticket details
        session(['marketplace_customer_id' => $this->customer->id]);

        $response = $this->getJson("/api/v1/support/tickets/{$ticket->id}");

        $response->assertStatus(200);
        $content = $response->getContent();

        $this->assertStringNotContainsString('Internal Note: Investigating fraud status.', $content);
    }
}
