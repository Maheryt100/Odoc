<?php

use App\Http\Controllers\DemandeurProprieteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Legacy Routes
|--------------------------------------------------------------------------
| Anciennes routes conservées pour la compatibilité
| ⚠️ À DEPRECIER PROGRESSIVEMENT - Utiliser les nouvelles routes à la place
*/

Route::middleware([
    'district.access:create', 
    'check.dossier.closed:modify'
])->group(function () {
    
    // ========================================================================
    // ANCIEN SYSTÈME DE LIAISON (remplacé par AssociationController)
    // ========================================================================
    
    Route::get('/nouveau-lot/{id}', [DemandeurProprieteController::class, 'create'])
        ->name('nouveau-lot.create');
    
    Route::post('/nouveau-lot', [DemandeurProprieteController::class, 'store'])
        ->name('nouveau-lot.store');
    
    Route::get('/lier-demandeur/{id}/{id_demandeur?}/{id_propriete?}', [DemandeurProprieteController::class, 'linkExisting'])
        ->name('lier-demandeur.create');
    
    Route::post('/lier-demandeur/search', [DemandeurProprieteController::class, 'searchToLink'])
        ->name('lier-demandeur.search');
    
    Route::post('/lier-demandeur/store', [DemandeurProprieteController::class, 'storeLink'])
        ->name('lier-demandeur.store');
    
    Route::get('/ajouter-demandeur/{id}/{id_propriete?}', [DemandeurProprieteController::class, 'addToProperty'])
        ->name('ajouter-demandeur.create');
    
    Route::post('/ajouter-demandeur/store', [DemandeurProprieteController::class, 'storeToProperty'])
        ->name('ajouter-demandeur.store');
});