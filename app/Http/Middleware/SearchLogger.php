<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class SearchLogger
{
    public function handle($request, Closure $next)
    {
        $start = microtime(true);
        $response = $next($request);
        $duration = (microtime(true) - $start) * 1000;

        if ($request->is('search*')) {
            Log::channel('search')->info('Search Query', [
                'user_id' => Auth::user()?->id,
                'query' => $request->get('q'),
                'duration_ms' => round($duration, 2),
                'results_count' => $response->getData()->total ?? 0,
            ]);
        }

        return $response;
    }
}