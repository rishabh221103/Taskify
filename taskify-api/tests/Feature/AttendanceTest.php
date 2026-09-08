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

    public function test_member_can_mark_their_own_attendance(): void
    {
        $today = today()->toDateString();

        $response = $this->actingAs($this->member1)->postJson('/api/my-attendance', [
            'status' => 'Present',
            'check_in' => '09:15 AM',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'Present')
            ->assertJsonPath('data.user_id', $this->member1->id)
            ->assertJsonPath('data.check_in', '09:15 AM');

        $this->assertDatabaseHas('attendances', [
            'user_id' => $this->member1->id,
            'date' => $today,
            'status' => 'Present',
            'check_in' => '09:15 AM',
        ]);
    }

    public function test_member_marking_attendance_again_updates_without_duplicates(): void
    {
        $today = today()->toDateString();

        // First check in
        $res1 = $this->actingAs($this->member1)->postJson('/api/my-attendance', [
            'status' => 'Present',
            'check_in' => '09:00 AM',
        ]);
        $res1->assertStatus(200);

        // Later check out
        $res2 = $this->actingAs($this->member1)->postJson('/api/my-attendance', [
            'status' => 'Present',
            'check_out' => '05:00 PM',
        ]);
        $res2->assertStatus(200);

        $this->assertDatabaseCount('attendances', 1);
        $this->assertDatabaseHas('attendances', [
            'user_id' => $this->member1->id,
            'date' => $today,
            'check_in' => '09:00 AM',
            'check_out' => '05:00 PM',
            'status' => 'Present',
            'hours' => '8h 00m',
        ]);
    }

    public function test_member_cannot_mark_attendance_for_another_user_via_my_attendance(): void
    {
        // member1 attempts to pass user_id of member2
        $response = $this->actingAs($this->member1)->postJson('/api/my-attendance', [
            'user_id' => $this->member2->id,
            'status' => 'Present',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_member_cannot_mark_attendance_for_another_user_via_admin_attendance_endpoint(): void
    {
        $today = today()->toDateString();

        // member1 attempts to tamper with member2's attendance via /api/attendance
        $response = $this->actingAs($this->member1)->postJson('/api/attendance', [
            'user_id' => $this->member2->id,
            'date' => $today,
            'status' => 'Absent',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_member_can_view_own_attendance_history(): void
    {
        $today = today()->toDateString();

        // Create attendance for member1
        Attendance::create([
            'organization_id' => $this->org->id,
            'user_id' => $this->member1->id,
            'date' => $today,
            'status' => 'Present',
            'check_in' => '09:00 AM',
            'check_out' => '05:00 PM',
            'hours' => '8h 00m',
        ]);

        // Create attendance for member2
        Attendance::create([
            'organization_id' => $this->org->id,
            'user_id' => $this->member2->id,
            'date' => $today,
            'status' => 'Absent',
        ]);

        $response = $this->actingAs($this->member1)->getJson('/api/my-attendance');

        $response->assertStatus(200)
            ->assertJsonPath('today.status', 'Present')
            ->assertJsonPath('stats.present_days', 1)
            ->assertJsonCount(1, 'records');
    }

    public function test_admin_sees_member_marked_attendance_and_can_override(): void
    {
        $today = today()->toDateString();

        // Member marks own attendance
        $this->actingAs($this->member1)->postJson('/api/my-attendance', [
            'status' => 'Present',
            'check_in' => '09:10 AM',
        ]);

        // Admin views daily attendance
        $adminView = $this->actingAs($this->owner)->getJson("/api/attendance?date={$today}");
        $adminView->assertStatus(200);

        $memberRecord = collect($adminView->json('data'))->firstWhere('id', (string) $this->member1->id);
        $this->assertNotNull($memberRecord);
        $this->assertEquals('Present', $memberRecord['status']);
        $this->assertEquals('09:10 AM', $memberRecord['check_in']);

        // Admin overrides member's attendance to Late
        $override = $this->actingAs($this->owner)->postJson('/api/attendance', [
            'user_id' => $this->member1->id,
            'date' => $today,
            'status' => 'Late',
            'check_in' => '10:00 AM',
            'check_out' => '06:00 PM',
        ]);
        $override->assertStatus(200);

        // Database should have updated the single record without duplicates
        $this->assertDatabaseCount('attendances', 1);
        $this->assertDatabaseHas('attendances', [
            'user_id' => $this->member1->id,
            'date' => $today,
            'status' => 'Late',
            'check_in' => '10:00 AM',
            'check_out' => '06:00 PM',
        ]);
    }
}
