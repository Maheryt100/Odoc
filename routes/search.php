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
    // CORRECTION: Utilise le bon contrôleur et méthode
    Route::get('/demandeur/cin/{cin}', [DemandeurController::class, 'searchByCin'])
        ->name('demandeur.cin')
        ->where('cin', '[0-9]{12}');
});

/*
|--------------------------------------------------------------------------
| Routes API pour recherche (sans middleware 'search.log')
|--------------------------------------------------------------------------
| Utilisées par les composants React et FastAPI
*/

Route::middleware('auth')->prefix('api/search')->name('api.search.')->group(function () {
    
    // ✅ Recherche demandeur par CIN (format JSON pour React)
    Route::get('/demandeur/cin/{cin}', function($cin) {
        return app(DemandeurController::class)->searchByCin2($cin);
    })
    ->name('demandeur.cin')
    ->where('cin', '[0-9]{12}');
    
    // ✅ Recherche propriété par lot dans un dossier
    Route::get('/propriete/lot/{id_dossier}/{lot}', function($id_dossier, $lot) {
        $propriete = \App\Models\Propriete::where('id_dossier', $id_dossier)
            ->where('lot', strtoupper(trim($lot)))
            ->first();
        
        if (!$propriete) {
            return response()->json([
                'found' => false,
                'message' => 'Aucune propriété trouvée avec ce lot'
            ]);
        }
        
        return response()->json([
            'found' => true,
            'message' => 'Propriété existante détectée',
            'propriete' => $propriete
        ]);
    })
    ->name('propriete.lot');
});