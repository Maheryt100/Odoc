<?php

// use App\Http\Controllers\Api\ApiController;
// use App\Http\Controllers\AssociationController;
// use App\Http\Controllers\DemandeurController;
// use App\Http\Controllers\GlobalSearchController;
// use Illuminate\Support\Facades\Route;

// Route::middleware(['auth', 'district.scope'])->name('api.')->group(function () {
    
//     // ========================================================================
//     // VALIDATION DE SUPPRESSION - PRIORITAIRE
//     // ========================================================================
    
//     // ✅ Demandeur - Retrait d'un dossier
//     // URL: /api/demandeur/{id}/check-remove?dossierId={dossierId}
//     Route::get('/demandeur/{id}/check-remove', [ApiController::class, 'checkDemandeurRemove'])
//         ->name('demandeur.check-remove');
    
//     // ✅ Demandeur - Suppression définitive
//     // URL: /api/demandeur/{id}/check-delete
//     Route::get('/demandeur/{id}/check-delete', [ApiController::class, 'checkDemandeurDelete'])
//         ->name('demandeur.check-delete');
    
//     // ✅ Propriété - Vérification suppression
//     // URL: /api/propriete/{id}/check-delete
//     Route::get('/propriete/{id}/check-delete', [ApiController::class, 'checkProprieteDelete'])
//         ->name('propriete.check-delete');
    
//     // ✅ Dossier - Vérification suppression
//     Route::get('/dossier/{id}/check-delete', [ApiController::class, 'checkDossierDelete'])
//         ->name('dossier.check-delete');
    
//     // ========================================================================
//     // RECHERCHE DEMANDEURS
//     // ========================================================================
    
//     Route::get('/demandeur/search-by-cin/{cin}', [DemandeurController::class, 'searchByCin'])
//         ->name('demandeur.search-by-cin');
    
//     // ========================================================================
//     // ASSOCIATIONS
//     // ========================================================================
    
//     Route::get('/demandeur/{id_demandeur}/proprietes', [AssociationController::class, 'getDemandeurProprietes'])
//         ->name('demandeur.proprietes');
    
//     Route::get('/propriete/{id_propriete}/demandeurs', [AssociationController::class, 'getProprieteDemandeurs'])
//         ->name('propriete.demandeurs');
    
//     Route::get('/demandeur/{id}/associations', [ApiController::class, 'getDemandeurAssociations'])
//         ->name('demandeur.associations');
    
//     Route::get('/propriete/{id}/demandeurs-full', [ApiController::class, 'getProprieteDemandeursFull'])
//         ->name('propriete.demandeurs-full');
    
//     Route::get('/propriete/{id}/availability', [ApiController::class, 'getProprieteAvailability'])
//         ->name('propriete.availability');
    
    
//     // ========================================================================
//     // STATISTIQUES
//     // ========================================================================
    
//     Route::get('/dossier/{id_dossier}/documents/stats', [ApiController::class, 'getDossierDocumentsStats'])
//         ->name('dossier.documents.stats');
// });