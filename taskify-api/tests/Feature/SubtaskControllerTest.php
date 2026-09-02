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

class SubtaskControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Task $task;

    protected function setUp(): void
    {
        parent::setUp();

        Role::findOrCreate('owner');

        $org = Organization::create(['name' => 'Org A', 'slug' => 'org-a']);
        $this->user = User::create([
            'name' => 'User A',
            'email' => 'a@gmail.com',
            'password' => bcrypt('password123'),
            'organization_id' => $org->id,
        ]);
        $this->user->assignRole('owner');

        $project = Project::create([
            'organization_id' => $org->id,
            'name' => 'Project A',
        ]);

        $section = Section::create([
            'organization_id' => $org->id,
            'project_id' => $project->id,
            'name' => 'Section A',
        ]);

        $this->task = Task::create([
            'organization_id' => $org->id,
            'project_id' => $project->id,
            'section_id' => $section->id,
            'title' => 'Task A',
            'created_by' => $this->user->id,
        ]);
    }

    public function test_can_create_subtask_via_endpoint()
    {
        $response = $this->actingAs($this->user)->postJson("/api/tasks/{$this->task->id}/subtasks", [
            'title' => 'Endpoint Subtask 1',
            'done' => false,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Endpoint Subtask 1')
            ->assertJsonPath('data.done', false);

        $this->assertDatabaseHas('subtasks', [
            'task_id' => $this->task->id,
            'title' => 'Endpoint Subtask 1',
            'done' => false,
        ]);
    }

    public function test_can_update_subtask_via_endpoint()
    {
        $subtask = $this->task->subtasks()->create([
            'title' => 'Original Subtask',
            'done' => false,
        ]);

        $response = $this->actingAs($this->user)->patchJson("/api/subtasks/{$subtask->id}", [
            'title' => 'Updated Title',
            'done' => true,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.title', 'Updated Title')
            ->assertJsonPath('data.done', true);

        $this->assertDatabaseHas('subtasks', [
            'id' => $subtask->id,
            'title' => 'Updated Title',
            'done' => true,
        ]);
    }

    public function test_can_delete_subtask_via_endpoint()
    {
        $subtask = $this->task->subtasks()->create([
            'title' => 'Original Subtask',
            'done' => false,
        ]);

        $response = $this->actingAs($this->user)->deleteJson("/api/subtasks/{$subtask->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('subtasks', [
            'id' => $subtask->id,
        ]);
    }
}
