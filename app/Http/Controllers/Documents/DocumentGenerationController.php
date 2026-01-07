<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\RecuReference;
use App\Models\DocumentGenere;
use Illuminate\Support\Facades\DB;
// use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

/**
 * REFACTORISÉ : Controller léger qui délègue aux controllers spécialisés
 * 
 * Ce controller NE FAIT PLUS de génération directe.
 * Il sert uniquement à :
 * 1. Afficher la page d'index avec les données
 * 2. Rediriger vers les controllers spécialisés
 * 3. Fournir des utilitaires communs (migration, etc.)
 */
class DocumentGenerationController extends Controller
{
    /**
     * Page principale avec chargement des documents existants
     */
    public function index($id_dossier)
    {
        $dossier = Dossier::with(['district'])->findOrFail($id_dossier);

        // Charger les propriétés avec leurs demandes actives
        $proprietes = Propriete::where('id_dossier', $id_dossier)
            ->with([
                'demandesActives.demandeur'
            ])
            ->get()
            ->map(function ($propriete) use ($dossier) {
                // Mapper les demandes vers demandeurs_lies
                $propriete->demandeurs_lies = $propriete->demandesActives->map(function ($demande) {
                    return [
                        'id' => $demande->id_demandeur,
                        'id_demande' => $demande->id,
                        'nom' => $demande->demandeur->nom_demandeur,
                        'prenom' => $demande->demandeur->prenom_demandeur ?? '',
                        'cin' => $demande->demandeur->cin,
                        'ordre' => $demande->ordre,
                        'status_consort' => $demande->status_consort,
                        'is_archived' => false,
                        'total_prix' => $demande->total_prix ?? 0,
                    ];
                });

                // Charger la référence de reçu externe
                $propriete->recu_reference = RecuReference::where('id_propriete', $propriete->id)
                    ->first();

                // Charger les documents générés
                $propriete->document_adv = DocumentGenere::where('type_document', DocumentGenere::TYPE_ADV)
                    ->where('id_propriete', $propriete->id)
                    ->where('id_district', $dossier->id_district)
                    ->where('status', DocumentGenere::STATUS_ACTIVE)
                    ->first();

                $propriete->document_requisition = DocumentGenere::where('type_document', DocumentGenere::TYPE_REQ)
                    ->where('id_propriete', $propriete->id)
                    ->where('id_district', $dossier->id_district)
                    ->where('status', DocumentGenere::STATUS_ACTIVE)
                    ->first();

                $propriete->has_active_demandeurs = $propriete->demandesActives->count() > 0;
                $propriete->has_archived_demandeurs = $propriete->demandesArchivees()->count() > 0;
                $propriete->has_recu_reference = !!$propriete->recu_reference;

                return $propriete;
            })
            ->filter(function($propriete) {
                return $propriete->has_active_demandeurs;
            })
            ->values();

        // Charger les demandeurs avec leurs CSF
        $demandeurs = $dossier->demandeurs()
            ->whereHas('demandesActives')
            ->get()
            ->map(function($demandeur) use ($dossier) {
                $demandeur->document_csf = DocumentGenere::where('type_document', DocumentGenere::TYPE_CSF)
                    ->where('id_demandeur', $demandeur->id)
                    ->where('id_district', $dossier->id_district)
                    ->where('status', DocumentGenere::STATUS_ACTIVE)
                    ->first();

                return $demandeur;
            });

        return Inertia::render('documents/Generate', [
            'dossier' => $dossier,
            'proprietes' => $proprietes,
            'demandeurs' => $demandeurs,
        ]);
    }

    /**
     * MIGRATION : Convertir les anciens formats de numéro de reçu
     * 
     * Cette méthode reste ici car elle concerne TOUS les types de documents
     * et nécessite une vue d'ensemble du système.
     */
    public function migrateOldRecuFormat()
    {
        // Log::info('Début migration format numéro reçu');
        
        DB::beginTransaction();
        
        try {
            $updated = 0;
            $errors = 0;
            
            $dossiers = Dossier::with(['documentsGeneres' => function($query) {
                $query->where('type_document', DocumentGenere::TYPE_RECU)
                    ->where('status', DocumentGenere::STATUS_ACTIVE)
                    ->orderBy('generated_at', 'asc');
            }])->get();
            
            foreach ($dossiers as $dossier) {
                $sequence = 1;
                
                foreach ($dossier->documentsGeneres as $recu) {
                    try {
                        $ancienNumero = $recu->numero_document;
                        
                        $nouveauNumero = sprintf(
                            '%03d/%s', 
                            $sequence, 
                            $dossier->numero_ouverture
                        );
                        
                        $exists = DocumentGenere::where('numero_document', $nouveauNumero)
                            ->where('id_dossier', $dossier->id)
                            ->where('id', '!=', $recu->id)
                            ->exists();
                        
                        if ($exists) {
                            // Log::error('Conflit de numéro', [
                            //     'recu_id' => $recu->id,
                            //     'numero_tente' => $nouveauNumero,
                            // ]);
                            $errors++;
                            continue;
                        }
                        
                        $recu->update([
                            'numero_document' => $nouveauNumero,
                            'metadata' => array_merge($recu->metadata ?? [], [
                                'ancien_numero' => $ancienNumero,
                                'migrated_at' => now()->toIso8601String(),
                                'sequence_recalculee' => true,
                            ])
                        ]);
                        
                        $updated++;
                        $sequence++;
                        
                        // Log::info('Reçu migré', [
                        //     'recu_id' => $recu->id,
                        //     'ancien' => $ancienNumero,
                        //     'nouveau' => $nouveauNumero,
                        // ]);
                        
                    } catch (\Exception $e) {
                        // Log::error('Erreur migration reçu', [
                        //     'recu_id' => $recu->id,
                        //     'error' => $e->getMessage(),
                        // ]);
                        $errors++;
                    }
                }
            }
            
            DB::commit();
            
            // Log::info('Migration terminée', [
            //     'dossiers_traites' => $dossiers->count(),
            //     'recus_updated' => $updated,
            //     'errors' => $errors,
            // ]);
            
            return response()->json([
                'success' => true,
                'dossiers_traites' => $dossiers->count(),
                'recus_updated' => $updated,
                'errors' => $errors,
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            // Log::error('Erreur critique migration', [
            //     'error' => $e->getMessage(),
            // ]);
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * STATISTIQUES
     */
    public function getStats($id_dossier)
    {
        $dossier = Dossier::findOrFail($id_dossier);
        
        return response()->json([
            'total_proprietes' => $dossier->proprietes()->count(),
            'adv_generes' => DocumentGenere::where('type_document', DocumentGenere::TYPE_ADV)
                ->where('id_dossier', $id_dossier)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->count(),
            'csf_generes' => DocumentGenere::where('type_document', DocumentGenere::TYPE_CSF)
                ->where('id_dossier', $id_dossier)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->count(),
            'requisitions_generees' => DocumentGenere::where('type_document', DocumentGenere::TYPE_REQ)
                ->where('id_dossier', $id_dossier)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->count(),
            'recu_references' => RecuReference::where('id_dossier', $id_dossier)->count(),
        ]);
    }
}