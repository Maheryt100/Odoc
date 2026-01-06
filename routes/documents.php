<?php

use App\Http\Controllers\Documents\DocumentGenerationController;
use App\Http\Controllers\Documents\ActeVenteController;
use App\Http\Controllers\Documents\CertificatController;
use App\Http\Controllers\Documents\RequisitionController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Document Generation Routes - VERSION CORRIGÉE
|--------------------------------------------------------------------------
*/

Route::prefix('documents')->name('documents.')->group(function () {

    // ========================================================================
    // PAGE D'INDEX
    // ========================================================================
    Route::get('/generate/{id_dossier}', [DocumentGenerationController::class, 'index'])
        ->middleware('dossier.access:id_dossier')
        ->name('generate');

    // ========================================================================
    // STATISTIQUES
    // ========================================================================
    Route::get('/stats/{id_dossier}', [DocumentGenerationController::class, 'getStats'])
        ->name('stats');

    // ========================================================================
    // ✅ VÉRIFICATION UNICITÉ NUMÉRO DE REÇU
    // ========================================================================
    Route::post('/check-recu-numero', function (Request $request) {
        $validated = $request->validate([
            'numero_recu' => 'required|string',
            'id_dossier' => 'required|exists:dossiers,id',
        ]);
        
        $exists = \App\Models\RecuReference::where('numero_recu', $validated['numero_recu'])
            ->where('id_dossier', $validated['id_dossier'])
            ->first();
        
        return response()->json([
            'exists' => !!$exists,
            'proprietaire' => $exists ? ($exists->propriete->proprietaire ?? 'inconnu') : null,
        ]);
    })->name('check-recu-numero');

    // ========================================================================
    // ✅ ACTES DE VENTE (avec numéro de reçu externe)
    // ========================================================================
    Route::prefix('acte-vente')->name('acte-vente.')->group(function () {
        // ✅ CORRECTION : Génération en POST
        Route::post('/generate', [ActeVenteController::class, 'generate'])
            ->name('generate');
        
        // Téléchargement
        Route::get('/{id}/download', [ActeVenteController::class, 'download'])
            ->name('download');
        
        // Régénération
        Route::post('/{id}/regenerate', [ActeVenteController::class, 'regenerate'])
            ->name('regenerate');
    });

    // ========================================================================
    // CSF
    // ========================================================================
    Route::prefix('csf')->name('csf.')->group(function () {
        Route::get('/generate', [CertificatController::class, 'generate'])
            ->name('generate');
        
        Route::get('/{id}/download', [CertificatController::class, 'download'])
            ->name('download');
        
        Route::post('/{id}/regenerate', [CertificatController::class, 'regenerate'])
            ->name('regenerate');
        
        Route::get('/history/{id_demandeur}', [CertificatController::class, 'history'])
            ->name('history');
    });

    // ========================================================================
    // RÉQUISITIONS
    // ========================================================================
    Route::prefix('requisition')->name('requisition.')->group(function () {
        Route::get('/generate', [RequisitionController::class, 'generate'])
            ->name('generate');
        
        Route::get('/{id}/download', [RequisitionController::class, 'download'])
            ->name('download');
        
        Route::post('/{id}/regenerate', [RequisitionController::class, 'regenerate'])
            ->name('regenerate');
    });

    // ========================================================================
    // ADMINISTRATION
    // ========================================================================
    Route::middleware('role:super_admin')
        ->prefix('admin')
        ->name('admin.')
        ->group(function () {

            // Vérifier l'intégrité des fichiers
            Route::get('/check-files-integrity', function () {
                $documents = \App\Models\DocumentGenere::where('status', \App\Models\DocumentGenere::STATUS_ACTIVE)->get();

                $missing = $documents->filter(fn ($doc) => !$doc->fileExists())->count();
                $total   = $documents->count();

                return response()->json([
                    'total'                => $total,
                    'missing'              => $missing,
                    'integrity_percentage' => $total > 0 ? round((($total - $missing) / $total) * 100, 2) : 100,
                ]);
            })->name('check-files-integrity');

            // Nettoyer les documents obsolètes
            Route::post('/cleanup-obsolete', function () {
                $deleted = \App\Models\DocumentGenere::where('status', \App\Models\DocumentGenere::STATUS_OBSOLETE)
                    ->delete();

                return response()->json([
                    'success' => true,
                    'deleted' => $deleted,
                ]);
            })->name('cleanup-obsolete');

            // Migration des numéros de reçu (ancien système vers nouveau)
            Route::post('/migrate-recu-format', [DocumentGenerationController::class, 'migrateOldRecuFormat'])
                ->name('migrate-recu-format');
        });

    // ========================================================================
    // ENDPOINT GÉNÉRIQUE : Régénérer n'importe quel document
    // ========================================================================
    Route::post('/regenerate-document/{id}', function ($id) {
        $document = \App\Models\DocumentGenere::findOrFail($id);

        try {
            $response = match ($document->type_document) {
                \App\Models\DocumentGenere::TYPE_ADV  => app(ActeVenteController::class)->regenerate($document->id),
                \App\Models\DocumentGenere::TYPE_CSF  => app(CertificatController::class)->regenerate($document->id),
                \App\Models\DocumentGenere::TYPE_REQ  => app(RequisitionController::class)->regenerate($document->id),
                default => throw new \Exception('Type de document non supporté : ' . $document->type_document),
            };

            return response()->json([
                'success' => true,
                'message' => 'Document régénéré avec succès',
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Erreur régénération document', [
                'document_id' => $id,
                'type' => $document->type_document,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    })->name('regenerate-document');
});