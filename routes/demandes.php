<?php

use App\Http\Controllers\DemandeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Demandes (Documents) Routes
|--------------------------------------------------------------------------
*/

Route::prefix('demandes')->name('demandes.')->group(function () {
    
    // ========================================================================
    // CONSULTATION
    // ========================================================================
    Route::middleware('dossier.access:dossierId')->group(function () {
        Route::get('/dossier/{dossierId}', [DemandeController::class, 'index'])
            ->name('index');
        Route::get('/resume/{dossierId}', [DemandeController::class, 'resume'])
            ->name('resume');
    });
    
    // ========================================================================
    // CRÉATION
    // ========================================================================
    Route::middleware('district.access:create')->group(function () {
        Route::get('/create/{id}', [DemandeController::class, 'create'])
            ->name('create');
        Route::post('/', [DemandeController::class, 'store'])
            ->name('store');
    });
    
    // ========================================================================
    // TÉLÉCHARGEMENT
    // ========================================================================
    Route::get('/{id}/download', [DemandeController::class, 'download'])
        ->name('download');
    Route::get('/{id}/csf', [DemandeController::class, 'downloadCSF'])
        ->name('downloadCSF');
    
    // ========================================================================
    // ARCHIVAGE
    // ========================================================================
    Route::middleware('district.access:archive')->group(function () {
        Route::post('/archive', [DemandeController::class, 'archive'])
            ->name('archive');
        Route::post('/unarchive', [DemandeController::class, 'unarchive'])
            ->name('unarchive');
    });
    
    // ========================================================================
    // EXPORT
    // ========================================================================
    Route::middleware('district.access:export')->group(function () {
        Route::get('/{id}/export', [DemandeController::class, 'exportList'])
            ->name('export');
    });
});