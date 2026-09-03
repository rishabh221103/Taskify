<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'organization_id' => $this->organization_id,
            'phone_number' => $this->phone_number,
            'title' => $this->title,
            'color' => $this->color,
            'unique_id' => $this->unique_id,
            'member_id' => $this->unique_id,
            'roles' => $this->roles->pluck('name'),
            'created_at' => $this->created_at,
        ];
    }
}
