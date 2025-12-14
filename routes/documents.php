<?php

use App\Http\Controllers\Documents\DocumentGenerationController;
use App\Http\Controllers\Documents\RecuController;
use App\Http\Controllers\Documents\ActeVenteController;
use App\Http\Controllers\Documents\CertificatController;
use App\Http\Controllers\Documents\RequisitionController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Config;

/*
|--------------------------------------------------------------------------
| Document Generation Routes - VERSION INCRÉMENTALE
|--------------------------------------------------------------------------
| Génération de documents avec possibilité de basculer entre ancien/nouveau système
| 
| FEATURE FLAG: 'documents.use_new_controllers'
| - true  = Utiliser les nouveaux controllers séparés
| - false = Utiliser l'ancien DocumentGenerationController
*/

Route::prefix('documents')->name('documents.')->group(function () {
    
    // ========================================================================
    // PAGE D'INDEX (commune aux deux systèmes)
    // ========================================================================
    Route::get('/generate/{id_dossier}', [DocumentGenerationController::class, 'index'])
        ->middleware('dossier.access:id_dossier')
        ->name('generate');
    
    // ========================================================================
    // FEATURE FLAG : ROUTER VERS ANCIEN OU NOUVEAU SYSTÈME
    // ========================================================================
    
    $useNewControllers = Config::get('documents.use_new_controllers', false);
    
    if ($useNewControllers) {
        // ====================================================================
        // NOUVEAU SYSTÈME (Controllers séparés)
        // ====================================================================
        
        // Reçus
        Route::get('/recu', [RecuController::class, 'generate'])->name('recu');
        Route::get('/recu/{id}/download', [RecuController::class, 'download'])->name('recu.download');
        Route::get('/recu/history/{id_propriete}', [RecuController::class, 'history'])->name('recu.history');
        
        // Actes de vente
        Route::get('/acte-vente', [ActeVenteController::class, 'generate'])->name('acte-vente');
        Route::get('/acte-vente/{id}/download', [ActeVenteController::class, 'download'])->name('acte-vente.download');
        
        // CSF
        Route::get('/csf', [CertificatController::class, 'generate'])->name('csf');
        Route::get('/csf/{id}/download', [CertificatController::class, 'download'])->name('csf.download');
        Route::get('/csf/history/{id_demandeur}', [CertificatController::class, 'history'])->name('csf.history');
        
        // Réquisitions
        Route::get('/requisition', [RequisitionController::class, 'generate'])->name('requisition');
        Route::get('/requisition/{id}/download', [RequisitionController::class, 'download'])->name('requisition.download');
        
    } else {
        // ====================================================================
        // ANCIEN SYSTÈME (DocumentGenerationController monolithique)
        // ====================================================================
        
        Route::get('/recu', [DocumentGenerationController::class, 'generateRecu'])->name('recu');
        Route::get('/acte-vente', [DocumentGenerationController::class, 'generateActeVente'])->name('acte-vente');
        Route::get('/csf', [DocumentGenerationController::class, 'generateCsf'])->name('csf');
        Route::get('/requisition', [DocumentGenerationController::class, 'generateRequisition'])->name('requisition');
        
        // Téléchargement (commun)
        Route::get('/recu/{id}/download', [DocumentGenerationController::class, 'downloadRecu'])->name('recu.download');
        
        // Historique (commun)
        Route::get('/recu/history/{id_propriete}', [DocumentGenerationController::class, 'getRecuHistory'])->name('recu.history');
    }

    // ========================================================================
    // ADMINISTRATION - MIGRATION FORMAT REÇU (commun aux deux systèmes)
    // ========================================================================
    Route::middleware('role:super_admin')->group(function () {
        
        Route::get('/admin/migrate-recu-format', function() {
            $stats = [
                'total_recus' => \App\Models\DocumentGenere::where('type_document', \App\Models\DocumentGenere::TYPE_RECU)
                    ->where('status', \App\Models\DocumentGenere::STATUS_ACTIVE)
                    ->count(),
                'dossiers_with_recus' => \App\Models\Dossier::has('documentsGeneres')->count(),
            ];
            
            return \Inertia\Inertia::render('Admin/MigrateRecuFormat', [
                'stats' => $stats
            ]);
        })->name('admin.migrate-recu-format.index');
        
        Route::post('/admin/migrate-recu-format', [DocumentGenerationController::class, 'migrateOldRecuFormat'])
            ->name('admin.migrate-recu-format.execute');
    });

});