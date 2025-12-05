<?php

use App\Http\Controllers\DossierController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Dossiers Routes
|--------------------------------------------------------------------------
*/

Route::prefix('dossiers')->name('dossiers')->group(function () {
    
    // Liste des dossiers
    Route::get('/', [DossierController::class, 'index']);
    
    // ========================================================================
    // CRÉATION
    // ========================================================================
    Route::middleware('district.access:create')->group(function () {
        Route::get('/create', [DossierController::class, 'create'])
            ->name('.create');
        Route::post('/', [DossierController::class, 'store'])
            ->name('.store');
    });
    
    // ========================================================================
    // CONSULTATION
    // ========================================================================
    Route::middleware('dossier.access:id')->group(function () {
        Route::get('/{id}', [DossierController::class, 'show'])
            ->name('.show');
        Route::get('/{id}/demandeurs', [DossierController::class, 'demandeurs'])
            ->name('.demandeurs');
        Route::get('/{id}/proprietes', [DossierController::class, 'proprietes'])
            ->name('.proprietes');
    });
    
    // ========================================================================
    // MODIFICATION
    // ========================================================================
    Route::middleware([
        'district.access:update', 
        'dossier.access:id', 
        'check.dossier.closed:modify'
    ])->group(function () {
        Route::get('/{id}/edit', [DossierController::class, 'edit'])
            ->name('.edit');
        Route::put('/{id}', [DossierController::class, 'update'])
            ->name('.update');
    });
    
    // ========================================================================
    // SUPPRESSION
    // ========================================================================
    Route::delete('/{id}', [DossierController::class, 'destroy'])
        ->middleware([
            'district.access:delete', 
            'dossier.access:id', 
            'check.dossier.closed:modify'
        ])
        ->name('.destroy');
    
    // ========================================================================
    // FERMETURE/RÉOUVERTURE
    // ========================================================================
    Route::middleware([
        'district.access:manage_users', 
        'dossier.access:id'
    ])->group(function () {
        Route::post('/{id}/close', [DossierController::class, 'close'])
            ->name('.close');
        Route::post('/{id}/reopen', [DossierController::class, 'reopen'])
            ->name('.reopen');
    });
});