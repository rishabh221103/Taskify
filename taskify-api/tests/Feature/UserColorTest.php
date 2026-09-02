<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserColorTest extends TestCase
{
    use RefreshDatabase;

    private Organization $org;

    protected function setUp(): void
    {
        parent::setUp();
        Role::findOrCreate('owner');
        Role::findOrCreate('member');

        $this->org = Organization::create([
            'name' => 'Acme Corp',
            'slug' => 'acme-corp',
        ]);
    }

    public function test_newly_created_users_receive_unique_colors(): void
    {
        $u1 = User::create([
            'name' => 'User One',
            'email' => 'user1@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);

        $u2 = User::create([
            'name' => 'User Two',
            'email' => 'user2@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);

        $u3 = User::create([
            'name' => 'User Three',
            'email' => 'user3@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);

        $this->assertNotEmpty($u1->color);
        $this->assertNotEmpty($u2->color);
        $this->assertNotEmpty($u3->color);

        $this->assertNotEquals($u1->color, $u2->color);
        $this->assertNotEquals($u2->color, $u3->color);
        $this->assertNotEquals($u1->color, $u3->color);
    }

    public function test_colors_are_unique_even_with_many_users(): void
    {
        $colors = [];
        for ($i = 0; $i < 25; $i++) {
            $user = User::create([
                'name' => "Team Member {$i}",
                'email' => "member{$i}@example.com",
                'password' => bcrypt('password'),
                'organization_id' => $this->org->id,
            ]);
            $colors[] = strtoupper($user->color);
        }

        // All 25 colors must be distinct!
        $this->assertCount(25, array_unique($colors));
    }

    public function test_user_resource_includes_color(): void
    {
        $user = User::create([
            'name' => 'Owner Admin',
            'email' => 'owner@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);
        $user->assignRole('owner');

        $user->refresh();

        $response = $this->actingAs($user)->getJson('/api/user');
        $response->assertStatus(200)
            ->assertJsonPath('user.color', $user->color);
    }
}
