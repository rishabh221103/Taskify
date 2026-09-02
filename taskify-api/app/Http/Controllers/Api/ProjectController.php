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
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProjectController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $projects = Project::with(['manager', 'users', 'sections'])
            ->withCount(['tasks', 'tasks as completed_tasks_count' => function ($query) {
                $query->where('status', 'done');
            }])
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

        if ($project->manager_id) {
            $manager = User::find($project->manager_id);
            if ($manager) {
                $manager->notify(new ProjectAssigned($project));
            }
        }

        if ($request->has('member_ids')) {
            $project->users()->sync($validated['member_ids'] ?? []);
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

        $project->update($validated);

        if ($project->manager_id && $project->manager_id != $oldManagerId) {
            $manager = User::find($project->manager_id);
            if ($manager) {
                $manager->notify(new ProjectAssigned($project));
            }
        }

        if ($request->has('member_ids')) {
            $project->users()->sync($validated['member_ids'] ?? []);
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
