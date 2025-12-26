<?php

use App\Http\Controllers\DemandeurController;
use App\Http\Controllers\AdvancedSearchController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes de Recherche Globale
|--------------------------------------------------------------------------
| Routes accessibles par tous les utilisateurs authentifiés.
| Logging activé pour suivre les performances.
*/

Route::middleware(['auth', 'search.log'])->prefix('search')->name('search.')->group(function () {
    
    // ✅ Recherche principale (tous les utilisateurs)
    Route::get('/', [AdvancedSearchController::class, 'search'])
        ->name('index')
        ->middleware('throttle:60,1'); // Max 60 recherches/minute
    
    // ✅ Suggestions autocomplete
    Route::get('/suggestions', [AdvancedSearchController::class, 'suggestions'])
        ->name('suggestions')
        ->middleware('throttle:120,1'); // 120 suggestions/minute
    
    // ✅ Export des résultats (tous les utilisateurs)
    Route::get('/export', [AdvancedSearchController::class, 'export'])
        ->name('export')
        ->middleware('throttle:10,1'); // Max 10 exports/minute
    
    // ✅ Recherche demandeur par CIN (pour éviter doublons)
    Route::get('/demandeur/cin/{cin}', [DemandeurController::class, 'searchByCin'])
        ->name('demandeur.cin')
        ->where('cin', '[0-9]{12}');
});