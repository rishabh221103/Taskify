<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Project;
use App\Models\Section;
use App\Models\Task;
use App\Models\User;
use App\Notifications\ProjectAssigned;
use App\Notifications\ProjectDueReminder;
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

    public function test_project_assignment_notification_sent_to_multiple_members_on_creation()
    {
        Notification::fake();

        $userC = User::create([
            'name' => 'User C',
            'email' => 'c@gmail.com',
            'password' => bcrypt('password123'),
            'organization_id' => $this->org->id,
        ]);
        $userC->assignRole('member');

        $userD = User::create([
            'name' => 'User D',
            'email' => 'd@gmail.com',
            'password' => bcrypt('password123'),
            'organization_id' => $this->org->id,
        ]);
        $userD->assignRole('member');

        $response = $this->actingAs($this->userA)->postJson('/api/projects', [
            'name' => 'Multi-Member Project',
            'description' => 'A project for multiple members',
            'member_ids' => [$this->userB->id, $userC->id, $userD->id],
        ]);

        $response->assertStatus(201);

        Notification::assertSentTo($this->userB, ProjectAssigned::class);
        Notification::assertSentTo($userC, ProjectAssigned::class);
        Notification::assertSentTo($userD, ProjectAssigned::class);
    }

    public function test_project_reassignment_notification_sent_only_to_newly_added_members()
    {
        Notification::fake();

        $userC = User::create([
            'name' => 'User C',
            'email' => 'c2@gmail.com',
            'password' => bcrypt('password123'),
            'organization_id' => $this->org->id,
        ]);
        $userC->assignRole('member');

        $userD = User::create([
            'name' => 'User D',
            'email' => 'd2@gmail.com',
            'password' => bcrypt('password123'),
            'organization_id' => $this->org->id,
        ]);
        $userD->assignRole('member');

        $project = Project::create([
            'organization_id' => $this->org->id,
            'name' => 'Initial Team Project',
        ]);
        $project->users()->sync([$this->userB->id, $userC->id]);

        $response = $this->actingAs($this->userA)->putJson("/api/projects/{$project->id}", [
            'name' => 'Initial Team Project Updated',
            'member_ids' => [$this->userB->id, $userC->id, $userD->id],
        ]);

        $response->assertStatus(200);

        // Only newly added User D should get notified
        Notification::assertSentTo($userD, ProjectAssigned::class);
        Notification::assertNotSentTo($this->userB, ProjectAssigned::class);
        Notification::assertNotSentTo($userC, ProjectAssigned::class);
    }

    public function test_task_assignment_notification_sent_to_multiple_assignees()
    {
        Notification::fake();

        $userC = User::create([
            'name' => 'User C',
            'email' => 'c3@gmail.com',
            'password' => bcrypt('password123'),
            'organization_id' => $this->org->id,
        ]);
        $userC->assignRole('member');

        $response = $this->actingAs($this->userA)->postJson('/api/tasks', [
            'project_id' => $this->project->id,
            'section_id' => $this->section->id,
            'title' => 'Multi Assignee Task',
            'status' => 'todo',
            'assignee_ids' => [$this->userB->id, $userC->id],
        ]);

        $response->assertStatus(201);

        Notification::assertSentTo($this->userB, TaskAssigned::class);
        Notification::assertSentTo($userC, TaskAssigned::class);
    }

    public function test_send_project_due_reminders_command_sends_to_all_members_and_prevents_duplicates()
    {
        Notification::fake();

        $userC = User::create([
            'name' => 'User C',
            'email' => 'c4@gmail.com',
            'password' => bcrypt('password123'),
            'organization_id' => $this->org->id,
        ]);
        $userC->assignRole('member');

        // Project 1: Due tomorrow -> both userB and userC assigned -> both receive reminder
        $project1 = Project::create([
            'organization_id' => $this->org->id,
            'name' => 'Project Due Tomorrow',
            'deadline' => today()->addDay()->toDateString(),
            'status' => 'in_progress',
        ]);
        $project1->users()->sync([$this->userB->id, $userC->id]);

        // Project 2: Already completed -> should NOT get reminder
        $project2 = Project::create([
            'organization_id' => $this->org->id,
            'name' => 'Completed Project',
            'deadline' => today()->toDateString(),
            'status' => 'completed',
        ]);
        $project2->users()->sync([$this->userB->id]);

        // Run reminder command
        Artisan::call('app:send-task-due-reminders');

        // Verify notifications sent for project1 to userB and userC, not project2
        Notification::assertSentTo($this->userB, ProjectDueReminder::class, function ($notification) use ($project2) {
            return $notification->toArray($this->userB)['project_id'] !== $project2->id;
        });
        Notification::assertSentTo($userC, ProjectDueReminder::class);

        // Verify reminder_sent_at populated on project1, not project2
        $this->assertNotNull($project1->refresh()->reminder_sent_at);
        $this->assertNull($project2->refresh()->reminder_sent_at);

        // Run command a second time -> no notifications sent (duplicate check)
        Notification::fake();
        Artisan::call('app:send-task-due-reminders');
        Notification::assertNothingSent();
    }

    public function test_email_links_dynamically_use_frontend_url_from_configuration()
    {
        $customDomain = 'https://taskify.production.com';
        config(['app.frontend_url' => $customDomain]);

        // 1. MemberWelcome link
        $welcome = new \App\Notifications\MemberWelcome('tempPass123');
        $welcomeMail = $welcome->toMail($this->userB);
        $this->assertEquals($customDomain . '/login', $welcomeMail->actionUrl);

        // 2. ProjectAssigned link (member vs owner)
        $projectAssigned = new \App\Notifications\ProjectAssigned($this->project);
        $projectMailMember = $projectAssigned->toMail($this->userB);
        $this->assertEquals($customDomain . '/member/projects/' . $this->project->id, $projectMailMember->actionUrl);

        $projectMailOwner = $projectAssigned->toMail($this->userA);
        $this->assertEquals($customDomain . '/admin/projects/' . $this->project->id, $projectMailOwner->actionUrl);

        // 3. ProjectDueReminder link
        $projectReminder = new \App\Notifications\ProjectDueReminder($this->project);
        $projectReminderMail = $projectReminder->toMail($this->userB);
        $this->assertEquals($customDomain . '/member/projects/' . $this->project->id, $projectReminderMail->actionUrl);

        // 4. TaskAssigned link
        $task = Task::create([
            'organization_id' => $this->org->id,
            'project_id' => $this->project->id,
            'section_id' => $this->section->id,
            'title' => 'Test Url Task',
            'created_by' => $this->userA->id,
        ]);
        $taskAssigned = new \App\Notifications\TaskAssigned($task);
        $taskMailMember = $taskAssigned->toMail($this->userB);
        $this->assertEquals($customDomain . '/member/tasks', $taskMailMember->actionUrl);

        $taskMailOwner = $taskAssigned->toMail($this->userA);
        $this->assertEquals($customDomain . '/admin/projects/' . $this->project->id, $taskMailOwner->actionUrl);

        // 5. TaskDueReminder link
        $taskReminder = new \App\Notifications\TaskDueReminder($task);
        $taskReminderMail = $taskReminder->toMail($this->userB);
        $this->assertEquals($customDomain . '/member/tasks', $taskReminderMail->actionUrl);
    }
}
