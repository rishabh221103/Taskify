<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'unique_id',
        'name',
        'email',
        'password',
        'organization_id',
        'phone_number',
        'title',
        'color',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public static function generateUniqueId(?int $orgId = null): string
    {
        $lastUser = static::whereNotNull('unique_id')
            ->orderBy('id', 'desc')
            ->first();

        $nextNumber = 1;
        if ($lastUser && preg_match('/(?:MEM|UID)-(\d+)/', $lastUser->unique_id, $matches)) {
            $nextNumber = (int) $matches[1] + 1;
        }

        do {
            $candidate = 'MEM-' . str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);
            $exists = static::where('unique_id', $candidate)->exists();
            if (!$exists) {
                return $candidate;
            }
            $nextNumber++;
        } while (true);
    }

    public static function generateUniqueColorForOrg(?int $orgId): string
    {
        $palette = [
            '#3B82F6', // Blue
            '#8B5CF6', // Purple
            '#EC4899', // Pink
            '#10B981', // Emerald
            '#F59E0B', // Amber
            '#EF4444', // Red
            '#06B6D4', // Cyan
            '#F97316', // Orange
            '#84CC16', // Lime
            '#6366F1', // Indigo
            '#14B8A6', // Teal
            '#D946EF', // Fuchsia
            '#38BDF8', // Light Blue
            '#A855F7', // Bright Purple
            '#FB923C', // Warm Orange
            '#4ADE80', // Bright Green
            '#F43F5E', // Rose
            '#0EA5E9', // Sky Blue
        ];

        $query = static::query();
        if ($orgId) {
            $query->where('organization_id', $orgId);
        }

        $usedColors = $query->whereNotNull('color')->pluck('color')->map(fn($c) => strtoupper($c))->toArray();

        foreach ($palette as $colorCandidate) {
            if (!in_array(strtoupper($colorCandidate), $usedColors)) {
                return $colorCandidate;
            }
        }

        $hue = fmod(count($usedColors) * 137.508, 360);
        return sprintf('hsl(%d, 75%%, 55%%)', (int) $hue);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if (empty($user->color)) {
                $user->color = static::generateUniqueColorForOrg($user->organization_id);
            }
            if (empty($user->unique_id)) {
                $user->unique_id = static::generateUniqueId($user->organization_id);
            }
        });

        static::saving(function ($user) {
            if ($user->isDirty('password') && $user->password) {
                if (!preg_match('/^\$2[ayb]\$[0-9]{2}\$[A-Za-z0-9.\/]{53}$/', $user->password)) {
                    throw new \InvalidArgumentException('The password must be a valid bcrypt hash.');
                }
            }
        });
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function projects()
    {
        return $this->belongsToMany(Project::class);
    }

    public function tasks()
    {
        return $this->belongsToMany(Task::class, 'task_user');
    }
}