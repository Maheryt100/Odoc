<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\LogsSettingsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Activity Logs Routes
|--------------------------------------------------------------------------
| Gestion complète des logs avec export, suppression et détection de surcharge
*/

Route::prefix('admin/activity-logs')
    ->name('admin.activity-logs.')
    ->middleware('auth')
    ->group(function () {

        // ========== CONSULTATION (Tous utilisateurs autorisés) ==========
        Route::middleware('district.access:manage_users')->group(function () {

            Route::get('/', [ActivityLogController::class, 'index'])
                ->name('index');

            Route::get('/document-stats', [ActivityLogController::class, 'documentStats'])
                ->name('document-stats');

            Route::get('/user/{userId}', [ActivityLogController::class, 'userActivity'])
                ->name('user-activity');
        });

        // ========== SUPER ADMIN UNIQUEMENT ==========
        Route::middleware('super.admin')->group(function () {

            // Paramètres
            Route::get('/settings', [LogsSettingsController::class, 'index'])
                ->name('settings');

            Route::put('/settings', [LogsSettingsController::class, 'update'])
                ->name('settings.update');

            // Export manuel
            Route::post('/export', [LogsSettingsController::class, 'export'])
                ->name('export');

            // Téléchargement
            Route::get('/download/{filename}', [LogsSettingsController::class, 'download'])
                ->name('download');

            // Suppression d'export manuel
            Route::delete('/exports/{filename}', [LogsSettingsController::class, 'deleteExport'])
                ->name('exports.delete');

            // Nettoyage/Archivage automatique (intelligent selon surcharge)
            Route::post('/cleanup', [LogsSettingsController::class, 'cleanup'])
                ->name('cleanup');

            // ✅ NOUVEAU : Suppression manuelle de logs spécifiques
            Route::delete('/delete-manually', [LogsSettingsController::class, 'deleteManually'])
                ->name('delete-manually');

            // ✅ NOUVEAU : Suppression manuelle par filtres (date, action, user...)
            Route::post('/delete-by-filters', [LogsSettingsController::class, 'deleteByFilters'])
                ->name('delete-by-filters');

            // Prévisualisation avant nettoyage
            Route::get('/preview-cleanup', [LogsSettingsController::class, 'previewCleanup'])
                ->name('preview-cleanup');
        });
    });