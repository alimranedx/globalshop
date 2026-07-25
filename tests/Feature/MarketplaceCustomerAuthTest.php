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

    public function test_customer_can_fetch_their_orders()
    {
        $customer = MarketplaceCustomer::create([
            'name' => 'Order Tester',
            'phone' => '+8801700000000',
            'password' => Hash::make('secret123'),
            'verified_at' => now(),
        ]);

        $owner = \App\Models\User::create([
            'name' => 'Shop Owner',
            'email' => 'owner_orders@shop.com',
            'password' => Hash::make('password'),
        ]);

        $shop = \App\Models\Shop::create([
            'name' => 'Order Test Shop',
            'slug' => 'order-test-shop',
            'owner_id' => $owner->id,
        ]);

        $sale = \App\Models\Sale::create([
            'shop_id' => $shop->id,
            'invoice_number' => 'INV-TEST-12345',
            'marketplace_customer_id' => $customer->id,
            'customer_name' => 'Order Tester',
            'customer_phone' => '+8801700000000',
            'subtotal' => 100.00,
            'total' => 100.00,
            'payment_method' => 'cash',
            'status' => 'completed',
            'created_by' => $owner->id,
        ]);

        $this->withSession(['marketplace_customer_id' => $customer->id]);

        $response = $this->getJson('/api/v1/marketplace/orders');

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $response->assertJsonCount(1, 'orders');
        $response->assertJsonPath('orders.0.invoice_number', 'INV-TEST-12345');
    }

    public function test_customer_cannot_view_another_customers_order_details()
    {
        $customer1 = MarketplaceCustomer::create([
            'name' => 'Customer One',
            'phone' => '+8801711111111',
            'password' => Hash::make('secret123'),
            'verified_at' => now(),
        ]);

        $customer2 = MarketplaceCustomer::create([
            'name' => 'Customer Two',
            'phone' => '+8801722222222',
            'password' => Hash::make('secret123'),
            'verified_at' => now(),
        ]);

        $owner = \App\Models\User::create([
            'name' => 'Shop Owner Two',
            'email' => 'owner_two@shop.com',
            'password' => Hash::make('password'),
        ]);

        $shop = \App\Models\Shop::create([
            'name' => 'Security Test Shop',
            'slug' => 'security-test-shop',
            'owner_id' => $owner->id,
        ]);

        // Sale belonging ONLY to Customer 1
        $sale1 = \App\Models\Sale::create([
            'shop_id' => $shop->id,
            'invoice_number' => 'INV-CUST1-999',
            'marketplace_customer_id' => $customer1->id,
            'customer_name' => 'Customer One',
            'customer_phone' => '+8801711111111',
            'subtotal' => 50.00,
            'total' => 50.00,
            'payment_method' => 'cash',
            'status' => 'completed',
            'created_by' => $owner->id,
        ]);

        // Login as Customer 2
        $this->withSession(['marketplace_customer_id' => $customer2->id]);

        // Attempting to fetch Customer 1's order as Customer 2 must return 404 / Unauthorized
        $response = $this->getJson("/api/v1/marketplace/orders/{$sale1->id}");

        $response->assertStatus(404);
        $response->assertJson([
            'success' => false,
            'message' => 'Order not found or unauthorized access.',
        ]);
    }

    public function test_customer_can_download_their_order_receipt_pdf()
    {
        $customer = MarketplaceCustomer::create([
            'name' => 'PDF Customer',
            'phone' => '+8801755555555',
            'password' => Hash::make('secret123'),
            'verified_at' => now(),
        ]);

        $owner = \App\Models\User::create([
            'name' => 'PDF Owner',
            'email' => 'pdf_owner@shop.com',
            'password' => Hash::make('password'),
        ]);

        $shop = \App\Models\Shop::create([
            'name' => 'PDF Shop',
            'slug' => 'pdf-shop',
            'owner_id' => $owner->id,
        ]);

        $category = \App\Models\Category::create([
            'shop_id' => $shop->id,
            'name' => 'Laptops',
            'slug' => 'laptops',
        ]);

        $product = \App\Models\Product::create([
            'shop_id' => $shop->id,
            'category_id' => $category->id,
            'name' => 'Test Laptop',
            'slug' => 'test-laptop',
            'price' => 150.00,
            'stock_quantity' => 10,
            'created_by' => $owner->id,
        ]);

        $sale = \App\Models\Sale::create([
            'shop_id' => $shop->id,
            'invoice_number' => 'INV-PDF-10001',
            'marketplace_customer_id' => $customer->id,
            'customer_name' => 'PDF Customer',
            'customer_phone' => '+8801755555555',
            'subtotal' => 150.00,
            'total' => 150.00,
            'payment_method' => 'cash',
            'status' => 'completed',
            'created_by' => $owner->id,
        ]);

        \App\Models\SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'product_name' => 'Test Laptop',
            'quantity' => 1,
            'price' => 150.00,
            'total' => 150.00,
        ]);

        $this->withSession(['marketplace_customer_id' => $customer->id]);

        $response = $this->get("/api/v1/marketplace/orders/{$sale->id}/receipt");

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertStringContainsString('GlobalShop-Order-INV-PDF-10001-Receipt.pdf', $response->headers->get('content-disposition'));
    }

    public function test_customer_cannot_download_another_customers_order_receipt()
    {
        $customer1 = MarketplaceCustomer::create([
            'name' => 'Cust 1',
            'phone' => '+8801766666666',
            'password' => Hash::make('secret123'),
            'verified_at' => now(),
        ]);

        $customer2 = MarketplaceCustomer::create([
            'name' => 'Cust 2',
            'phone' => '+8801777777777',
            'password' => Hash::make('secret123'),
            'verified_at' => now(),
        ]);

        $owner = \App\Models\User::create([
            'name' => 'Owner X',
            'email' => 'owner_x@shop.com',
            'password' => Hash::make('password'),
        ]);

        $shop = \App\Models\Shop::create([
            'name' => 'Shop X',
            'slug' => 'shop-x',
            'owner_id' => $owner->id,
        ]);

        $sale1 = \App\Models\Sale::create([
            'shop_id' => $shop->id,
            'invoice_number' => 'INV-PRIV-888',
            'marketplace_customer_id' => $customer1->id,
            'customer_name' => 'Cust 1',
            'customer_phone' => '+8801766666666',
            'subtotal' => 99.00,
            'total' => 99.00,
            'payment_method' => 'cash',
            'status' => 'completed',
            'created_by' => $owner->id,
        ]);

        $this->withSession(['marketplace_customer_id' => $customer2->id]);

        $response = $this->getJson("/api/v1/marketplace/orders/{$sale1->id}/receipt");

        $response->assertStatus(404);
        $response->assertJson([
            'success' => false,
            'message' => 'Order not found or unauthorized access.',
        ]);
    }

    public function test_guest_can_access_login_and_register_pages_publicly()
    {
        // GET /login -> HTTP 200, view marketplace
        $responseLogin = $this->get('/login');
        $responseLogin->assertStatus(200);
        $responseLogin->assertViewIs('marketplace');

        // GET /register -> HTTP 200, view marketplace
        $responseRegister = $this->get('/register');
        $responseRegister->assertStatus(200);
        $responseRegister->assertViewIs('marketplace');
    }

    public function test_logged_in_marketplace_customer_is_redirected_away_from_login_and_register()
    {
        $customer = MarketplaceCustomer::create([
            'name' => 'Logged Customer',
            'phone' => '+8801999888777',
            'password' => Hash::make('secret'),
        ]);

        $this->withSession(['marketplace_customer_id' => $customer->id]);

        $responseLogin = $this->get('/login');
        $responseLogin->assertRedirect('/');

        $responseRegister = $this->get('/register');
        $responseRegister->assertRedirect('/');
    }
}
