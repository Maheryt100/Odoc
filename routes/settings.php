<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Settings Routes
|--------------------------------------------------------------------------
| Paramètres utilisateur: profil, mot de passe, apparence
*/

Route::prefix('settings')->name('settings.')->group(function () {
    
    // Redirection par défaut vers le profil
    Route::redirect('/', '/settings/profile');
    
    // Profil utilisateur
    Route::get('/profile', [ProfileController::class, 'edit'])
        ->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])
        ->name('profile.update');
    
    // Mot de passe
    Route::get('/password', [PasswordController::class, 'edit'])
        ->name('password.edit');
    Route::put('/password', [PasswordController::class, 'update'])
        ->name('password.update');
    
    // Apparence
    Route::get('/appearance', fn() => Inertia::render('settings/appearance'))
        ->name('appearance');
});