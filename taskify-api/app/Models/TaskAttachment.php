<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'name',
        'size',
        'url',
    ];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }
}
