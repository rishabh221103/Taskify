<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $orgId = $this->user()->organization_id;

        return [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'manager_id' => [
                'nullable',
                Rule::exists('users', 'id')->where('organization_id', $orgId)
            ],
            'status' => 'nullable|in:not_started,in_progress,on_hold,completed',
            'priority' => 'nullable|in:critical,high,medium,low',
            'deadline' => 'nullable|date',
            'progress' => 'nullable|integer|min:0|max:100',
            'risk_level' => 'nullable|in:low,medium,high',
            'business_impact' => 'nullable|in:low,medium,high',
            'budget' => 'nullable|numeric|min:0',
            'member_ids' => 'nullable|array',
            'member_ids.*' => [
                'integer',
                Rule::exists('users', 'id')->where('organization_id', $orgId)
            ],
        ];
    }
}
