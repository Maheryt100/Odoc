<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\LogsSettingsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Activity Logs Routes
|--------------------------------------------------------------------------
| Gestion complète des logs avec export et suppression
*/

Route::prefix('admin/activity-logs')
    ->name('admin.activity-logs.')
    ->middleware('auth')
    ->group(function () {

        // ========== CONSULTATION ==========
        Route::middleware('district.access:manage_users')->group(function () {

            Route::get('/', [ActivityLogController::class, 'index'])
                ->name('index');

            Route::get('/document-stats', [ActivityLogController::class, 'documentStats'])
                ->name('document-stats');

            Route::get('/user/{userId}', [ActivityLogController::class, 'userActivity'])
                ->name('user-activity');
        });

        // ========== SUPER ADMIN ==========
        Route::middleware('super.admin')->group(function () {

            Route::get('/settings', [LogsSettingsController::class, 'index'])
                ->name('settings');

            Route::put('/settings', [LogsSettingsController::class, 'update'])
                ->name('settings.update');

            Route::post('/export', [LogsSettingsController::class, 'export'])
                ->name('export');

            Route::get('/download/{filename}', [LogsSettingsController::class, 'download'])
                ->name('download');

            Route::delete('/exports/{filename}', [LogsSettingsController::class, 'deleteExport'])
                ->name('exports.delete');

            Route::post('/cleanup', [LogsSettingsController::class, 'cleanup'])
                ->name('cleanup');

            Route::get('/preview-cleanup', [LogsSettingsController::class, 'previewCleanup'])
                ->name('preview-cleanup');
        });
    });
