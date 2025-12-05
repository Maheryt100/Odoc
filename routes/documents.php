<?php

use App\Http\Controllers\DocumentGenerationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Document Generation Routes
|--------------------------------------------------------------------------
| Génération de documents (Reçus, Actes de Vente, CSF, Réquisitions)
*/

Route::prefix('documents')->name('documents.')->group(function () {
    
    // ========================================================================
    // PAGE D'INDEX
    // ========================================================================
    Route::get('/generate/{id_dossier}', [DocumentGenerationController::class, 'index'])
        ->middleware('dossier.access:id_dossier')
        ->name('generate');
    
    // ========================================================================
    // GÉNÉRATION DE DOCUMENTS
    // ========================================================================
    // Note: Ces routes n'ont PAS de middleware 'check.dossier.closed'
    // car elles sont en lecture seule (téléchargement)
    
    Route::get('/recu', [DocumentGenerationController::class, 'generateRecu'])
        ->name('recu');
    
    Route::get('/acte-vente', [DocumentGenerationController::class, 'generateActeVente'])
        ->name('acte-vente');
    
    Route::get('/csf', [DocumentGenerationController::class, 'generateCsf'])
        ->name('csf');
    
    Route::get('/requisition', [DocumentGenerationController::class, 'generateRequisition'])
        ->name('requisition');
    
    // ========================================================================
    // TÉLÉCHARGEMENT DE REÇUS EXISTANTS
    // ========================================================================
    Route::get('/recu/{id}/download', [DocumentGenerationController::class, 'downloadRecu'])
        ->name('recu.download');
    
    // ========================================================================
    // HISTORIQUE
    // ========================================================================
    Route::get('/recu/history/{id_propriete}', [DocumentGenerationController::class, 'getRecuHistory'])
        ->name('recu.history');
});