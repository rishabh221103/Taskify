<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskCommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $this->user;
        return [
            'id' => (string) $this->id,
            'task_id' => (string) $this->task_id,
            'user_id' => (string) $this->user_id,
            'author_name' => $user ? $user->name : 'Team Member',
            'author_avatar' => $user ? $user->avatar : null,
            'user' => new UserResource($this->whenLoaded('user')),
            'body' => $this->body,
            'text' => $this->body,
            'time' => $this->created_at ? $this->created_at->diffForHumans() : 'Just now',
            'created_at' => $this->created_at ? $this->created_at->toISOString() : null,
        ];
    }
}
