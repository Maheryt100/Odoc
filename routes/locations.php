<?php

use App\Http\Controllers\DistrictController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Localisations et Prix Routes
|--------------------------------------------------------------------------
| Gestion des districts et configuration des prix
*/

Route::middleware('district.access:configure_prices')->group(function () {
    
    // Routes principales
    Route::prefix('location')->name('location.')->group(function () {
        Route::get('/', [DistrictController::class, 'index'])
            ->name('index');
        Route::get('/{id}', [DistrictController::class, 'show'])
            ->name('show');
        Route::get('/search', [DistrictController::class, 'search'])
            ->name('search');
        
        Route::post('/update', [DistrictController::class, 'update'])
            ->name('update');
        Route::post('/bulk-update', [DistrictController::class, 'bulkUpdate'])
            ->name('bulkUpdate');
        Route::post('/reset', [DistrictController::class, 'resetPrices'])
            ->name('reset');
        
        Route::get('/export', [DistrictController::class, 'export'])
            ->name('export');
    });
    
    // ========================================================================
    // ROUTES DE COMPATIBILITÉ (anciennes URLs)
    // ========================================================================
    Route::redirect('/circonscription', '/location')
        ->name('circonscription.index');
    
    Route::post('/circonscription/update', [DistrictController::class, 'update'])
        ->name('circonscription.update');
    Route::post('/circonscription/bulk-update', [DistrictController::class, 'bulkUpdate'])
        ->name('circonscription.bulkUpdate');
    Route::post('/circonscription/reset', [DistrictController::class, 'resetPrices'])
        ->name('circonscription.reset');
});