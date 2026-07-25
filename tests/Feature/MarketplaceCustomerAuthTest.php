<?php

namespace Tests\Feature;

use App\Models\MarketplaceCustomer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MarketplaceCustomerAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_register_with_name_phone_and_password()
    {
        $payload = [
            'name' => 'John Customer',
            'phone' => '+8801711223344',
            'password' => 'password123',
            'confirm_password' => 'password123',
        ];

        $response = $this->postJson('/api/v1/marketplace/register', $payload);

        $response->assertStatus(201);
        $response->assertJson([
            'success' => true,
            'message' => 'Account created successfully.',
        ]);
        $response->assertJsonPath('customer.name', 'John Customer');
        $response->assertJsonPath('customer.phone', '+8801711223344');

        $this->assertDatabaseHas('marketplace_customers', [
            'name' => 'John Customer',
            'phone' => '+8801711223344',
        ]);
    }

    public function test_registration_validates_required_fields_and_password_confirmation()
    {
        $payload = [
            'name' => '',
            'phone' => '123',
            'password' => '123',
            'confirm_password' => 'differing',
        ];

        $response = $this->postJson('/api/v1/marketplace/register', $payload);

        $response->assertStatus(422);
        $response->assertJson(['success' => false]);
    }

    public function test_customer_can_login_with_phone_and_password()
    {
        $customer = MarketplaceCustomer::create([
            'name' => 'Alice Customer',
            'phone' => '+8801800000000',
            'password' => Hash::make('secret123'),
            'verified_at' => now(),
        ]);

        $payload = [
            'phone' => '+8801800000000',
            'password' => 'secret123',
        ];

        $response = $this->postJson('/api/v1/marketplace/login', $payload);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Logged in successfully.',
        ]);
        $response->assertJsonPath('customer.phone', '+8801800000000');
    }

    public function test_login_fails_with_invalid_credentials()
    {
        MarketplaceCustomer::create([
            'name' => 'Alice Customer',
            'phone' => '+8801800000000',
            'password' => Hash::make('secret123'),
            'verified_at' => now(),
        ]);

        $payload = [
            'phone' => '+8801800000000',
            'password' => 'wrongpassword',
        ];

        $response = $this->postJson('/api/v1/marketplace/login', $payload);

        $response->assertStatus(422);
        $response->assertJson([
            'success' => false,
            'message' => 'Invalid phone number or password.',
        ]);
    }

    public function test_customer_can_update_profile_info()
    {
        $customer = MarketplaceCustomer::create([
            'name' => 'Original Name',
            'phone' => '+8801999999999',
            'password' => Hash::make('secret123'),
            'verified_at' => now(),
        ]);

        $this->withSession(['marketplace_customer_id' => $customer->id]);

        $payload = [
            'name' => 'Updated Profile Name',
            'phone' => '+8801999999999',
            'shipping_address' => 'House 42, Road 11, Gulshan 1, Dhaka',
            'avatar' => 'https://example.com/avatar.jpg',
        ];

        $response = $this->postJson('/api/v1/marketplace/profile', $payload);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Profile updated successfully.',
        ]);
        $response->assertJsonPath('customer.name', 'Updated Profile Name');
        $response->assertJsonPath('customer.shipping_address', 'House 42, Road 11, Gulshan 1, Dhaka');
        $response->assertJsonPath('customer.avatar', 'https://example.com/avatar.jpg');

        $this->assertDatabaseHas('marketplace_customers', [
            'id' => $customer->id,
            'name' => 'Updated Profile Name',
            'shipping_address' => 'House 42, Road 11, Gulshan 1, Dhaka',
            'avatar' => 'https://example.com/avatar.jpg',
        ]);
    }
}
