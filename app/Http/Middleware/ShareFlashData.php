<?php
// app/Http/Middleware/ShareFlashData.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShareFlashData
{
    public function handle(Request $request, Closure $next)
    {
        Inertia::share([
            'session' => fn () => [
                'preloadDemandeur' => $request->session()->get('preloadDemandeur'),
                'preloadPropriete' => $request->session()->get('preloadPropriete'),
                'openEditDemandeur' => $request->session()->get('openEditDemandeur'),
                'openEditPropriete' => $request->session()->get('openEditPropriete'),
            ]
        ]);
        
        return $next($request);
    }
}