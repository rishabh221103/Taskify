<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory, BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'project_id',
        'section_id',
        'title',
        'description',
        'status',
        'priority',
        'due_date',
        'created_by',
        'thumbnail',
        'reminder_sent_at',
    ];

    protected $casts = [
        'due_date' => 'date',
        'reminder_sent_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function assignees()
    {
        return $this->belongsToMany(User::class, 'task_user');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function subtasks()
    {
        return $this->hasMany(Subtask::class);
    }

    public function attachments()
    {
        return $this->hasMany(TaskAttachment::class);
    }

    public function comments()
    {
        return $this->hasMany(TaskComment::class)->orderBy('created_at', 'asc');
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($task) {
            $task->subtasks()->delete();
            $task->assignees()->detach();
            $task->attachments()->delete();
            $task->comments()->delete();
        });

        static::updating(function ($task) {
            if ($task->isDirty('due_date')) {
                $task->reminder_sent_at = null;
            }
        });
    }
}
