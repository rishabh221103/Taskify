<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug'];

    public function users()
    {
        return $this->hasMany(User::class);
    }
    public static function generateUniqueSlug(string $name): string
{
    $slug = \Illuminate\Support\Str::slug($name);
    $original = $slug;
    $count = 1;

    while (self::where('slug', $slug)->exists()) {
        $slug = $original . '-' . $count;
        $count++;
    }

    return $slug;
}
}