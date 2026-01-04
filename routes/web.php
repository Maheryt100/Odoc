<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Routes modulaires organisées par fonctionnalité.
| Chaque section est dans un fichier séparé pour faciliter la maintenance.
|
*/

// ============================================================================
// ROUTES PUBLIQUES
// ============================================================================

Route::get('/', function () {
    return to_route('login');
})->name('home');

// Routes d'authentification
require __DIR__.'/auth.php';

// ============================================================================
// ROUTES AUTHENTIFIÉES
// ============================================================================

Route::middleware('auth')->group(function () {
    
    // ========================================================================
    // RECHERCHES GLOBALES (SANS FILTRE DISTRICT)
    // ========================================================================

    require __DIR__.'/search.php';
    
    // ========================================================================
    // ROUTES AVEC FILTRE DISTRICT
    // ========================================================================
    Route::middleware('district.scope')->group(function () {
        
        // Dashboard & Statistiques
        require __DIR__.'/dashboard.php';
        
        // Paramètres utilisateur (Profile, Password, Appearance)
        require __DIR__.'/settings.php';
        
        // Gestion des dossiers
        require __DIR__.'/dossiers.php';
        
        // Gestion des propriétés
        require __DIR__.'/proprietes.php';
        
        // Gestion des demandeurs
        require __DIR__.'/demandeurs.php';
        
        // Gestion des demandes (documents)
        require __DIR__.'/demandes.php';
        
        // Associations demandeur-propriété
        require __DIR__.'/associations.php';
        
        // Localisations et prix
        require __DIR__.'/locations.php';
        
        // Gestion des utilisateurs
        require __DIR__.'/users.php';
        
        // Génération de documents
        require __DIR__.'/documents.php';
        
        // Pièces jointes
        require __DIR__.'/pieces-jointes.php';
        
        // Logs d'activité
        require __DIR__.'/activity-logs.php';
        
        // Routes de compatibilité (anciennes routes - à deprecier progressivement)
        require __DIR__.'/legacy.php';

        // Route Topo Flux
        require __DIR__.'/topo-flux.php';
    });
});
Route::middleware(['auth', 'verified'])->group(function () {
    
    // TopoFlux - Imports terrain
    require __DIR__.'/topo-flux.php';
    
});