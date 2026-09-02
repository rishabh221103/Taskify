<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TaskCommentTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $member;
    private Organization $org;
    private Project $project;
    private Task $task;

    protected function setUp(): void
    {
        parent::setUp();

        Role::findOrCreate('owner');
        Role::findOrCreate('member');

        $this->org = Organization::create([
            'name' => 'Acme Corp',
            'slug' => 'acme-corp',
        ]);

        $this->owner = User::create([
            'name' => 'Owner Admin',
            'email' => 'owner@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);
        $this->owner->assignRole('owner');

        $this->member = User::create([
            'name' => 'Member One',
            'email' => 'member1@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);
        $this->member->assignRole('member');

        $this->project = Project::create([
            'organization_id' => $this->org->id,
            'name' => 'Sprint Project',
            'description' => 'Test project',
            'status' => 'in_progress',
        ]);

        $this->task = Task::create([
            'organization_id' => $this->org->id,
            'project_id' => $this->project->id,
            'title' => 'Implement Auth Middleware',
            'description' => 'Add rate limiting',
            'status' => 'in_progress',
            'priority' => 'high',
            'created_by' => $this->owner->id,
        ]);

        $this->task->assignees()->attach($this->member->id);
    }

    public function test_member_can_add_comment_and_owner_sees_it(): void
    {
        // 1. Member adds comment
        $responseMember = $this->actingAs($this->member)->postJson("/api/tasks/{$this->task->id}/comments", [
            'body' => 'I have finished setting up the rate limiting rules.',
        ]);

        $responseMember->assertStatus(201)
            ->assertJsonPath('data.body', 'I have finished setting up the rate limiting rules.');

        $this->assertDatabaseHas('task_comments', [
            'task_id' => $this->task->id,
            'user_id' => $this->member->id,
            'body' => 'I have finished setting up the rate limiting rules.',
        ]);

        // 2. Owner fetches task details and sees member comment
        $responseOwner = $this->actingAs($this->owner)->getJson("/api/tasks/{$this->task->id}");
        $responseOwner->assertStatus(200)
            ->assertJsonPath('data.comments.0.body', 'I have finished setting up the rate limiting rules.')
            ->assertJsonPath('data.comments.0.author_name', 'Member One');

        // 3. Owner replies to task
        $responseReply = $this->actingAs($this->owner)->postJson("/api/tasks/{$this->task->id}/comments", [
            'body' => 'Great work! Merging to main branch now.',
        ]);
        $responseReply->assertStatus(201);

        // 4. Member fetches their task list and sees both comments
        $responseMemberFetch = $this->actingAs($this->member)->getJson('/api/member/tasks');
        $responseMemberFetch->assertStatus(200)
            ->assertJsonPath('data.0.comments.1.body', 'Great work! Merging to main branch now.')
            ->assertJsonPath('data.0.comments.1.author_name', 'Owner Admin');
    }

    public function test_newly_created_member_can_comment_and_sync_with_admin(): void
    {
        // Create brand new member
        $newMember = User::create([
            'name' => 'Newly Created Member',
            'email' => 'newmember@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);
        $newMember->assignRole('member');

        $this->task->assignees()->attach($newMember->id);

        // New member comments
        $response = $this->actingAs($newMember)->postJson("/api/tasks/{$this->task->id}/comments", [
            'body' => 'Hello from newly invited member!',
        ]);

        $response->assertStatus(201);

        // Owner sees new member comment
        $responseOwner = $this->actingAs($this->owner)->getJson("/api/tasks/{$this->task->id}");
        $responseOwner->assertStatus(200)
            ->assertJsonPath('data.comments.0.body', 'Hello from newly invited member!')
            ->assertJsonPath('data.comments.0.author_name', 'Newly Created Member');
    }

    public function test_unassigned_member_cannot_comment_on_task(): void
    {
        $unassignedMember = User::create([
            'name' => 'Unassigned Member',
            'email' => 'unassigned@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);
        $unassignedMember->assignRole('member');

        $response = $this->actingAs($unassignedMember)->postJson("/api/tasks/{$this->task->id}/comments", [
            'body' => 'Illegal comment attempt',
        ]);

        $response->assertStatus(403);
    }
}
