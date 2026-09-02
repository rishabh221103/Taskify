<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Project;
use App\Models\Section;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MultiTenantTest extends TestCase
{
    use RefreshDatabase;

    private User $userA;
    private User $userB;
    private Organization $orgA;
    private Organization $orgB;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup Roles
        Role::findOrCreate('owner');
        Role::findOrCreate('member');

        // Setup Organizations
        $this->orgA = Organization::create(['name' => 'Org A', 'slug' => 'org-a']);
        $this->orgB = Organization::create(['name' => 'Org B', 'slug' => 'org-b']);

        // Setup Users
        $this->userA = User::create([
            'name' => 'User A',
            'email' => 'a@gmail.com',
            'password' => bcrypt('password123'),
            'organization_id' => $this->orgA->id,
        ]);
        $this->userA->assignRole('owner');

        $this->userB = User::create([
            'name' => 'User B',
            'email' => 'b@gmail.com',
            'password' => bcrypt('password123'),
            'organization_id' => $this->orgB->id,
        ]);
        $this->userB->assignRole('owner');
    }

    public function test_projects_are_scoped_by_organization()
    {
        // Create projects for Org A and Org B
        $projectA = Project::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Project A',
        ]);

        $projectB = Project::create([
            'organization_id' => $this->orgB->id,
            'name' => 'Project B',
        ]);

        // Authenticate as User A and request projects index
        $response = $this->actingAs($this->userA)->getJson('/api/projects');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Project A');

        // Attempting to view Org B's project as User A should 404
        $responseShow = $this->actingAs($this->userA)->getJson("/api/projects/{$projectB->id}");
        $responseShow->assertStatus(404);
    }

    public function test_creating_project_automatically_assigns_organization_id()
    {
        $response = $this->actingAs($this->userA)->postJson('/api/projects', [
            'name' => 'New Tenant Project',
            'status' => 'in_progress',
        ]);

        $response->assertStatus(201);
        
        $project = Project::latest()->first();
        $this->assertEquals($this->orgA->id, $project->organization_id);
    }

    public function test_sections_and_nested_routes()
    {
        $project = Project::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Project A',
        ]);

        // Create section nested route
        $response = $this->actingAs($this->userA)->postJson("/api/projects/{$project->id}/sections", [
            'name' => 'To Do Section',
            'order' => 1,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'To Do Section');

        $section = Section::latest()->first();
        $this->assertEquals($this->orgA->id, $section->organization_id);

        // Update Section
        $responseUpdate = $this->actingAs($this->userA)->patchJson("/api/sections/{$section->id}", [
            'name' => 'In Progress Section',
        ]);
        $responseUpdate->assertStatus(200)
            ->assertJsonPath('data.name', 'In Progress Section');

        // Delete Section
        $responseDelete = $this->actingAs($this->userA)->deleteJson("/api/sections/{$section->id}");
        $responseDelete->assertStatus(200);
        $this->assertDatabaseMissing('sections', ['id' => $section->id]);
    }

    public function test_tasks_and_subtasks_lifecycle_with_filtering()
    {
        $project = Project::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Project A',
        ]);

        $section = Section::create([
            'organization_id' => $this->orgA->id,
            'project_id' => $project->id,
            'name' => 'Backlog',
        ]);

        // Create Task
        $response = $this->actingAs($this->userA)->postJson('/api/tasks', [
            'project_id' => $project->id,
            'section_id' => $section->id,
            'title' => 'Important Task',
            'status' => 'todo',
            'subtasks' => [
                ['title' => 'Subtask 1'],
                ['title' => 'Subtask 2', 'done' => true],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Important Task')
            ->assertJsonCount(2, 'data.subtasks');

        $task = Task::latest()->first();
        $this->assertEquals($this->orgA->id, $task->organization_id);
        $this->assertEquals($this->userA->id, $task->created_by);

        // Update Task and Sync Subtasks
        $subtasks = $task->subtasks()->get();
        $responseUpdate = $this->actingAs($this->userA)->patchJson("/api/tasks/{$task->id}", [
            'title' => 'Updated Task Title',
            'subtasks' => [
                ['id' => $subtasks[0]->id, 'title' => 'Subtask 1 Modified', 'done' => true],
                ['title' => 'New Subtask 3'],
            ],
        ]);

        $responseUpdate->assertStatus(200)
            ->assertJsonPath('data.title', 'Updated Task Title')
            ->assertJsonCount(2, 'data.subtasks'); // Subtask 2 deleted, 1 modified, 3 created

        // Move Task (Drag and Drop)
        $newSection = Section::create([
            'organization_id' => $this->orgA->id,
            'project_id' => $project->id,
            'name' => 'Active board',
        ]);

        $responseMove = $this->actingAs($this->userA)->patchJson("/api/tasks/{$task->id}/move", [
            'section_id' => $newSection->id,
            'status' => 'in_progress',
        ]);

        $responseMove->assertStatus(200)
            ->assertJsonPath('data.section_id', $newSection->id)
            ->assertJsonPath('data.status', 'in_progress');
    }

    public function test_members_list_and_invite()
    {
        // Fetch members list
        $responseIndex = $this->actingAs($this->userA)->getJson('/api/members');
        $responseIndex->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'a@gmail.com');

        // Invite new member
        $responseInvite = $this->actingAs($this->userA)->postJson('/api/members/invite', [
            'name' => 'Invited Colleague',
            'email' => 'colleague@gmail.com',
            'title' => 'Developer',
        ]);

        $responseInvite->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email'],
            ]);

        $newUser = User::where('email', 'colleague@gmail.com')->first();
        $this->assertNotNull($newUser);
        $this->assertEquals($this->orgA->id, $newUser->organization_id);
        $this->assertTrue($newUser->hasRole('member'));
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('password123', $newUser->password));
    }
}
