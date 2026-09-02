<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskCommentResource;
use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskCommentController extends Controller
{
    /**
     * Store a comment on a task.
     */
    public function store(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();

        // Ensure task belongs to user's organization
        if ($task->organization_id !== $user->organization_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Authorization check:
        // Owner can comment on any task in org.
        // Member can comment on tasks assigned to them or created by them.
        if (!$user->hasRole('owner')) {
            $isAssigned = $task->assignees()->where('users.id', $user->id)->exists();
            $isCreator = $task->created_by === $user->id;

            if (!$isAssigned && !$isCreator) {
                return response()->json(['message' => 'Forbidden. You can only comment on tasks assigned to you.'], 403);
            }
        }

        $validated = $request->validate([
            'body' => 'required|string|max:5000',
        ]);

        $comment = TaskComment::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'body' => $validated['body'],
        ]);

        return response()->json([
            'message' => 'Comment added successfully',
            'data' => new TaskCommentResource($comment->load('user')),
        ], 201);
    }
}
