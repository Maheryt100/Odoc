<?php

use App\Http\Controllers\Api\ApiController;
use App\Http\Controllers\AssociationController;
use App\Http\Controllers\DemandeurController;
use App\Http\Controllers\GlobalSearchController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Endpoints API pour AJAX/Fetch depuis le frontend
*/

Route::prefix('api')->name('api.')->group(function () {
    
    // ========================================================================
    // ASSOCIATIONS
    // ========================================================================
    
    Route::get('/demandeur/{id_demandeur}/proprietes', [AssociationController::class, 'getDemandeurProprietes'])
        ->name('demandeur.proprietes');
    
    Route::get('/propriete/{id_propriete}/demandeurs', [AssociationController::class, 'getProprieteDemandeurs'])
        ->name('propriete.demandeurs');
    
    Route::get('/demandeur/{id}/associations', [ApiController::class, 'getDemandeurAssociations'])
        ->name('demandeur.associations');
    
    Route::get('/propriete/{id}/demandeurs-full', [ApiController::class, 'getProprieteDemandeursFull'])
        ->name('propriete.demandeurs-full');
    
    // ========================================================================
    // RECHERCHE
    // ========================================================================
    
    Route::get('/demandeur/search-by-cin/{cin}', [DemandeurController::class, 'searchByCin'])
        ->name('demandeur.search-by-cin');
    
    Route::get('/global-search', [GlobalSearchController::class, 'search'])
        ->name('global-search');
    
    Route::get('/search-suggestions', [GlobalSearchController::class, 'suggestions'])
        ->name('search-suggestions');
    
    // ========================================================================
    // VALIDATION DE SUPPRESSION - DEMANDEURS
    // ========================================================================
    
    Route::get('/demandeur/{id}/check-remove/{dossierId}', [ApiController::class, 'checkDemandeurRemove'])
        ->name('demandeur.check-remove');
    
    Route::get('/demandeur/{id}/check-delete', [ApiController::class, 'checkDemandeurDelete'])
        ->name('demandeur.check-delete');
    
    // ========================================================================
    // VALIDATION DE SUPPRESSION - PROPRIÉTÉS
    // ========================================================================
    
    Route::get('/propriete/{id}/check-delete', [ApiController::class, 'checkProprieteDelete'])
        ->name('propriete.check-delete');
    
    Route::get('/propriete/{id}/availability', [ApiController::class, 'getProprieteAvailability'])
        ->name('propriete.availability');
    
    // ========================================================================
    // STATISTIQUES
    // ========================================================================
    
    Route::get('/dossier/{id_dossier}/documents/stats', [ApiController::class, 'getDossierDocumentsStats'])
        ->name('dossier.documents.stats');
});