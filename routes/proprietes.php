<?php

use App\Http\Controllers\ProprieteController;
use App\Http\Middleware\ValidateProprieteAction;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Propriétés Routes
|--------------------------------------------------------------------------
*/

Route::prefix('proprietes')->name('proprietes.')->group(function () {
    
    // Liste des propriétés d'un dossier
    Route::get('/dossier/{id_dossier}', [ProprieteController::class, 'index'])
        ->middleware('dossier.access:id_dossier')
        ->name('index');
    
    // ========================================================================
    // CRÉATION
    // ========================================================================
    Route::middleware([
        'district.access:create', 
        'check.dossier.closed:modify'
    ])->group(function () {
        Route::get('/create/{id}', [ProprieteController::class, 'create'])
            ->name('create');
        Route::post('/', [ProprieteController::class, 'store'])
            ->name('store');
        Route::post('/store-multiple', [ProprieteController::class, 'storeMultiple'])
            ->name('store-multiple');
    });
    
    // ========================================================================
    // CONSULTATION
    // ========================================================================
    Route::get('/{id}', [ProprieteController::class, 'show'])
        ->name('show');
    
    // ========================================================================
    // MODIFICATION
    // ========================================================================
    Route::middleware([
        'district.access:update', 
        'check.dossier.closed:modify',
        ValidateProprieteAction::class . ':modify'
    ])->group(function () {
        Route::get('/{id}/edit', [ProprieteController::class, 'edit'])
            ->name('edit');
        Route::put('/{id}', [ProprieteController::class, 'update'])
            ->name('update');
    });
    
    // ========================================================================
    // SUPPRESSION
    // ========================================================================
    Route::delete('/{id}', [ProprieteController::class, 'destroy'])
        ->middleware([
            'district.access:delete', 
            'dossier.access:id', 
            'check.dossier.closed:modify',
            ValidateProprieteAction::class . ':delete'
        ])
        ->name('destroy');
    
    // ========================================================================
    // ARCHIVAGE
    // ========================================================================
    Route::middleware([
        'district.access:archive', 
        'check.dossier.closed:modify'
    ])->group(function () {
        Route::post('/archive', [ProprieteController::class, 'archive'])
            ->name('archive');
        Route::post('/unarchive', [ProprieteController::class, 'unarchive'])
            ->name('unarchive');
    });
});