<?php

use App\Http\Controllers\TopoFluxController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| TopoFlux Routes
|--------------------------------------------------------------------------
| Gestion des imports terrain depuis TopoManager (FastAPI v2.0)
| 
| ACCÈS:
|  Admin District et User District
|  Super Admin et Central User (lecture seule possible)
*/

Route::prefix('topo-flux')
    ->name('topo-flux.')
    ->middleware(['auth', 'verified'])
    ->group(function () {
        
        // Liste des imports
        Route::get('/', [TopoFluxController::class, 'index'])
            ->name('index');
        
        // Détails d'un import
        Route::get('/{import}', [TopoFluxController::class, 'show'])
            ->name('show');
        
        // Importer dans GeODOC
        Route::post('/{import}/import', [TopoFluxController::class, 'import'])
            ->name('import');
        
        // Archiver
        Route::post('/{import}/archive', [TopoFluxController::class, 'archive'])
            ->name('archive');
        
        // Désarchiver
        Route::post('/{import}/unarchive', [TopoFluxController::class, 'unarchive'])
            ->name('unarchive');
        
        // Rejeter
        Route::post('/{import}/reject', [TopoFluxController::class, 'reject'])
            ->name('reject');
        
        // Téléchargement de fichier
        Route::get('/files/{file}/download', [TopoFluxController::class, 'downloadFile'])
            ->name('files.download');
    });