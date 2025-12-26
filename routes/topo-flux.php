<?php
// routes/topo-flux.php

use App\Http\Controllers\TopoFluxController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes Flux TopoManager
|--------------------------------------------------------------------------
| 
| Routes pour consulter et valider les imports TopoManager
| Accessible selon les permissions utilisateur
|
*/

Route::prefix('topo-flux')->name('topo-flux.')->group(function () {
    
    // ========================================================================
    // CONSULTATION (super_admin, central_user, admin_district, user_district)
    // ========================================================================
    
    Route::middleware(['auth', 'district.scope'])->group(function () {
        
        // Page principale - Liste des imports
        Route::get('/', [TopoFluxController::class, 'index'])
            ->name('index');
        
        // Détails d'un import spécifique
        Route::get('/{import_id}', [TopoFluxController::class, 'show'])
            ->name('show');
        
        // Statistiques
        Route::get('/stats/global', [TopoFluxController::class, 'getStats'])
            ->name('stats');
        
        // Télécharger un fichier temporaire
        Route::get('/files/{file_id}/download', [TopoFluxController::class, 'downloadFile'])
            ->name('files.download');
        
        // Prévisualiser un fichier (images)
        Route::get('/files/{file_id}/preview', [TopoFluxController::class, 'previewFile'])
            ->name('files.preview');
    });
    
    // ========================================================================
    // VALIDATION (admin_district, user_district uniquement)
    // ========================================================================
    
    Route::middleware(['auth', 'district.scope', 'role:admin_district,user_district'])->group(function () {
        
        // Valider un import (créer l'entité dans GeODOC)
        Route::post('/{import_id}/validate', [TopoFluxController::class, 'validateImport'])
            ->name('validate');
        
        // Rejeter un import
        Route::post('/{import_id}/reject', [TopoFluxController::class, 'rejectImport'])
            ->name('reject');
        
        // Validation en masse
        Route::post('/validate-batch', [TopoFluxController::class, 'validateBatch'])
            ->name('validate-batch');
        
        // Ouvrir le formulaire pré-rempli (propriété)
        Route::get('/{import_id}/open-propriete-form', [TopoFluxController::class, 'openProprieteForm'])
            ->name('open-propriete-form');
        
        // Ouvrir le formulaire pré-rempli (demandeur)
        Route::get('/{import_id}/open-demandeur-form', [TopoFluxController::class, 'openDemandeurForm'])
            ->name('open-demandeur-form');
    });
    
    // ========================================================================
    // GESTION (super_admin uniquement)
    // ========================================================================
    
    Route::middleware(['auth', 'role:super_admin'])->group(function () {
        
        // Supprimer un import (et ses fichiers)
        Route::delete('/{import_id}', [TopoFluxController::class, 'destroy'])
            ->name('destroy');
        
        // Nettoyer les imports anciens
        Route::post('/cleanup', [TopoFluxController::class, 'cleanup'])
            ->name('cleanup');
        
        // Gestion des utilisateurs TopoManager
        Route::get('/topo-users', [TopoFluxController::class, 'manageTopoUsers'])
            ->name('topo-users.index');
        
        Route::post('/topo-users', [TopoFluxController::class, 'createTopoUser'])
            ->name('topo-users.create');
        
        Route::put('/topo-users/{user_id}', [TopoFluxController::class, 'updateTopoUser'])
            ->name('topo-users.update');
        
        Route::delete('/topo-users/{user_id}', [TopoFluxController::class, 'deleteTopoUser'])
            ->name('topo-users.delete');
    });
});

// ========================================================================
// WEBHOOK (optionnel) - Notification depuis FastAPI
// ========================================================================

Route::post('/webhook/topo-import', [TopoFluxController::class, 'handleWebhook'])
    ->middleware('throttle:60,1') // Max 60 requêtes/minute
    ->name('webhook.topo-import');