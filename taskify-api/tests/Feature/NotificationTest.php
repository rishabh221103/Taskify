<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Project;
use App\Models\Section;
use App\Models\Task;
use App\Models\User;
use App\Notifications\ProjectAssigned;
use App\Notifications\TaskAssigned;
use App\Notifications\TaskDueReminder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $userA;
    private User $userB;
    private Organization $org;
    private Project $project;
    private Section $section;

    protected function setUp(): void
    {
        parent::setUp();

        Role::findOrCreate('owner');
        Role::findOrCreate('member');

        $this->org = Organization::create(['name' => 'Org A', 'slug' => 'org-a']);
        
        $this->userA = User::create([
            'name' => 'User A',
            'email' => 'a@gmail.com',
            'password' => bcrypt('password123'),
            'organization_id' => $this->org->id,
        ]);
        $this->userA->assignRole('owner');

        $this->userB = User::create([
            'name' => 'User B',
            'email' => 'b@gmail.com',
            'password' => bcrypt('password123'),
            'organization_id' => $this->org->id,
        ]);
        $this->userB->assignRole('member');

        $this->project = Project::create([
            'organization_id' => $this->org->id,
            'name' => 'Project A',
            'manager_id' => $this->userA->id,
        ]);

        $this->section = Section::create([
            'organization_id' => $this->org->id,
            'project_id' => $this->project->id,
            'name' => 'Backlog',
        ]);
    }

    public function test_task_assignment_notification_sent_on_creation()
    {
        Notification::fake();

        $response = $this->actingAs($this->userA)->postJson('/api/tasks', [
            'project_id' => $this->project->id,
            'section_id' => $this->section->id,
            'title' => 'Assigned Task',
            'status' => 'todo',
            'assignee_ids' => [$this->userB->id],
        ]);

        $response->assertStatus(201);

        Notification::assertSentTo($this->userB, TaskAssigned::class);
    }

    public function test_task_reassignment_notification_sent_only_to_new_assignee()
    {
        Notification::fake();

        $task = Task::create([
            'organization_id' => $this->org->id,
            'project_id' => $this->project->id,
            'section_id' => $this->section->id,
            'title' => 'Reassigned Task',
            'created_by' => $this->userA->id,
        ]);
        $task->assignees()->sync([$this->userA->id]);

        $response = $this->actingAs($this->userA)->putJson("/api/tasks/{$task->id}", [
            'title' => 'Reassigned Task Updated',
            'project_id' => $this->project->id,
            'assignee_ids' => [$this->userA->id, $this->userB->id],
        ]);

        $response->assertStatus(200);

        // Only User B should get notified since User A was already assigned
        Notification::assertSentTo($this->userB, TaskAssigned::class);
        Notification::assertNotSentTo($this->userA, TaskAssigned::class);
    }

    public function test_project_manager_notification_sent_on_creation()
    {
        Notification::fake();

        $response = $this->actingAs($this->userA)->postJson('/api/projects', [
            'name' => 'Brand New Project',
            'manager_id' => $this->userB->id,
        ]);

        $response->assertStatus(201);

        Notification::assertSentTo($this->userB, ProjectAssigned::class);
    }

    public function test_project_manager_notification_sent_only_on_manager_change()
    {
        Notification::fake();

        // Project created with userA as manager
        $project = Project::create([
            'organization_id' => $this->org->id,
            'name' => 'Manager Change Project',
            'manager_id' => $this->userA->id,
        ]);

        // Scenario 1: Update name only -> no notification sent
        $response1 = $this->actingAs($this->userA)->putJson("/api/projects/{$project->id}", [
            'name' => 'Manager Change Project Updated',
            'manager_id' => $this->userA->id,
        ]);
        $response1->assertStatus(200);
        Notification::assertNothingSent();

        // Scenario 2: Reassign manager to User B -> notification sent
        $response2 = $this->actingAs($this->userA)->putJson("/api/projects/{$project->id}", [
            'name' => 'Manager Change Project Updated',
            'manager_id' => $this->userB->id,
        ]);
        $response2->assertStatus(200);
        Notification::assertSentTo($this->userB, ProjectAssigned::class);
    }

    public function test_send_task_due_reminders_command_sends_emails_and_prevents_duplicates()
    {
        Notification::fake();

        // Task 1: Due tomorrow -> Should get a reminder
        $task1 = Task::create([
            'organization_id' => $this->org->id,
            'project_id' => $this->project->id,
            'title' => 'Due Tomorrow Task',
            'due_date' => today()->addDay()->toDateString(),
            'created_by' => $this->userA->id,
            'status' => 'todo',
        ]);
        $task1->assignees()->sync([$this->userB->id]);

        // Task 2: Due today -> Should get a reminder
        $task2 = Task::create([
            'organization_id' => $this->org->id,
            'project_id' => $this->project->id,
            'title' => 'Due Today Task',
            'due_date' => today()->toDateString(),
            'created_by' => $this->userA->id,
            'status' => 'in_progress',
        ]);
        $task2->assignees()->sync([$this->userB->id]);

        // Task 3: Already completed -> Should NOT get a reminder
        $task3 = Task::create([
            'organization_id' => $this->org->id,
            'project_id' => $this->project->id,
            'title' => 'Completed Task',
            'due_date' => today()->toDateString(),
            'created_by' => $this->userA->id,
            'status' => 'done',
        ]);
        $task3->assignees()->sync([$this->userB->id]);

        // Run the command
        Artisan::call('app:send-task-due-reminders');

        // Verify notifications sent to userB for task1 and task2, but not task3
        Notification::assertSentTo($this->userB, TaskDueReminder::class, function ($notification) use ($task3) {
            return $notification->toMail($this->userB)->subject !== 'Task Due Reminder: ' . $task3->title;
        });

        // Check reminder_sent_at timestamps are filled
        $this->assertNotNull($task1->refresh()->reminder_sent_at);
        $this->assertNotNull($task2->refresh()->reminder_sent_at);
        $this->assertNull($task3->refresh()->reminder_sent_at);

        // Run command a second time -> no notifications should be sent (duplicate check)
        Notification::fake();
        Artisan::call('app:send-task-due-reminders');
        Notification::assertNothingSent();
    }

    public function test_member_welcome_notification_sent_on_member_creation()
    {
        Notification::fake();

        $response = $this->actingAs($this->userA)->postJson('/api/members/invite', [
            'name' => 'New Team Member',
            'email' => 'newmember@gmail.com',
            'title' => 'Developer',
        ]);

        $response->assertStatus(201);

        $newMember = User::where('email', 'newmember@gmail.com')->first();
        $this->assertNotNull($newMember);

        Notification::assertSentTo($newMember, \App\Notifications\MemberWelcome::class);
    }
}
