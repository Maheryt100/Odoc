<?php

use App\Http\Controllers\DemandeurController;
use App\Http\Controllers\AdvancedSearchController;
use App\Http\Controllers\SearchController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes de Recherche Globale pour la recherche aprofondie des dossiers dans Geodoc, rien à avoir avec le fastAPI (topo)
|--------------------------------------------------------------------------
| Routes accessibles par tous les utilisateurs authentifiés.
| Logging activé pour suivre les performances.
*/

Route::middleware(['auth', 'search.log'])->prefix('search')->name('search.')->group(function () {
    
    //  Recherche principale (tous les utilisateurs)
    Route::get('/', [AdvancedSearchController::class, 'search'])
        ->name('index')
        ->middleware('throttle:60,1'); // Max 60 recherches/minute
    
    //  Suggestions autocomplete
    Route::get('/suggestions', [AdvancedSearchController::class, 'suggestions'])
        ->name('suggestions')
        ->middleware('throttle:120,1'); // 120 suggestions/minute
    
    //  Export des résultats (tous les utilisateurs)
    Route::get('/export', [AdvancedSearchController::class, 'export'])
        ->name('export')
        ->middleware('throttle:10,1'); // Max 10 exports/minute
    
    //  Recherche demandeur par CIN (pour éviter doublons)
    Route::get('/demandeur/cin/{cin}', [DemandeurController::class, 'searchByCin'])
        ->name('demandeur.cin')
        ->where('cin', '[0-9]{12}');
});

/*
|--------------------------------------------------------------------------
| Routes API pour recherche (sans middleware 'search.log') des donnees venant de fastapi (topo)
|--------------------------------------------------------------------------
| Utilisées par les composants React et FastAPI
*/

Route::middleware('auth')->prefix('api/search')->name('api.search.')->group(function () {
    
    //  Recherche demandeur par CIN (format JSON)
    Route::get('/demandeur/cin', [SearchController::class, 'searchDemandeurByCin'])
        ->name('demandeur.cin');
    
    //  Recherche propriété par lot
    Route::get('/propriete/lot', [SearchController::class, 'searchProprieteByLot'])
        ->name('propriete.lot');
    
    //  Recherche dossier
    Route::get('/dossier/numero', [SearchController::class, 'searchDossierByNumero'])
        ->name('dossier.numero');
    
    //  Autocomplete
    Route::get('/autocomplete', [SearchController::class, 'autocomplete'])
        ->name('autocomplete');
});