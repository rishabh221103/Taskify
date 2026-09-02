<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Ensure Spatie Roles exist
        $ownerRole = \Spatie\Permission\Models\Role::findOrCreate('owner');
        $memberRole = \Spatie\Permission\Models\Role::findOrCreate('member');

        // 2. Create Organization
        $org = \App\Models\Organization::create([
            'name' => 'Acme Corporation',
            'slug' => 'acme-corporation',
        ]);

        // 3. Create Owner User (1 User)
        $owner = User::create([
            'name' => 'Rishabh Pathak',
            'email' => 'rishabh.pathak@gmail.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'organization_id' => $org->id,
            'phone_number' => '+91 98101 23456',
            'created_at' => now()->subMonths(8),
        ]);
        $owner->assignRole($ownerRole);

        // 4. Create Members (4 Members)
        $member1 = User::create([
            'name' => 'Simran Sharma',
            'email' => 'simran.sharma@gmail.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'organization_id' => $org->id,
            'phone_number' => '+91 99555 12345',
            'created_at' => now()->subMonths(6),
        ]);
        $member1->assignRole($memberRole);

        $member2 = User::create([
            'name' => 'Dilip Baghel',
            'email' => 'dilipbaghel162@gmail.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'organization_id' => $org->id,
            'phone_number' => '+91 97777 98765',
            'created_at' => now()->subMonths(5),
        ]);
        $member2->assignRole($memberRole);

        $member3 = User::create([
            'name' => 'Pinky Patel',
            'email' => 'pinky.patel@gmail.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'organization_id' => $org->id,
            'phone_number' => '+91 96666 44444',
            'created_at' => now()->subMonths(3),
        ]);
        $member3->assignRole($memberRole);

        $member4 = User::create([
            'name' => 'Ram Pal',
            'email' => 'ram.pal@gmail.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'organization_id' => $org->id,
            'phone_number' => '+91 95555 77777',
            'created_at' => now()->subMonths(2),
        ]);
        $member4->assignRole($memberRole);

        // 5. Create Projects
        $project1 = \App\Models\Project::create([
            'organization_id' => $org->id,
            'name' => 'Website Design',
            'description' => 'Redesign the company main website pages and blog layout.',
            'status' => 'in_progress',
            'priority' => 'high',
            'deadline' => now()->addDays(30)->toDateString(),
            'manager_id' => $owner->id,
            'progress' => 65,
            'category' => 'Design',
        ]);
        $project1->users()->sync([$owner->id, $member1->id, $member2->id]);

        $project2 = \App\Models\Project::create([
            'organization_id' => $org->id,
            'name' => 'Mobile App',
            'description' => 'Develop the native Android and iOS mobile application.',
            'status' => 'in_progress',
            'priority' => 'high',
            'deadline' => now()->addDays(45)->toDateString(),
            'manager_id' => $member1->id,
            'progress' => 42,
            'category' => 'Development',
        ]);
        $project2->users()->sync([$member1->id, $member3->id, $member4->id]);

        $project3 = \App\Models\Project::create([
            'organization_id' => $org->id,
            'name' => 'Marketing Campaign',
            'description' => 'Plan and execute marketing outreach for product release.',
            'status' => 'completed',
            'priority' => 'medium',
            'deadline' => now()->addDays(15)->toDateString(),
            'manager_id' => $member3->id,
            'progress' => 100,
            'category' => 'Marketing',
        ]);
        $project3->users()->sync([$member3->id, $member2->id]);

        // 6. Create Sections for Website Design
        $sec1 = \App\Models\Section::create([
            'organization_id' => $org->id,
            'project_id' => $project1->id,
            'name' => 'Frontend',
            'order' => 1,
        ]);
        $sec2 = \App\Models\Section::create([
            'organization_id' => $org->id,
            'project_id' => $project1->id,
            'name' => 'Database',
            'order' => 2,
        ]);
        $sec3 = \App\Models\Section::create([
            'organization_id' => $org->id,
            'project_id' => $project1->id,
            'name' => 'Backend',
            'order' => 3,
        ]);

        // 7. Create Tasks
        // Task 1: Design system tokens v2
        $task1 = \App\Models\Task::create([
            'organization_id' => $org->id,
            'project_id' => $project1->id,
            'section_id' => $sec2->id,
            'title' => 'Design system tokens v2',
            'description' => 'Define design token mappings for typography, colors, and layout spacing.',
            'status' => 'done',
            'priority' => 'low',
            'due_date' => now()->addDays(9)->toDateString(),
            'created_by' => $owner->id,
        ]);
        $task1->assignees()->sync([$owner->id]);
        $task1->subtasks()->createMany([
            ['title' => 'Define color tokens', 'done' => true],
            ['title' => 'Define spacing tokens', 'done' => true],
            ['title' => 'Define typography scale', 'done' => true],
            ['title' => 'Review token names', 'done' => true],
            ['title' => 'Generate style json', 'done' => true],
            ['title' => 'Export assets', 'done' => true],
        ]);

        // Task 2: Design Landing Page
        $task2 = \App\Models\Task::create([
            'organization_id' => $org->id,
            'project_id' => $project1->id,
            'section_id' => $sec1->id,
            'title' => 'Design',
            'description' => 'Figma design drafts for main pages.',
            'status' => 'todo',
            'priority' => 'high',
            'due_date' => now()->addDays(15)->toDateString(),
            'created_by' => $owner->id,
        ]);
        $task2->assignees()->sync([$owner->id]);

        // Task 3: QC and Migration
        $task3 = \App\Models\Task::create([
            'organization_id' => $org->id,
            'project_id' => $project1->id,
            'section_id' => $sec3->id,
            'title' => 'QC and Migration',
            'description' => 'Perform quality control checks and database model migration.',
            'status' => 'in_progress',
            'priority' => 'medium',
            'due_date' => now()->addDays(10)->toDateString(),
            'created_by' => $owner->id,
        ]);
        $task3->assignees()->sync([$owner->id]);

        // Task 4: API rate-limit middleware
        $task4 = \App\Models\Task::create([
            'organization_id' => $org->id,
            'project_id' => $project2->id,
            'title' => 'API rate-limit middleware',
            'description' => 'Configure security middleware to prevent brute force attacks on endpoint paths.',
            'status' => 'in_progress',
            'priority' => 'high',
            'due_date' => now()->addDays(14)->toDateString(),
            'created_by' => $member1->id,
        ]);
        $task4->assignees()->sync([$member1->id]);
        $task4->subtasks()->createMany([
            ['title' => 'Setup rate limiter helper', 'done' => true],
            ['title' => 'Add request throttle checks', 'done' => true],
            ['title' => 'Integrate cache keying', 'done' => true],
            ['title' => 'Add custom error response', 'done' => false],
            ['title' => 'Write route unit tests', 'done' => false],
            ['title' => 'Stress test API routes', 'done' => false],
        ]);

        // Task 5: Accessibility pass on forms
        $task5 = \App\Models\Task::create([
            'organization_id' => $org->id,
            'project_id' => $project3->id,
            'title' => 'Accessibility pass on forms',
            'description' => 'Perform a WCAG accessibility review of the signup and login forms.',
            'status' => 'review',
            'priority' => 'medium',
            'due_date' => now()->addDays(13)->toDateString(),
            'created_by' => $member3->id,
        ]);
        $task5->assignees()->sync([$member2->id]);
        $task5->subtasks()->createMany([
            ['title' => 'Check ARIA labels', 'done' => true],
            ['title' => 'Verify keyboard navigation', 'done' => true],
            ['title' => 'Color contrast audit', 'done' => true],
            ['title' => 'Test with screen reader', 'done' => true],
            ['title' => 'Submit fixes patch', 'done' => true],
        ]);
    }
}
