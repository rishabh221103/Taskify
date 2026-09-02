<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory, BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'manager_id',
        'status',
        'priority',
        'deadline',
        'progress',
        'risk_level',
        'business_impact',
        'budget',
    ];

    protected $casts = [
        'deadline' => 'date',
        'progress' => 'integer',
        'budget' => 'decimal:2',
    ];

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class);
    }

    public function sections()
    {
        return $this->hasMany(Section::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }
}
