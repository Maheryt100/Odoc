<?php

use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Dashboard\StatisticsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Dashboard Routes
|--------------------------------------------------------------------------
*/

// Page principale du dashboard
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->name('dashboard');

// Statistiques
Route::prefix('statistiques')->name('statistiques.')->group(function () {
    Route::get('/', [StatisticsController::class, 'index'])
        ->name('index');
    
    Route::post('/export-pdf', [StatisticsController::class, 'exportPDF'])
        ->name('export-pdf');
});