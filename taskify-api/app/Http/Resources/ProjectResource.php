<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'deadline' => $this->deadline ? $this->deadline->toDateString() : null,
            'progress' => ($this->tasks_count ?? $this->tasks()->count()) > 0
                ? (int) round((($this->completed_tasks_count ?? $this->tasks()->where('status', 'done')->count()) / ($this->tasks_count ?? $this->tasks()->count())) * 100)
                : 0,
            'risk_level' => $this->risk_level,
            'business_impact' => $this->business_impact,
            'budget' => $this->budget,
            'manager' => new UserResource($this->whenLoaded('manager')),
            'users' => UserResource::collection($this->whenLoaded('users')),
            'sections' => SectionResource::collection($this->whenLoaded('sections')),
            'tasks_count' => $this->tasks_count ?? $this->tasks()->count(),
            'completed_tasks_count' => $this->completed_tasks_count ?? $this->tasks()->where('status', 'done')->count(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
