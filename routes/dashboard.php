<?php

use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Dashboard\StatisticsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Dashboard / Statistics Routes 
|--------------------------------------------------------------------------
|
| Routes séparées pour :
| - Dashboard : Vue rapide (12 derniers mois, cache 5-10min)
| - Statistiques : Analyses détaillées avec filtres (cache 15-30min)
|
*/

// ============================================================================
// DASHBOARD - Vue d'ensemble rapide
// ============================================================================

// Route principale /dashboard (SANS prefix pour compatibilité)
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->name('dashboard.index')
    ->middleware(['auth', 'district.scope']);

// Routes supplémentaires avec prefix
Route::prefix('dashboard')->name('dashboard.')->middleware(['auth', 'district.scope'])->group(function () {
    // Rafraîchir les données (AJAX)
    Route::post('/refresh', [DashboardController::class, 'refresh'])
        ->name('refresh');
    
    // Routes admin uniquement
    Route::middleware('can:access-all-districts')->group(function () {
        // Gestion du cache
        Route::post('/clear-cache', [DashboardController::class, 'clearCache'])
            ->name('clear-cache');
        
        Route::get('/cache-stats', [DashboardController::class, 'cacheStats'])
            ->name('cache-stats');
    });
});

// ============================================================================
// STATISTIQUES - Analyses détaillées avec filtres
// ============================================================================

Route::prefix('statistiques')->name('statistiques.')->middleware(['auth', 'district.scope'])->group(function () {
    // Page principale (avec filtres période + district)
    Route::get('/', [StatisticsController::class, 'index'])
        ->name('index');
    
    // Rafraîchir avec filtres (AJAX)
    Route::post('/refresh', [StatisticsController::class, 'refresh'])
        ->name('refresh');
    
    // Export PDF
    Route::post('/export-pdf', [StatisticsController::class, 'exportPDF'])
        ->name('export-pdf');
    
    // Routes admin uniquement
    Route::middleware('can:access-all-districts')->group(function () {
        // Statistiques du cache
        Route::get('/cache-stats', [StatisticsController::class, 'cacheStats'])
            ->name('cache-stats');
        
        // Préchauffer le cache
        Route::post('/warm-up', [StatisticsController::class, 'warmUpCache'])
            ->name('warm-up');
    });
});