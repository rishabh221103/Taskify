<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MessageTest extends TestCase
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

    public function test_owner_can_send_message_to_any_member(): void
    {
        $response = $this->actingAs($this->owner)->postJson('/api/messages', [
            'recipient_id' => $this->member1->id,
            'body' => 'Hello Member 1, welcome to the workspace!',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.body', 'Hello Member 1, welcome to the workspace!');

        $this->assertDatabaseHas('messages', [
            'sender_id' => $this->owner->id,
            'recipient_id' => $this->member1->id,
            'body' => 'Hello Member 1, welcome to the workspace!',
        ]);
    }

    public function test_member_can_send_message_to_owner(): void
    {
        $response = $this->actingAs($this->member1)->postJson('/api/messages', [
            'recipient_id' => $this->owner->id,
            'body' => 'Hello Owner, I have a question.',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.body', 'Hello Owner, I have a question.');

        $this->assertDatabaseHas('messages', [
            'sender_id' => $this->member1->id,
            'recipient_id' => $this->owner->id,
            'body' => 'Hello Owner, I have a question.',
        ]);
    }

    public function test_member_cannot_send_message_to_another_member_server_enforced(): void
    {
        $response = $this->actingAs($this->member1)->postJson('/api/messages', [
            'recipient_id' => $this->member2->id,
            'body' => 'Hey Member 2, secret chat!',
        ]);

        // Must return 403 Forbidden!
        $response->assertStatus(403)
            ->assertJson(['message' => 'Forbidden. Members can only send messages to the Organization Owner.']);

        $this->assertDatabaseMissing('messages', [
            'sender_id' => $this->member1->id,
            'recipient_id' => $this->member2->id,
        ]);
    }

    public function test_conversations_endpoint_returns_scoped_results(): void
    {
        // Member 1 sends message to Owner
        $this->actingAs($this->member1)->postJson('/api/messages', [
            'recipient_id' => $this->owner->id,
            'body' => 'Member 1 query',
        ]);

        // Owner conversations list includes member1 and member2
        $responseOwner = $this->actingAs($this->owner)->getJson('/api/conversations');
        $responseOwner->assertStatus(200)
            ->assertJsonCount(2, 'conversations');

        // Member 1 conversations list includes ONLY owner
        $responseMember = $this->actingAs($this->member1)->getJson('/api/conversations');
        $responseMember->assertStatus(200)
            ->assertJsonCount(1, 'conversations')
            ->assertJsonPath('conversations.0.user.id', (string) $this->owner->id);
    }

    public function test_all_messages_are_saved_in_database_and_retrieved_in_order(): void
    {
        // 1. Owner sends message
        $this->actingAs($this->owner)->postJson('/api/messages', [
            'recipient_id' => $this->member1->id,
            'body' => 'Message 1 from Owner',
        ]);

        // 2. Member 1 replies
        $this->actingAs($this->member1)->postJson('/api/messages', [
            'recipient_id' => $this->owner->id,
            'body' => 'Message 2 from Member 1',
        ]);

        // 3. Owner sends another message
        $this->actingAs($this->owner)->postJson('/api/messages', [
            'recipient_id' => $this->member1->id,
            'body' => 'Message 3 from Owner',
        ]);

        // Verify all 3 messages are persisted in MySQL `messages` table
        $this->assertDatabaseCount('messages', 3);
        $this->assertDatabaseHas('messages', ['body' => 'Message 1 from Owner']);
        $this->assertDatabaseHas('messages', ['body' => 'Message 2 from Member 1']);
        $this->assertDatabaseHas('messages', ['body' => 'Message 3 from Owner']);

        // Verify thread retrieval returns all 3 messages in chronological order
        $response = $this->actingAs($this->owner)->getJson("/api/messages/{$this->member1->id}");
        $response->assertStatus(200)
            ->assertJsonCount(3, 'messages')
            ->assertJsonPath('messages.0.body', 'Message 1 from Owner')
            ->assertJsonPath('messages.1.body', 'Message 2 from Member 1')
            ->assertJsonPath('messages.2.body', 'Message 3 from Owner');
    }
}
