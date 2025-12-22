<?php

use App\Http\Controllers\DemandeurController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes de Recherche Globale
|--------------------------------------------------------------------------
| Ces routes NE DOIVENT PAS être filtrées par district car elles servent
| à rechercher des données dans TOUTE la base de données.
| 
| ATTENTION : Utilisées uniquement pour :
| - Auto-complétion de formulaires
| - Recherche de demandeurs existants
| - Éviter les doublons
*/

Route::middleware('auth')->prefix('search')->name('search.')->group(function () {
    
    /**
     * 🔍 RECHERCHE DEMANDEUR PAR CIN - GLOBAL (SANS FILTRE DISTRICT)
     * 
     * Cette route est VOLONTAIREMENT en dehors du middleware 'district.scope'
     * pour permettre la détection des demandeurs dans TOUS les districts.
     * 
     * Cas d'usage :
     * 1. Un demandeur de District A demande une propriété dans District B
     * 2. Éviter la création de doublons (même personne, même CIN)
     * 3. Mise à jour automatique des informations
     * 
     * Sécurité :
     * - Lecture seule (GET)
     * - Authentification requise
     * - Pas de modification possible
     * - Retourne uniquement les données publiques
     */
    Route::get('/demandeur/cin/{cin}', [DemandeurController::class, 'searchByCin'])
        ->name('demandeur.cin')
        ->where('cin', '[0-9]{12}'); // Validation : exactement 12 chiffres
    
    /**
     * 🔍 RECHERCHE DEMANDEUR PAR NOM - GLOBAL (OPTIONNEL)
     * 
     * Pour recherche par nom/prénom si nécessaire dans le futur
     */
    // Route::get('/demandeur/nom', [DemandeurController::class, 'searchByName'])
    //     ->name('demandeur.nom');
});