<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create 'owner' role since AuthController assigns it upon registration
        Role::create(['name' => 'owner']);
    }

    public function test_user_can_register()
    {
        $response = $this->postJson('/api/register', [
            'org_name' => 'Acme Corp',
            'name' => 'John Doe',
            'email' => 'john@gmail.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ], [
            'Referer' => 'http://localhost:5173',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'organization_id',
                    'organization' => [
                        'id',
                        'name',
                        'slug',
                    ]
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@gmail.com',
        ]);

        $this->assertDatabaseHas('organizations', [
            'name' => 'Acme Corp',
        ]);
    }

    public function test_user_can_login()
    {
        $org = Organization::create([
            'name' => 'Acme Corp',
            'slug' => 'acme-corp',
        ]);

        $user = User::create([
            'name' => 'John Doe',
            'email' => 'john@gmail.com',
            'password' => bcrypt('password123'),
            'organization_id' => $org->id,
        ]);
        $user->assignRole('owner');

        $response = $this->postJson('/api/login', [
            'email' => 'john@gmail.com',
            'password' => 'password123',
        ], [
            'Referer' => 'http://localhost:5173',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'organization_id',
                ]
            ]);
    }
}
