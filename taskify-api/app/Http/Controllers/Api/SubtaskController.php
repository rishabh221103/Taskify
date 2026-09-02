<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubtaskResource;
use App\Models\Subtask;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubtaskController extends Controller
{
    public function store(Request $request, Task $task): SubtaskResource
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'done' => 'sometimes|boolean',
        ]);

        $subtask = $task->subtasks()->create([
            'title' => $validated['title'],
            'done' => $validated['done'] ?? false,
        ]);

        return new SubtaskResource($subtask);
    }

    public function update(Request $request, Subtask $subtask): SubtaskResource
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'done' => 'sometimes|required|boolean',
        ]);

        $subtask->update($validated);

        return new SubtaskResource($subtask);
    }

    public function destroy(Subtask $subtask): JsonResponse
    {
        $subtask->delete();

        return response()->json(['message' => 'Subtask deleted successfully']);
    }
}
