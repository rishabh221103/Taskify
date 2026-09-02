<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Notifications\TaskAssigned;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Task::with(['creator', 'assignees', 'subtasks', 'project', 'section', 'attachments', 'comments.user']);

        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->has('section_id')) {
            $query->where('section_id', $request->section_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('assignee_id')) {
            $query->whereHas('assignees', function ($q) use ($request) {
                $q->where('users.id', $request->assignee_id);
            });
        }

        return TaskResource::collection($query->get());
    }

    public function store(StoreTaskRequest $request): TaskResource
    {
        $validated = $request->validated();
        $validated['created_by'] = $request->user()->id;

        $task = Task::create($validated);

        if ($request->has('assignee_ids')) {
            $task->assignees()->sync($validated['assignee_ids']);
            
            // Notify newly assigned members
            $assignees = User::whereIn('id', $validated['assignee_ids'])->get();
            foreach ($assignees as $assignee) {
                $assignee->notify(new TaskAssigned($task));
            }
        }

        if ($request->has('subtasks')) {
            foreach ($validated['subtasks'] as $subtaskData) {
                $task->subtasks()->create($subtaskData);
            }
        }

        return new TaskResource($task->load(['creator', 'assignees', 'subtasks', 'project', 'section', 'attachments', 'comments.user']));
    }

    public function show(Task $task): TaskResource
    {
        return new TaskResource($task->load(['creator', 'assignees', 'subtasks', 'project', 'section', 'attachments', 'comments.user']));
    }

    public function update(UpdateTaskRequest $request, Task $task): TaskResource
    {
        $validated = $request->validated();

        $oldAssigneeIds = $task->assignees()->pluck('users.id')->toArray();

        $task->update($validated);

        if ($request->has('assignee_ids')) {
            $task->assignees()->sync($validated['assignee_ids']);
            
            // Send email to newly added assignees only
            $newAssigneeIds = array_diff($validated['assignee_ids'], $oldAssigneeIds);
            if (!empty($newAssigneeIds)) {
                $newAssignees = User::whereIn('id', $newAssigneeIds)->get();
                foreach ($newAssignees as $assignee) {
                    $assignee->notify(new TaskAssigned($task));
                }
            }
        }

        if ($request->has('subtasks')) {
            $subtaskIds = [];
            foreach ($validated['subtasks'] as $subtaskData) {
                if (isset($subtaskData['id'])) {
                    $subtask = $task->subtasks()->findOrFail($subtaskData['id']);
                    $subtask->update($subtaskData);
                    $subtaskIds[] = $subtask->id;
                } else {
                    $newSubtask = $task->subtasks()->create($subtaskData);
                    $subtaskIds[] = $newSubtask->id;
                }
            }
            $task->subtasks()->whereNotIn('id', $subtaskIds)->delete();
        }

        return new TaskResource($task->load(['creator', 'assignees', 'subtasks', 'project', 'section', 'attachments', 'comments.user']));
    }

    public function destroy(Task $task): JsonResponse
    {
        $task->delete();

        return response()->json(['message' => 'Task deleted successfully']);
    }

    public function move(Request $request, Task $task): TaskResource
    {
        $validated = $request->validate([
            'section_id' => [
                'nullable',
                Rule::exists('sections', 'id')->where('organization_id', $request->user()->organization_id)
            ],
            'status' => 'sometimes|required|in:todo,in_progress,review,done',
        ]);

        $task->update($validated);

        return new TaskResource($task->load(['creator', 'assignees', 'subtasks', 'project', 'section', 'attachments', 'comments.user']));
    }

    public function storeAttachment(Request $request, Task $task): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'size' => 'required|integer',
            'url' => 'required|string', // Base64 data
        ]);

        $attachment = $task->attachments()->create($validated);

        return response()->json([
            'message' => 'Attachment uploaded successfully',
            'attachment' => $attachment,
        ], 201);
    }

    public function destroyAttachment(\App\Models\TaskAttachment $attachment): JsonResponse
    {
        $attachment->delete();

        return response()->json(['message' => 'Attachment deleted successfully']);
    }
}
