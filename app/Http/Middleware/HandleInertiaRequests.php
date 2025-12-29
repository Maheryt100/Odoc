<?php

namespace App\Http\Middleware;

use App\Models\District;
use App\Models\Province;
use App\Models\Region;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;
use App\Services\JwtService;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user();

        /** =========================
         *  GESTION JWT POUR FASTAPI
         *  =========================
         */
        $jwtToken = session('geodoc_jwt');

        // Rafraîchir le token s'il existe mais est expiré
        if ($jwtToken && !JwtService::isTokenValid($jwtToken)) {
            try {
                $jwtToken = JwtService::generateToken($user);
                session(['geodoc_jwt' => $jwtToken]);
            } catch (\Exception $e) {
                $jwtToken = null;
                session()->forget('geodoc_jwt');
            }
        }

        return [
            ...parent::share($request),

            // Infos globales
            'name' => config('app.name'),
            'quote' => [
                'message' => trim($message),
                'author' => trim($author),
            ],

            // Auth
            'auth' => [
                'user' => $user,

                // ✅ JWT accessible côté React
                // usePage().props.auth.jwt_token
                'jwt_token' => $jwtToken,

                // ✅ URL FastAPI
                'fastapi_url' => config(
                    'services.fastapi.url',
                    'http://127.0.0.1:8000'
                ),
            ],

            // Flash messages
            'flash' => [
                'error'   => fn () => $request->session()->get('error'),
                'success' => fn () => $request->session()->get('success'),
                'message' => fn () => $request->session()->get('message'),
            ],

            // Ziggy
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],

            // UI state
            'sidebarOpen' => ! $request->hasCookie('sidebar_state')
                || $request->cookie('sidebar_state') === 'true',

            // Données géographiques
            'province' => fn () => Province::all(),
            'region'   => fn () => Region::all(),
            'district' => fn () => District::all(),
        ];
    }
}
