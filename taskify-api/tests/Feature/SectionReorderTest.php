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

class SectionReorderTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $member;
    protected Organization $org;
    protected Project $project;

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

        $this->project = Project::create([
            'name' => 'Website Redesign',
            'organization_id' => $this->org->id,
            'status' => 'in_progress',
            'priority' => 'high',
        ]);
    }

    public function test_owner_can_reorder_sections(): void
    {
        $this->actingAs($this->owner);

        $sec1 = Section::create([
            'name' => 'To Do',
            'project_id' => $this->project->id,
            'organization_id' => $this->org->id,
            'order' => 0,
        ]);

        $sec2 = Section::create([
            'name' => 'In Progress',
            'project_id' => $this->project->id,
            'organization_id' => $this->org->id,
            'order' => 1,
        ]);

        $sec3 = Section::create([
            'name' => 'Review',
            'project_id' => $this->project->id,
            'organization_id' => $this->org->id,
            'order' => 2,
        ]);

        // Attach tasks to sec3 and sec1
        $task1 = Task::create([
            'title' => 'Task in Review',
            'project_id' => $this->project->id,
            'organization_id' => $this->org->id,
            'section_id' => $sec3->id,
            'created_by' => $this->owner->id,
            'status' => 'todo',
            'priority' => 'medium',
        ]);

        // Reorder: Move sec3 (Review) to first position [sec3, sec1, sec2]
        $response = $this->patchJson("/api/projects/{$this->project->id}/sections/reorder", [
            'section_ids' => [$sec3->id, $sec1->id, $sec2->id],
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['message', 'sections']);

        // Verify order in database
        $this->assertEquals(0, $sec3->fresh()->order);
        $this->assertEquals(1, $sec1->fresh()->order);
        $this->assertEquals(2, $sec2->fresh()->order);

        // Verify Project fetching respects order ASC
        $projResponse = $this->getJson("/api/projects/{$this->project->id}");
        $projResponse->assertStatus(200);
        $sections = $projResponse->json('data.sections');
        $this->assertCount(3, $sections);
        $this->assertEquals($sec3->id, $sections[0]['id']);
        $this->assertEquals($sec1->id, $sections[1]['id']);
        $this->assertEquals($sec2->id, $sections[2]['id']);

        // Verify task still belongs to sec3
        $this->assertEquals($sec3->id, $task1->fresh()->section_id);
    }

    public function test_member_cannot_reorder_sections(): void
    {
        $this->actingAs($this->member);

        $sec1 = Section::create([
            'name' => 'To Do',
            'project_id' => $this->project->id,
            'organization_id' => $this->org->id,
            'order' => 0,
        ]);

        $sec2 = Section::create([
            'name' => 'Done',
            'project_id' => $this->project->id,
            'organization_id' => $this->org->id,
            'order' => 1,
        ]);

        $response = $this->patchJson("/api/projects/{$this->project->id}/sections/reorder", [
            'section_ids' => [$sec2->id, $sec1->id],
        ]);

        $response->assertStatus(403);
    }
}
