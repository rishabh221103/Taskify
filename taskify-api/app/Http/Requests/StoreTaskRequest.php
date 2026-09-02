<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $orgId = $this->user()->organization_id;

        return [
            'project_id' => [
                'required',
                Rule::exists('projects', 'id')->where('organization_id', $orgId)
            ],
            'section_id' => [
                'nullable',
                Rule::exists('sections', 'id')->where('organization_id', $orgId)
            ],
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:todo,in_progress,review,done',
            'priority' => 'nullable|in:critical,high,medium,low',
            'due_date' => 'nullable|date',
            'thumbnail' => 'nullable|string',
            'assignee_ids' => 'nullable|array',
            'assignee_ids.*' => [
                'integer',
                Rule::exists('users', 'id')->where('organization_id', $orgId)
            ],
            'subtasks' => 'nullable|array',
            'subtasks.*.title' => 'required_with:subtasks|string|max:255',
            'subtasks.*.done' => 'nullable|boolean',
        ];
    }
}
