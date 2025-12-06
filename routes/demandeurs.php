<?php

use App\Http\Controllers\DemandeurController;
use App\Http\Middleware\ValidateDemandeurAction;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Demandeurs Routes
|--------------------------------------------------------------------------
*/

Route::prefix('demandeurs')->name('demandeurs.')->group(function () {
    
    // Liste des demandeurs d'un dossier
    Route::get('/dossier/{id_dossier}', [DemandeurController::class, 'index'])
        ->middleware('dossier.access:id_dossier')
        ->name('index');
    
    // ========================================================================
    // CRÉATION
    // ========================================================================
    Route::middleware([
        'district.access:create', 
        'check.dossier.closed:modify'
    ])->group(function () {
        Route::get('/create/{id}', [DemandeurController::class, 'create'])
            ->name('create');
        Route::post('/', [DemandeurController::class, 'store'])
            ->name('store');
        Route::post('/store-multiple', [DemandeurController::class, 'storeMultiple'])
            ->name('store-multiple');
        
        // Ajout de demandeur existant
        Route::get('/exist/{id}', [DemandeurController::class, 'exist'])
            ->name('exist');
        Route::post('/store-exist', [DemandeurController::class, 'storeExist'])
            ->name('storeExist');
    });
    
    // ========================================================================
    // MODIFICATION
    // ========================================================================
    
    // ✅ CORRECTION : Route GET sans middleware de validation
    Route::get('/{id_dossier}/{id_demandeur}/edit', [DemandeurController::class, 'edit'])
        ->middleware([
            'district.access:update', 
            'check.dossier.closed:modify'
            // ⚠️ RETIRÉ : ValidateDemandeurAction (bloque l'affichage)
        ])
        ->name('edit');
    
    // ✅ Route PUT avec middleware de validation
    Route::put('/{id}', [DemandeurController::class, 'update'])
        ->middleware([
            'district.access:update', 
            'check.dossier.closed:modify',
            ValidateDemandeurAction::class . ':modify' // ✅ Appliqué uniquement ici
        ])
        ->name('update');
    
    // ========================================================================
    // SUPPRESSION
    // ========================================================================
    Route::middleware([
        'district.access:delete', 
        'check.dossier.closed:modify'
    ])->group(function () {
        
        // Retrait du dossier (dissociation)
        Route::delete('/{id_dossier}/{id_demandeur}', [DemandeurController::class, 'destroy'])
            ->middleware(ValidateDemandeurAction::class . ':remove_from_dossier')
            ->name('destroy');
        
        // Suppression définitive (tous dossiers)
        Route::delete('/{id_demandeur}/definitive', [DemandeurController::class, 'destroyDefinitive'])
            ->middleware(ValidateDemandeurAction::class . ':delete')
            ->name('destroyDefinitive');
    });
});