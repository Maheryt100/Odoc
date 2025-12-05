<?php

use App\Http\Controllers\ActivityLogController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Activity Logs Routes
|--------------------------------------------------------------------------
| Consultation des logs d'activité (admin uniquement)
*/

Route::prefix('admin/activity-logs')
    ->name('admin.activity-logs.')
    ->middleware('district.access:manage_users')
    ->group(function () {
        
        // Liste des logs
        Route::get('/', [ActivityLogController::class, 'index'])
            ->name('index');
        
        // Statistiques documents
        Route::get('/document-stats', [ActivityLogController::class, 'documentStats'])
            ->name('document-stats');
        
        // Activité d'un utilisateur
        Route::get('/user/{userId}', [ActivityLogController::class, 'userActivity'])
            ->name('user-activity');
        
        // Export
        Route::get('/export', [ActivityLogController::class, 'export'])
            ->name('export');
    });