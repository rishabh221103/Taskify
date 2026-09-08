<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Notifications\ProjectAssigned;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Notification;

class ProjectController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $orgId = $request->user()->organization_id;

        $projects = Project::where('organization_id', $orgId)
            ->with(['manager', 'users', 'sections'])
            ->withCount([
                'tasks' => function ($query) use ($orgId) {
                    $query->where('organization_id', $orgId);
                },
                'tasks as completed_tasks_count' => function ($query) use ($orgId) {
                    $query->where('organization_id', $orgId)->where('status', 'done');
                },
            ])
            ->get();

        return ProjectResource::collection($projects);
    }

    public function store(StoreProjectRequest $request): ProjectResource
    {
        $validated = $request->validated();
        $validated['organization_id'] = $request->user()->organization_id;

        $project = Project::create($validated);

        // Create a clean initial section for the project
        $project->sections()->create([
            'name' => 'General',
            'organization_id' => $project->organization_id,
        ]);

        if ($request->has('member_ids')) {
            $project->users()->sync($validated['member_ids'] ?? []);
        }

        // Notify all assigned members and manager
        $recipientIds = collect($validated['member_ids'] ?? []);
        if (!empty($project->manager_id)) {
            $recipientIds->push($project->manager_id);
        }
        $recipientIds = $recipientIds->unique()->values();

        if ($recipientIds->isNotEmpty()) {
            $usersToNotify = User::whereIn('id', $recipientIds)->get();
            if ($usersToNotify->isNotEmpty()) {
                Notification::send($usersToNotify, new ProjectAssigned($project));
            }
        }

        $project->load(['manager', 'users', 'sections'])
            ->loadCount(['tasks', 'tasks as completed_tasks_count' => function ($query) {
                $query->where('status', 'done');
            }]);

        return new ProjectResource($project);
    }

    public function show(Project $project): ProjectResource
    {
        $project->load(['manager', 'users', 'sections'])
            ->loadCount(['tasks', 'tasks as completed_tasks_count' => function ($query) {
                $query->where('status', 'done');
            }]);

        return new ProjectResource($project);
    }

    public function update(UpdateProjectRequest $request, Project $project): ProjectResource
    {
        $validated = $request->validated();

        $oldManagerId = $project->manager_id;
        $oldMemberIds = $project->users()->pluck('users.id')->toArray();
        $oldDeadline = $project->deadline ? $project->deadline->toDateString() : null;

        // If deadline is updated and moved, reset reminder_sent_at so future reminders can be sent
        if (array_key_exists('deadline', $validated) && $validated['deadline'] !== $oldDeadline) {
            $validated['reminder_sent_at'] = null;
        }

        $project->update($validated);

        if ($request->has('member_ids')) {
            $project->users()->sync($validated['member_ids'] ?? []);
        }

        // Send email to newly added assignees only
        $newMemberIds = [];
        if ($request->has('member_ids')) {
            $newMemberIds = array_diff($validated['member_ids'] ?? [], $oldMemberIds);
        }
        $newRecipientIds = collect($newMemberIds);

        // If manager changed and wasn't already assigned to this project
        if (!empty($project->manager_id) && $project->manager_id != $oldManagerId) {
            if (!in_array($project->manager_id, $oldMemberIds)) {
                $newRecipientIds->push($project->manager_id);
            }
        }
        $newRecipientIds = $newRecipientIds->unique()->values();

        if ($newRecipientIds->isNotEmpty()) {
            $usersToNotify = User::whereIn('id', $newRecipientIds)->get();
            if ($usersToNotify->isNotEmpty()) {
                Notification::send($usersToNotify, new ProjectAssigned($project));
            }
        }

        $project->load(['manager', 'users', 'sections'])
            ->loadCount(['tasks', 'tasks as completed_tasks_count' => function ($query) {
                $query->where('status', 'done');
            }]);

        return new ProjectResource($project);
    }

    public function destroy(Project $project): JsonResponse
    {
        $project->delete();

        return response()->json(['message' => 'Project deleted successfully']);
    }
}
