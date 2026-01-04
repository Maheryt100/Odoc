<?php
// this is bootstrap/app.php
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\DistrictAccessMiddleware;
use App\Http\Middleware\CheckDossierAccess;
use App\Http\Middleware\LogUserAccess;
use App\Http\Middleware\CheckDossierClosed;


return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        // api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        
    )
    ->withMiddleware(function (Middleware $middleware) {
        
        // Global middleware
        $middleware->append([
            \Illuminate\Http\Middleware\TrustProxies::class,
            \Illuminate\Http\Middleware\HandleCors::class,
            \Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance::class,
            \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
            \Illuminate\Foundation\Http\Middleware\TrimStrings::class,
            \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
            \App\Http\Middleware\InertiaTopoData::class,
        ]);

            
        // Middlewares globaux pour le groupe 'web'
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\InertiaTopoData::class,
        ]);

        $middleware->api(prepend: [
        ]);

        // Enregistrement des middlewares d'alias
        $middleware->alias([
            'district.access' => DistrictAccessMiddleware::class,
            'dossier.access' => CheckDossierAccess::class,
            'log.access' => LogUserAccess::class,
            'district.scope' => \App\Http\Middleware\EnsureDistrictScope::class,
            'check.dossier.closed' => CheckDossierClosed::class,
            'check.attachments' => \App\Http\Middleware\CheckAttachmentsAccess::class,
            'check.dossier.not.closed' => \App\Http\Middleware\CheckDossierNotClosed::class,
            'validate.ordre' => \App\Http\Middleware\ValidateOrdreConsort::class,
            'search.log' => \App\Http\Middleware\SearchLogger::class,
            'super.admin' => \App\Http\Middleware\CheckSuperAdmin::class,
            'role' => \App\Http\Middleware\CheckRole::class,

        ]);;
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();