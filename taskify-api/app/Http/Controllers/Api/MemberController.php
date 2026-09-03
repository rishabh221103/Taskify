<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\InviteMemberRequest;
use App\Http\Requests\UpdateMemberRequest;
use App\Http\Resources\UserResource;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

use App\Notifications\MemberWelcome;

class MemberController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $members = User::with('roles')->where('organization_id', $request->user()->organization_id)->get();

        return UserResource::collection($members);
    }

    public function invite(InviteMemberRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        $owner = $request->user();

        $defaultPassword = config('app.default_member_password', env('DEFAULT_MEMBER_PASSWORD', 'password123'));

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($defaultPassword),
            'organization_id' => $owner->organization_id,
            'phone_number' => $request->input('phone_number') ?? ('+91 98765 ' . rand(10000, 99999)),
            'title' => $validated['title'],
        ]);

        // Dynamically ensure the "member" role exists before assigning it
        \Spatie\Permission\Models\Role::findOrCreate('member');
        $user->assignRole('member');

        // Record in dedicated team_members table for members only
        TeamMember::create([
            'user_id' => $user->id,
            'organization_id' => $user->organization_id,
            'name' => $user->name,
            'email' => $user->email,
            'phone_number' => $user->phone_number,
            'title' => $user->title,
            'status' => 'active',
            'joined_date' => now(),
        ]);

        // Automatically send welcome email notification
        $user->notify(new MemberWelcome($defaultPassword));

        return response()->json([
            'message' => 'Member created and welcome email sent successfully.',
            'user' => new UserResource($user->fresh(['roles'])),
        ], 201);
    }

    public function update(UpdateMemberRequest $request, User $member): JsonResponse
    {
        // Ensure member belongs to the same organization
        if ($member->organization_id !== $request->user()->organization_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Authorization check: account owner or self-editing
        $currentUser = $request->user();
        $isOwner = $currentUser->hasRole('owner');
        $isSelf = $currentUser->id === $member->id;

        if (!$isOwner && !$isSelf) {
            return response()->json(['message' => 'You do not have permission to edit this member.'], 403);
        }

        $validated = $request->validated();

        $member->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'] ?? $member->phone_number,
            'title' => $validated['title'],
        ]);

        $member->teamMember()->updateOrCreate(
            ['user_id' => $member->id],
            [
                'organization_id' => $member->organization_id,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone_number' => $validated['phone_number'] ?? $member->phone_number,
                'title' => $validated['title'],
            ]
        );

        return response()->json([
            'message' => 'Member updated successfully.',
            'user' => new UserResource($member->fresh(['roles'])),
        ]);
    }

    public function destroy(Request $request, User $member): JsonResponse
    {
        // Ensure the member belongs to the same organization as the authenticated user
        if ($member->organization_id !== $request->user()->organization_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Prevent the owner from deleting themselves via this endpoint
        if ($member->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot remove yourself.'], 422);
        }

        // Detach member from tasks and projects to unassign them safely without deleting task records
        $member->tasks()->detach();
        $member->projects()->detach();

        // Delete user record
        $member->delete();

        return response()->json([
            'message' => 'Member removed successfully.'
        ]);
    }
}

