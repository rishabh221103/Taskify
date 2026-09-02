<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait BelongsToOrganization
{
    public static function bootBelongsToOrganization()
    {
        static::creating(function ($model) {
            if (Auth::check() && !$model->organization_id) {
                if (Auth::user()->organization_id) {
                    $model->organization_id = Auth::user()->organization_id;
                }
            }
        });

        static::addGlobalScope('organization', function (Builder $builder) {
            if (Auth::check() && Auth::user()->organization_id) {
                $builder->where($builder->getModel()->getTable() . '.organization_id', Auth::user()->organization_id);
            }
        });
    }

    public function organization()
    {
        return $this->belongsTo(\App\Models\Organization::class);
    }
}
