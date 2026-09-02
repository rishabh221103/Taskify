<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoleSeparationTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $member;
    protected Organization $org;

    protected function setUp(): void
    {
        parent::setUp();

        $ownerRole = Role::findOrCreate('owner');
        $memberRole = Role::findOrCreate('member');

        $this->org = Organization::create([
            'name' => 'Acme Corp',
            'slug' => 'acme-corp',
        ]);

        $this->owner = User::create([
            'name' => 'Owner User',
            'email' => 'owner@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);
        $this->owner->assignRole($ownerRole);

        $this->member = User::create([
            'name' => 'Member User',
            'email' => 'member@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);
        $this->member->assignRole($memberRole);
    }

    public function test_owner_can_access_admin_endpoints(): void
    {
        $this->actingAs($this->owner);

        $responseMembers = $this->getJson('/api/members');
        $responseMembers->assertStatus(200);

        $responseProjects = $this->getJson('/api/projects');
        $responseProjects->assertStatus(200);

        $responseTasks = $this->getJson('/api/tasks');
        $responseTasks->assertStatus(200);

        $responseDashboard = $this->getJson('/api/dashboard/summary');
        $responseDashboard->assertStatus(200);
    }

    public function test_member_is_forbidden_from_admin_endpoints(): void
    {
        $this->actingAs($this->member);

        $responseMembers = $this->getJson('/api/members');
        $responseMembers->assertStatus(403);
        $responseMembers->assertJson(['message' => 'Forbidden. This endpoint requires Owner/Admin privileges.']);

        $responseProjects = $this->getJson('/api/projects');
        $responseProjects->assertStatus(403);

        $responseTasks = $this->getJson('/api/tasks');
        $responseTasks->assertStatus(403);

        $responseDashboard = $this->getJson('/api/dashboard/summary');
        $responseDashboard->assertStatus(403);
    }

    public function test_member_can_access_member_scoped_endpoints(): void
    {
        $this->actingAs($this->member);

        $responseDashboard = $this->getJson('/api/member/dashboard');
        $responseDashboard->assertStatus(200);
        $responseDashboard->assertJsonStructure(['stats', 'upcoming_tasks']);

        $responseTasks = $this->getJson('/api/member/tasks');
        $responseTasks->assertStatus(200);

        $responseProjects = $this->getJson('/api/member/projects');
        $responseProjects->assertStatus(200);
    }

    public function test_member_projects_endpoint_scopes_assigned_projects_only(): void
    {
        // Setup Member X, Member Y, Member Z
        $memberX = User::create([
            'name' => 'Member X',
            'email' => 'x@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);
        $memberY = User::create([
            'name' => 'Member Y',
            'email' => 'y@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);
        $memberZ = User::create([
            'name' => 'Member Z',
            'email' => 'z@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);

        // Owner creates Project A assigned to Member X, Project B assigned to Member Y
        $projectA = Project::create([
            'organization_id' => $this->org->id,
            'name' => 'Project A',
        ]);
        $projectA->users()->sync([$memberX->id]);

        $projectB = Project::create([
            'organization_id' => $this->org->id,
            'name' => 'Project B',
        ]);
        $projectB->users()->sync([$memberY->id]);

        // Member X sees ONLY Project A
        $resX = $this->actingAs($memberX)->getJson('/api/member/projects');
        $resX->assertStatus(200)
             ->assertJsonCount(1, 'data')
             ->assertJsonPath('data.0.id', $projectA->id);

        // Member Y sees ONLY Project B
        $resY = $this->actingAs($memberY)->getJson('/api/member/projects');
        $resY->assertStatus(200)
             ->assertJsonCount(1, 'data')
             ->assertJsonPath('data.0.id', $projectB->id);

        // Member Z sees NO projects
        $resZ = $this->actingAs($memberZ)->getJson('/api/member/projects');
        $resZ->assertStatus(200)
             ->assertJsonCount(0, 'data');

        // Owner reassigns Project A to Member Z
        $this->actingAs($this->owner)->putJson("/api/projects/{$projectA->id}", [
            'name' => 'Project A',
            'member_ids' => [$memberZ->id],
        ])->assertStatus(200);

        // Member X now sees 0 projects
        $resXAfter = $this->actingAs($memberX)->getJson('/api/member/projects');
        $resXAfter->assertStatus(200)->assertJsonCount(0, 'data');

        // Member Z now sees Project A
        $resZAfter = $this->actingAs($memberZ)->getJson('/api/member/projects');
        $resZAfter->assertStatus(200)->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $projectA->id);
    }
}
