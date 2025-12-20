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

Route::prefix('settings')->group(function () {
    
    // Redirection par défaut vers le profil
    Route::redirect('/', '/settings/profile');
    
    // ============ PROFIL UTILISATEUR ============
    // GET: Afficher le formulaire
    Route::get('/profile', [ProfileController::class, 'edit'])
        ->name('settings.profile.edit');
    
    // PATCH: Mettre à jour le profil (utilisé par Inertia)
    Route::patch('/profile', [ProfileController::class, 'update'])
        ->name('profile.update');
    
    // ============ MOT DE PASSE ============
    // GET: Afficher le formulaire
    Route::get('/password', [PasswordController::class, 'edit'])
        ->name('settings.password.edit');
    
    // PUT: Mettre à jour le mot de passe (utilisé par Inertia)
    Route::put('/password', [PasswordController::class, 'update'])
        ->name('password.update');
    
    // ============ APPARENCE ============
    Route::get('/appearance', fn() => Inertia::render('settings/appearance'))
        ->name('settings.appearance');
});