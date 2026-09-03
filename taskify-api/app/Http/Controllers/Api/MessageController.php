<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /**
     * List conversations.
     * Owner: Returns all members in organization with latest message snippet & unread count.
     * Member: Returns the organization's Owner as the sole conversation target.
     */
    public function conversations(Request $request): JsonResponse
    {
        $user = $request->user();
        $orgId = $user->organization_id;

        if ($user->hasRole('owner')) {
            // Owner sees all members in the org
            $members = User::where('organization_id', $orgId)
                ->where('id', '!=', $user->id)
                ->get();

            $conversations = $members->map(function ($member) use ($user, $orgId) {
                $latestMessage = Message::where('organization_id', $orgId)
                    ->where(function ($q) use ($user, $member) {
                        $q->where(function ($q1) use ($user, $member) {
                            $q1->where('sender_id', $user->id)->where('recipient_id', $member->id);
                        })->orWhere(function ($q2) use ($user, $member) {
                            $q2->where('sender_id', $member->id)->where('recipient_id', $user->id);
                        });
                    })
                    ->latest()
                    ->first();

                $unreadCount = Message::where('organization_id', $orgId)
                    ->where('sender_id', $member->id)
                    ->where('recipient_id', $user->id)
                    ->whereNull('read_at')
                    ->count();

                return [
                    'user' => [
                        'id' => (string) $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                        'title' => $member->title,
                    ],
                    'last_message' => $latestMessage ? $latestMessage->body : null,
                    'last_message_at' => $latestMessage ? $latestMessage->created_at->toISOString() : null,
                    'unread_count' => $unreadCount,
                ];
            });

            return response()->json([
                'conversations' => $conversations,
            ]);
        } else {
            // Member only sees the Owner(s) of their organization
            $owners = User::where('organization_id', $orgId)
                ->whereHas('roles', function ($q) {
                    $q->where('name', 'owner');
                })
                ->get();

            $owner = $owners->first();

            if (!$owner) {
                return response()->json(['conversations' => []]);
            }

            $latestMessage = Message::where('organization_id', $orgId)
                ->where(function ($q) use ($user, $owner) {
                    $q->where(function ($q1) use ($user, $owner) {
                        $q1->where('sender_id', $user->id)->where('recipient_id', $owner->id);
                    })->orWhere(function ($q2) use ($user, $owner) {
                        $q2->where('sender_id', $owner->id)->where('recipient_id', $user->id);
                    });
                })
                ->latest()
                ->first();

            $unreadCount = Message::where('organization_id', $orgId)
                ->where('sender_id', $owner->id)
                ->where('recipient_id', $user->id)
                ->whereNull('read_at')
                ->count();

            return response()->json([
                'conversations' => [
                    [
                        'user' => [
                            'id' => (string) $owner->id,
                            'name' => $owner->name,
                            'email' => $owner->email,
                            'title' => 'Organization Owner / Admin',
                        ],
                        'last_message' => $latestMessage ? $latestMessage->body : null,
                        'last_message_at' => $latestMessage ? $latestMessage->created_at->toISOString() : null,
                        'unread_count' => $unreadCount,
                    ]
                ],
            ]);
        }
    }

    /**
     * Get message thread with a specific user.
     */
    public function show(Request $request, User $withUser): JsonResponse
    {
        $user = $request->user();
        $orgId = $user->organization_id;

        if ($withUser->organization_id !== $orgId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // If authenticated user is a Member, they can ONLY view conversation thread with an Owner!
        if (!$user->hasRole('owner') && !$withUser->hasRole('owner')) {
            return response()->json(['message' => 'Forbidden. Members can only communicate with the Organization Owner.'], 403);
        }

        // Mark unread messages sent by $withUser to $user as read
        Message::where('organization_id', $orgId)
            ->where('sender_id', $withUser->id)
            ->where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = Message::where('organization_id', $orgId)
            ->where(function ($q) use ($user, $withUser) {
                $q->where(function ($q1) use ($user, $withUser) {
                    $q1->where('sender_id', $user->id)->where('recipient_id', $withUser->id);
                })->orWhere(function ($q2) use ($user, $withUser) {
                    $q2->where('sender_id', $withUser->id)->where('recipient_id', $user->id);
                });
            })
            ->with(['sender', 'recipient'])
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($msg) {
                return [
                    'id' => (string) $msg->id,
                    'sender_id' => (string) $msg->sender_id,
                    'recipient_id' => (string) $msg->recipient_id,
                    'body' => $msg->body,
                    'created_at' => $msg->created_at->toISOString(),
                    'read_at' => $msg->read_at ? $msg->read_at->toISOString() : null,
                ];
            });

        return response()->json([
            'with_user' => [
                'id' => (string) $withUser->id,
                'name' => $withUser->name,
                'email' => $withUser->email,
                'title' => $withUser->title,
            ],
            'messages' => $messages,
        ]);
    }

    /**
     * Send a message.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipient_id' => 'required|exists:users,id',
            'body' => 'required|string|max:5000',
        ]);

        $user = $request->user();
        $orgId = $user->organization_id;

        $recipient = User::findOrFail($validated['recipient_id']);

        if ($recipient->organization_id !== $orgId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // STRICT ASYMMETRIC PERMISSION ENFORCEMENT:
        // - Owner can send message to ANY member in their org.
        // - Member can send message ONLY to the Owner. Reject (403) if recipient is not an Owner!
        if (!$user->hasRole('owner')) {
            if (!$recipient->hasRole('owner')) {
                return response()->json([
                    'message' => 'Forbidden. Members can only send messages to the Organization Owner.'
                ], 403);
            }
        }

        $message = Message::create([
            'organization_id' => $orgId,
            'sender_id' => $user->id,
            'recipient_id' => $recipient->id,
            'body' => $validated['body'],
        ]);

        return response()->json([
            'message' => 'Message sent successfully',
            'data' => [
                'id' => (string) $message->id,
                'sender_id' => (string) $message->sender_id,
                'recipient_id' => (string) $message->recipient_id,
                'body' => $message->body,
                'created_at' => $message->created_at->toISOString(),
                'read_at' => null,
            ],
        ], 201);
    }
}
