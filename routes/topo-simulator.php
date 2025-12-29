<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Simulateur TopoManager (DEV ONLY)
|--------------------------------------------------------------------------
| Interface web pour tester l'interopérabilité sans app mobile
*/

// ⚠️ SEULEMENT EN DÉVELOPPEMENT
if (app()->environment(['local', 'development'])) {
    
    Route::middleware('auth')->prefix('dev')->group(function () {
        
        // Page simulateur
        Route::get('/topo-simulator', function () {
            return Inertia::render('TopoSimulator/Index');
        })->name('dev.topo-simulator');
        
        // Générer token TopoManager pour test
        Route::post('/generate-topo-token', function () {
            /** @var \App\Models\User $user */
            $user = \Illuminate\Support\Facades\Auth::user();
            
            if (!$user) {
                return response()->json(['error' => 'Non authentifié'], 401);
            }
            
            // Simuler un utilisateur TopoManager
            $payload = [
                'sub' => 'test_topo_' . $user->id,
                'user_id' => 9999, // ID fictif
                'role' => 'operator',
                'iat' => time(),
                'exp' => time() + 3600
            ];
            
            $token = \Firebase\JWT\JWT::encode(
                $payload,
                config('services.fastapi.topomanager_jwt_secret'),
                'HS256'
            );
            
            return response()->json([
                'token' => $token,
                'expires_in' => 3600
            ]);
        })->name('dev.generate-topo-token');
    });
}