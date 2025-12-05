<?php

use App\Http\Controllers\AssociationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Associations Demandeur-Propriété Routes
|--------------------------------------------------------------------------
| Gestion des liens entre demandeurs et propriétés
*/

// ============================================================================
// LIAISON (CREATE)
// ============================================================================
Route::post('/association/link', [AssociationController::class, 'link'])
    ->middleware([
        'district.access:create', 
        'check.dossier.closed:modify',
        'validate.ordre'
    ])
    ->name('association.link');

// ============================================================================
// DISSOCIATION (DELETE)
// ============================================================================
Route::post('/association/dissociate', [AssociationController::class, 'dissociate'])
    ->name('association.dissociate');