<?php

use App\Http\Controllers\AssociationController;
use Illuminate\Support\Facades\Route;

// ============================================================================
// LIAISON (CREATE)
// ============================================================================
Route::post('/association/link', [AssociationController::class, 'link'])
    ->middleware([
        'district.access:create', 
        'check.dossier.closed:modify',
    ])
    ->name('association.link');

// ============================================================================
// DISSOCIATION (DELETE)
// ============================================================================
Route::post('/association/dissociate', [AssociationController::class, 'dissociate'])
    ->middleware([
        'district.access:delete',
        'check.dossier.closed:modify',
    ])
    ->name('association.dissociate');