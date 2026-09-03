<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Attendance;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $member1;
    private User $member2;
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

        $this->owner = User::create([
            'name' => 'Owner Admin',
            'email' => 'owner@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);
        $this->owner->assignRole('owner');

        $this->member1 = User::create([
            'name' => 'Member One',
            'email' => 'member1@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);
        $this->member1->assignRole('member');

        $this->member2 = User::create([
            'name' => 'Member Two',
            'email' => 'member2@example.com',
            'password' => bcrypt('password'),
            'organization_id' => $this->org->id,
        ]);
        $this->member2->assignRole('member');
    }

    public function test_owner_can_mark_attendance_for_member(): void
    {
        $today = today()->toDateString();

        $response = $this->actingAs($this->owner)->postJson('/api/attendance', [
            'user_id' => $this->member1->id,
            'date' => $today,
            'status' => 'Present',
            'check_in' => '09:00 AM',
            'check_out' => '05:00 PM',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'Present');

        $this->assertDatabaseHas('attendances', [
            'user_id' => $this->member1->id,
            'date' => $today,
            'status' => 'Present',
            'check_in' => '09:00 AM',
            'check_out' => '05:00 PM',
        ]);
    }

    public function test_updating_existing_attendance_record_updates_without_duplicates(): void
    {
        $today = today()->toDateString();

        // Mark as Present first
        $res1 = $this->actingAs($this->owner)->postJson('/api/attendance', [
            'user_id' => $this->member1->id,
            'date' => $today,
            'status' => 'Present',
        ]);
        $res1->assertStatus(200);

        $this->assertDatabaseCount('attendances', 1);

        // Update same member & date to Absent
        $res2 = $this->actingAs($this->owner)->postJson('/api/attendance', [
            'user_id' => $this->member1->id,
            'date' => $today,
            'status' => 'Absent',
        ]);
        $res2->assertStatus(200);

        // Must still be only 1 record in database (no duplicates!)
        $this->assertDatabaseCount('attendances', 1);
        $this->assertDatabaseHas('attendances', [
            'user_id' => $this->member1->id,
            'date' => $today,
            'status' => 'Absent',
        ]);
    }

    public function test_attendance_works_generically_for_multiple_members_and_dates(): void
    {
        $d1 = '2026-09-01';
        $d2 = '2026-09-02';

        $res1 = $this->actingAs($this->owner)->postJson('/api/attendance', [
            'user_id' => $this->member1->id,
            'date' => $d1,
            'status' => 'Present',
        ]);
        $res1->assertStatus(200);

        $res2 = $this->actingAs($this->owner)->postJson('/api/attendance', [
            'user_id' => $this->member2->id,
            'date' => $d2,
            'status' => 'Late',
        ]);
        $res2->assertStatus(200);

        $this->assertDatabaseHas('attendances', [
            'user_id' => $this->member1->id,
            'date' => $d1,
            'status' => 'Present',
        ]);

        $this->assertDatabaseHas('attendances', [
            'user_id' => $this->member2->id,
            'date' => $d2,
            'status' => 'Late',
        ]);

        // Get daily attendance for d2
        $response = $this->actingAs($this->owner)->getJson("/api/attendance?date={$d2}");
        $response->assertStatus(200);
    }
}
