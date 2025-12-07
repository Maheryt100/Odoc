<?php

use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Dashboard\StatisticsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Dashboard / Statistics Routes 
|--------------------------------------------------------------------------
*/

// Page principale du dashboard
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->name('dashboard');

// Statistiques
Route::prefix('statistiques')->name('statistiques.')->group(function () {
    Route::get('/', [StatisticsController::class, 'index'])
        ->name('index');
    
    // Rafraîchissement des statistiques
    Route::get('/refresh', [StatisticsController::class, 'refresh'])
        ->name('refresh');
    
    // Export PDF
    Route::get('/export-pdf', [StatisticsController::class, 'exportPDF'])
        ->name('export-pdf');
    
    // Routes admin uniquement
    Route::middleware('can:access-all-districts')->group(function () {
        Route::get('/cache-stats', [StatisticsController::class, 'cacheStats'])
            ->name('cache-stats');
        
        Route::post('/warm-up', [StatisticsController::class, 'warmUpCache'])
            ->name('warm-up');
    });
});