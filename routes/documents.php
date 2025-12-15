<?php

use App\Http\Controllers\Documents\DocumentGenerationController;
use App\Http\Controllers\Documents\RecuController;
use App\Http\Controllers\Documents\ActeVenteController;
use App\Http\Controllers\Documents\CertificatController;
use App\Http\Controllers\Documents\RequisitionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Document Generation Routes - VERSION REFACTORISÉE
|--------------------------------------------------------------------------
*/

Route::prefix('documents')->name('documents.')->group(function () {

    // ========================================================================
    // PAGE D'INDEX (commune aux deux systèmes)
    // ========================================================================
    Route::get('/generate/{id_dossier}', [DocumentGenerationController::class, 'index'])
        ->middleware('dossier.access:id_dossier')
        ->name('generate');

    // ========================================================================
    // STATISTIQUES (commune)
    // ========================================================================
    Route::get('/stats/{id_dossier}', [DocumentGenerationController::class, 'getStats'])
        ->name('stats');

    // ========================================================================
    // SYSTÈME UNIFIÉ (Controllers séparés)
    // ========================================================================

    // ===== REÇUS =====
    Route::prefix('recu')->name('recu.')->group(function () {
        Route::get('/', [RecuController::class, 'generate'])->name('generate');
        Route::get('/{id}/download', [RecuController::class, 'download'])->name('download');
        Route::post('/{id}/regenerate', [RecuController::class, 'regenerate'])->name('regenerate'); // ✅ AJOUTÉ
        Route::get('/history/{id_propriete}', [RecuController::class, 'history'])->name('history');
    });

    // ===== ACTES DE VENTE =====
    Route::prefix('acte-vente')->name('acte-vente.')->group(function () {
        Route::get('/', [ActeVenteController::class, 'generate'])->name('generate');
        Route::get('/{id}/download', [ActeVenteController::class, 'download'])->name('download');
        Route::post('/{id}/regenerate', [ActeVenteController::class, 'regenerate'])->name('regenerate'); // ✅ AJOUTÉ (si supporté)
    });

    // ===== CSF =====
    Route::prefix('csf')->name('csf.')->group(function () {
        Route::get('/', [CertificatController::class, 'generate'])->name('generate');
        Route::get('/{id}/download', [CertificatController::class, 'download'])->name('download');
        Route::post('/{id}/regenerate', [CertificatController::class, 'regenerate'])->name('regenerate'); // ✅ AJOUTÉ
        Route::get('/history/{id_demandeur}', [CertificatController::class, 'history'])->name('history');
    });

    // ===== RÉQUISITIONS =====
    Route::prefix('requisition')->name('requisition.')->group(function () {
        Route::get('/', [RequisitionController::class, 'generate'])->name('generate');
        Route::get('/{id}/download', [RequisitionController::class, 'download'])->name('download');
        Route::post('/{id}/regenerate', [RequisitionController::class, 'regenerate'])->name('regenerate'); // ✅ AJOUTÉ
    });

    // ========================================================================
    // ADMINISTRATION - MIGRATION & MAINTENANCE
    // ========================================================================
    Route::middleware('role:super_admin')
        ->prefix('admin')
        ->name('admin.')
        ->group(function () {

            // Page migration format reçu
            Route::get('/migrate-recu-format', function () {
                $stats = [
                    'total_recus' => \App\Models\DocumentGenere::where('type_document', \App\Models\DocumentGenere::TYPE_RECU)
                        ->where('status', \App\Models\DocumentGenere::STATUS_ACTIVE)
                        ->count(),
                    'dossiers_with_recus' => \App\Models\Dossier::has('documentsGeneres')->count(),
                ];

                return \Inertia\Inertia::render('Admin/MigrateRecuFormat', [
                    'stats' => $stats,
                ]);
            })->name('migrate-recu-format.index');

            // Exécuter la migration
            Route::post('/migrate-recu-format', [DocumentGenerationController::class, 'migrateOldRecuFormat'])
                ->name('migrate-recu-format.execute');

            // Nettoyer les documents obsolètes
            Route::post('/cleanup-obsolete', function () {
                $deleted = \App\Models\DocumentGenere::where('status', \App\Models\DocumentGenere::STATUS_OBSOLETE)
                    ->delete();

                return response()->json([
                    'success' => true,
                    'deleted' => $deleted,
                ]);
            })->name('cleanup-obsolete');

            // Vérifier l'intégrité des fichiers (version simple admin)
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
        });

    // ========================================================================
    // ENDPOINT PUBLIC : Vérifier l'intégrité des fichiers en détail
    // ========================================================================
    Route::get('/check-files-integrity-detailed', function () {
        $documents = \App\Models\DocumentGenere::where('status', \App\Models\DocumentGenere::STATUS_ACTIVE)->get();

        $stats = [
            'total'      => $documents->count(),
            'valid'      => $documents->filter(fn ($d) => $d->hasValidFile())->count(),
            'missing'    => $documents->filter(fn ($d) => !$d->fileExists())->count(),
            'corrupted'  => $documents->filter(fn ($d) => $d->fileExists() && !$d->hasValidFile())->count(),
        ];

        $stats['integrity_percentage'] = $stats['total'] > 0
            ? round(($stats['valid'] / $stats['total']) * 100, 2)
            : 100;

        $problematicDocs = $documents
            ->filter(fn ($d) => !$d->hasValidFile())
            ->map(function ($doc) {
                return [
                    'id'             => $doc->id,
                    'type'           => $doc->type_document,
                    'numero'         => $doc->numero_document,
                    'created'        => $doc->generated_at->format('d/m/Y'),
                    'downloads'      => $doc->download_count,
                    'can_regenerate' => in_array($doc->type_document, ['RECU', 'CSF', 'REQ']),
                ];
            })
            ->values();

        return response()->json([
            'stats'                 => $stats,
            'problematic_documents' => $problematicDocs,
        ]);
    })->name('check-files-integrity.detailed');

    // ========================================================================
    // ✅ NOUVEAU : Régénérer un document spécifique (route générique)
    // ========================================================================
    Route::post('/regenerate-document/{id}', function ($id) {
        $document = \App\Models\DocumentGenere::findOrFail($id);

        if ($document->type_document === 'ADV') {
            return response()->json([
                'success' => false,
                'message' => 'Les ADV nécessitent une régénération manuelle',
            ], 400);
        }

        try {
            // Déléguer au controller approprié
            $response = match ($document->type_document) {
                'RECU' => app(RecuController::class)->regenerate($document->id),
                'CSF'  => app(CertificatController::class)->regenerate($document->id),
                'REQ'  => app(RequisitionController::class)->regenerate($document->id),
                default => throw new \Exception('Type non supporté'),
            };

            return response()->json([
                'success' => true,
                'message' => 'Document régénéré avec succès',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    })->name('regenerate-document');
});