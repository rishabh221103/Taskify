<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsOwner
{
    /**
     * Handle an incoming request.
     * Ensure the authenticated user has the 'owner' role.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->hasRole('owner')) {
            return response()->json([
                'message' => 'Forbidden. This endpoint requires Owner/Admin privileges.',
            ], 403);
        }

        return $next($request);
    }
}
