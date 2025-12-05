<?php

use App\Http\Controllers\PieceJointeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Pièces Jointes Routes
|--------------------------------------------------------------------------
| Gestion des fichiers attachés aux dossiers
*/

Route::prefix('pieces-jointes')->name('pieces-jointes.')->group(function () {
    
    // Liste
    Route::get('/', [PieceJointeController::class, 'index'])
        ->name('index');
    
    // Upload
    Route::post('/upload', [PieceJointeController::class, 'upload'])
        ->middleware('district.access:create')
        ->name('upload');
    
    // Consultation
    Route::get('/{id}/download', [PieceJointeController::class, 'download'])
        ->name('download');
    Route::get('/{id}/view', [PieceJointeController::class, 'view'])
        ->name('view');
    
    // Modification
    Route::put('/{id}', [PieceJointeController::class, 'update'])
        ->middleware('district.access:update')
        ->name('update');
    
    // Suppression
    Route::delete('/{id}', [PieceJointeController::class, 'destroy'])
        ->middleware('district.access:delete')
        ->name('destroy');
    
    // Vérification (admin)
    Route::post('/{id}/verify', [PieceJointeController::class, 'verify'])
        ->middleware('district.access:manage_users')
        ->name('verify');
});