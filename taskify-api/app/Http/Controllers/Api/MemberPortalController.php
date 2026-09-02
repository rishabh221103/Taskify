<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\TaskResource;
use App\Http\Resources\UserResource;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;

class MemberPortalController extends Controller
{
    /**
     * Get member-scoped dashboard summary and metrics.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $orgId = $user->organization_id;

        $myTasksQuery = Task::where('organization_id', $orgId)
            ->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                  ->orWhereHas('assignees', function ($aq) use ($user) {
                      $aq->where('users.id', $user->id);
                  });
            });

        $activeTasksCount = (clone $myTasksQuery)->where('status', '!=', 'done')->count();
        $completedTasksCount = (clone $myTasksQuery)->where('status', 'done')->count();

        $startOfWeek = Carbon::now()->startOfWeek(Carbon::MONDAY)->toDateString();
        $endOfWeek = Carbon::now()->endOfWeek(Carbon::SUNDAY)->toDateString();
        $dueThisWeekCount = (clone $myTasksQuery)
            ->where('status', '!=', 'done')
            ->whereBetween('due_date', [$startOfWeek, $endOfWeek])
            ->count();

        $myProjectsQuery = Project::where('organization_id', $orgId)
            ->where(function ($q) use ($user) {
                $q->where('manager_id', $user->id)
                  ->orWhereHas('users', function ($uq) use ($user) {
                      $uq->where('users.id', $user->id);
                  });
            });

        $projectsCount = $myProjectsQuery->count();

        // Upcoming tasks
        $upcomingTasks = (clone $myTasksQuery)
            ->with(['creator', 'assignees', 'project', 'section'])
            ->where('status', '!=', 'done')
            ->whereNotNull('due_date')
            ->orderBy('due_date', 'asc')
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => [
                'my_active_tasks' => $activeTasksCount,
                'my_completed_tasks' => $completedTasksCount,
                'my_due_this_week' => $dueThisWeekCount,
                'my_projects_count' => $projectsCount,
            ],
            'upcoming_tasks' => TaskResource::collection($upcomingTasks),
        ]);
    }

    /**
     * Get all tasks assigned to or relevant to the authenticated member.
     */
    public function tasks(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $tasks = Task::with(['creator', 'assignees', 'subtasks', 'project', 'section', 'attachments', 'comments.user'])
            ->where('organization_id', $user->organization_id)
            ->where(function ($q) use ($user) {
                $q->where('created_by', $user->id)
                  ->orWhereHas('assignees', function ($aq) use ($user) {
                      $aq->where('users.id', $user->id);
                  });
            })
            ->get();

        return TaskResource::collection($tasks);
    }

    /**
     * Get all projects the authenticated member is assigned to.
     */
    public function projects(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $projects = Project::with(['manager', 'users', 'sections'])
            ->withCount(['tasks', 'tasks as completed_tasks_count' => function ($query) {
                $query->where('status', 'done');
            }])
            ->where('organization_id', $user->organization_id)
            ->where(function ($q) use ($user) {
                $q->where('manager_id', $user->id)
                  ->orWhereHas('users', function ($uq) use ($user) {
                      $uq->where('users.id', $user->id);
                  });
            })
            ->get();

        return ProjectResource::collection($projects);
    }

    /**
     * Get teammates in the organization for member view.
     */
    public function team(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $members = User::with('roles')->where('organization_id', $user->organization_id)->get();
        return UserResource::collection($members);
    }

    /**
     * Member updating status or details of a task assigned to them.
     */
    public function updateTask(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        // Check if task belongs to same organization
        if ($task->organization_id !== $user->organization_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Ensure user is assigned to or created the task
        $isAssigned = $task->assignees()->where('users.id', $user->id)->exists();
        $isCreator = $task->created_by === $user->id;

        if (!$isAssigned && !$isCreator && !$user->hasRole('owner')) {
            return response()->json(['message' => 'You are not assigned to this task.'], 403);
        }

        $validated = $request->validate([
            'status' => 'sometimes|string|in:todo,in_progress,review,done',
            'priority' => 'sometimes|string|in:low,medium,high,critical',
        ]);

        $task->update($validated);

        return response()->json([
            'message' => 'Task updated successfully.',
            'data' => new TaskResource($task->fresh(['creator', 'assignees', 'subtasks', 'project', 'section', 'attachments', 'comments.user'])),
        ]);
    }
}
