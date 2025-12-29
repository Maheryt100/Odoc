<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\JwtService;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // ✅ GÉNÉRATION JWT POUR FASTAPI
        $user = Auth::user();
        $jwtToken = JwtService::generateToken($user);
        
        // ✅ STOCKER EN SESSION POUR REACT
        session(['geodoc_jwt' => $jwtToken]);
        
        // ✅ LOGGER (optionnel)
        Log::info("JWT généré pour utilisateur {$user->id}", [
            'user' => $user->email,
            'token_expiry' => now()->addHour()->toDateTimeString()
        ]);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // ✅ SUPPRIMER JWT
        session()->forget('geodoc_jwt');

        return redirect('/');
    }
}
