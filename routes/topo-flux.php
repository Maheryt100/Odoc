<?php

use App\Http\Controllers\TopoFluxController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| TopoFlux Routes
|--------------------------------------------------------------------------
| Gestion des imports terrain depuis TopoManager
| 
| ACCÈS RESTREINT:
| ✅ Admin District et User District UNIQUEMENT
| ❌ Super Admin et Central User: REFUSÉ (lecture seule)
*/

Route::prefix('topo-flux')
    ->name('topo-flux.')
    ->middleware(['auth', 'verified', 'topo.access']) // ✅ Middleware de restriction
    ->group(function () {
        
        // Liste des imports
        Route::get('/', [TopoFluxController::class, 'index'])
            ->name('index');
        
        // Détails d'un import
        Route::get('/{import}', [TopoFluxController::class, 'show'])
            ->name('show');
        
        // Validation d'un import
        Route::post('/{import}/validate', [TopoFluxController::class, 'validate'])
            ->name('validate');
        
        // Rejet d'un import
        Route::post('/{import}/reject', [TopoFluxController::class, 'reject'])
            ->name('reject');
        
        // Archivage d'un import
        Route::post('/{import}/archive', [TopoFluxController::class, 'archive'])
            ->name('archive');
        
        // Téléchargement de fichier
        Route::get('/{import}/files/{file}/download', [TopoFluxController::class, 'downloadFile'])
            ->name('files.download');
        
        // Statistiques
        Route::get('/stats', [TopoFluxController::class, 'stats'])
            ->name('stats');
    });