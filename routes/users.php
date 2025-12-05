<?php

use App\Http\Controllers\UserManagementController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| User Management Routes
|--------------------------------------------------------------------------
| Gestion des utilisateurs (admin uniquement)
*/

Route::prefix('users')
    ->name('users.')
    ->middleware('district.access:manage_users')
    ->group(function () {
        
        // Liste et consultation
        Route::get('/', [UserManagementController::class, 'index'])
            ->name('index');
        
        // Création
        Route::get('/create', [UserManagementController::class, 'create'])
            ->name('create');
        Route::post('/', [UserManagementController::class, 'store'])
            ->name('store');
        
        // Modification
        Route::get('/{id}/edit', [UserManagementController::class, 'edit'])
            ->name('edit');
        Route::put('/{id}', [UserManagementController::class, 'update'])
            ->name('update');
        
        // Actions
        Route::post('/{id}/toggle-status', [UserManagementController::class, 'toggleStatus'])
            ->name('toggleStatus');
        Route::post('/{id}/reset-password', [UserManagementController::class, 'resetPassword'])
            ->name('resetPassword');
        
        // Suppression
        Route::delete('/{id}', [UserManagementController::class, 'destroy'])
            ->name('destroy');
    });