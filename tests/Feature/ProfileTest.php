<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Shop;
use App\Models\User;
use App\Modules\ShopManager\Actions\RegisterShopAction;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private Shop $shop;
    private User $owner;
    private User $employee;

    protected function setUp(): void
    {
        TenantManager::setTenant(null);

        parent::setUp();

        Storage::fake('public');

        $plan = Plan::create([
            'name' => 'Trial Plan',
            'price' => 0.00,
            'limits' => [
                'max_products' => 100,
                'max_images_per_product' => 5,
                'max_employees' => 5,
            ],
        ]);

        $registrar = resolve(RegisterShopAction::class);
        $this->shop = $registrar->execute(
            ['name' => 'Profile Shop', 'slug' => 'profile-shop'],
            ['name' => 'Profile Owner', 'email' => 'owner@profileshop.test', 'password' => 'password'],
            $plan->id,
            'active'
        );

        $this->owner = User::where('email', 'owner@profileshop.test')->first();

        $this->employee = User::create([
            'name' => 'Profile Staff',
            'email' => 'staff@profileshop.test',
            'password' => bcrypt('password'),
        ]);

        $workerRole = \App\Models\Role::where('shop_id', $this->shop->id)->where('name', 'Worker')->first();
        \DB::table('shop_user')->insert([
            'shop_id' => $this->shop->id,
            'user_id' => $this->employee->id,
            'role_id' => $workerRole->id,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_unauthenticated_user_cannot_access_profile(): void
    {
        $response = $this->getJson('/api/v1/profile');
        $response->assertStatus(401);
    }

    public function test_shop_owner_can_fetch_their_profile(): void
    {
        TenantManager::setTenant($this->shop);
        $response = $this->actingAs($this->owner)
            ->withHeaders(['X-Tenant-ID' => (string)$this->shop->id])
            ->getJson('/api/v1/profile');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Profile Owner')
            ->assertJsonPath('data.email', 'owner@profileshop.test')
            ->assertJsonPath('data.role', 'Owner');
    }

    public function test_shop_employee_can_fetch_their_profile(): void
    {
        TenantManager::setTenant($this->shop);
        $response = $this->actingAs($this->employee)
            ->withHeaders(['X-Tenant-ID' => (string)$this->shop->id])
            ->getJson('/api/v1/profile');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Profile Staff')
            ->assertJsonPath('data.email', 'staff@profileshop.test')
            ->assertJsonPath('data.role', 'Worker');
    }

    public function test_user_can_update_name_and_phone(): void
    {
        TenantManager::setTenant($this->shop);
        $response = $this->actingAs($this->employee)
            ->withHeaders(['X-Tenant-ID' => (string)$this->shop->id])
            ->putJson('/api/v1/profile', [
                'name' => 'Updated Staff Name',
                'phone' => '+15551234567',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Updated Staff Name')
            ->assertJsonPath('data.phone', '+15551234567');

        $this->assertDatabaseHas('users', [
            'id' => $this->employee->id,
            'name' => 'Updated Staff Name',
            'phone' => '+15551234567',
        ]);
    }

    public function test_profile_update_cannot_modify_protected_system_fields(): void
    {
        TenantManager::setTenant($this->shop);
        $response = $this->actingAs($this->employee)
            ->withHeaders(['X-Tenant-ID' => (string)$this->shop->id])
            ->putJson('/api/v1/profile', [
                'name' => 'Staff New Name',
                'email' => 'hacked@email.com',
                'is_platform_admin' => true,
                'status' => 'suspended',
                'role' => 'Owner',
            ]);

        $response->assertStatus(200);

        $this->employee->refresh();
        $this->assertEquals('Staff New Name', $this->employee->name);
        $this->assertEquals('staff@profileshop.test', $this->employee->email);
        $this->assertFalse((bool)$this->employee->is_platform_admin);
        $this->assertEquals('active', $this->employee->status);
    }

    public function test_can_upload_and_delete_profile_photo(): void
    {
        TenantManager::setTenant($this->shop);

        // 1. Upload initial photo
        $file1 = UploadedFile::fake()->image('avatar1.jpg');
        $uploadResponse = $this->actingAs($this->owner)
            ->withHeaders(['X-Tenant-ID' => (string)$this->shop->id])
            ->postJson('/api/v1/profile/avatar', [
                'avatar' => $file1,
            ]);

        $uploadResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->owner->refresh();
        $firstAvatarPath = $this->owner->avatar;
        $this->assertNotNull($firstAvatarPath);
        Storage::disk('public')->assertExists($firstAvatarPath);

        // 2. Upload replacement photo and verify old photo is deleted
        $file2 = UploadedFile::fake()->image('avatar2.png');
        $replaceResponse = $this->actingAs($this->owner)
            ->withHeaders(['X-Tenant-ID' => (string)$this->shop->id])
            ->postJson('/api/v1/profile/avatar', [
                'avatar' => $file2,
            ]);

        $replaceResponse->assertStatus(200);

        $this->owner->refresh();
        $secondAvatarPath = $this->owner->avatar;
        $this->assertNotNull($secondAvatarPath);
        $this->assertNotEquals($firstAvatarPath, $secondAvatarPath);

        Storage::disk('public')->assertMissing($firstAvatarPath);
        Storage::disk('public')->assertExists($secondAvatarPath);

        // 3. Remove photo
        $deleteResponse = $this->actingAs($this->owner)
            ->withHeaders(['X-Tenant-ID' => (string)$this->shop->id])
            ->deleteJson('/api/v1/profile/avatar');

        $deleteResponse->assertStatus(200)
            ->assertJsonPath('data.avatar', null);

        $this->owner->refresh();
        $this->assertNull($this->owner->avatar);
        Storage::disk('public')->assertMissing($secondAvatarPath);
    }

    public function test_shop_profile_web_route_loads_successfully(): void
    {
        $response = $this->actingAs($this->owner)
            ->get('/shop/' . $this->shop->slug . '/profile');

        $response->assertStatus(200)
            ->assertViewIs('shop');
    }
}
