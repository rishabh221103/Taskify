<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TeamMemberTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected Organization $org;

    protected function setUp(): void
    {
        parent::setUp();

        Role::findOrCreate('owner');
        Role::findOrCreate('member');

        $this->org = Organization::create([
            'name' => 'Tech Corp',
            'slug' => 'tech-corp',
        ]);

        $this->owner = User::create([
            'name' => 'Owner User',
            'email' => 'owner@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);
        $this->owner->assignRole('owner');
    }

    public function test_user_has_unique_id_in_users_table(): void
    {
        $this->assertNotNull($this->owner->unique_id);
        $this->assertStringStartsWith('MEM-', $this->owner->unique_id);

        $this->actingAs($this->owner);

        $response = $this->postJson('/api/members/invite', [
            'name' => 'Alice Member',
            'email' => 'alice@example.com',
            'title' => 'Developer',
            'phone_number' => '+91 98765 11111',
        ]);

        $response->assertStatus(201);
        $this->assertNotNull($response->json('user.unique_id'));
        $this->assertStringStartsWith('MEM-', $response->json('user.unique_id'));

        $this->assertDatabaseHas('users', [
            'email' => 'alice@example.com',
            'name' => 'Alice Member',
            'title' => 'Developer',
            'unique_id' => $response->json('user.unique_id'),
            'organization_id' => $this->org->id,
        ]);
    }
}
