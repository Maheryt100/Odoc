<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Demandeur;
use App\Models\Propriete;
use App\Models\Dossier;
use App\Models\Demander;
use App\Models\DocumentGenere;
use App\Services\DeletionValidationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;

/**
 * API Controller
 * 
 * Centralise tous les endpoints API pour éviter la logique dans les routes.
 * Gère les validations, statistiques et vérifications via services.
 */
class ApiController extends Controller
{
    public function __construct(
        private DeletionValidationService $deletionService
    ) {}

    // ========================================================================
    // ASSOCIATIONS
    // ========================================================================

    /**
     * Obtenir toutes les associations d'un demandeur (tous dossiers)
     * 
     * @param int $id ID du demandeur
     * @return JsonResponse
     */
    public function getDemandeurAssociations(int $id): JsonResponse
    {
        try {
            $associations = DB::table('demander')
                ->join('proprietes', 'demander.id_propriete', '=', 'proprietes.id')
                ->join('dossiers', 'proprietes.id_dossier', '=', 'dossiers.id')
                ->where('demander.id_demandeur', $id)
                ->select(
                    'dossiers.id as dossier_id',
                    'dossiers.nom_dossier as dossier_nom',
                    'proprietes.lot',
                    'demander.status'
                )
                ->get();

            $grouped = $this->groupAssociationsByDossier($associations);

            return response()->json([
                'success' => true,
                'associations' => array_values($grouped),
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur getDemandeurAssociations', [
                'demandeur_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des associations'
            ], 500);
        }
    }

    /**
     * Obtenir tous les demandeurs d'une propriété avec détails complets
     * 
     * @param int $id ID de la propriété
     * @return JsonResponse
     */
    public function getProprieteDemandeursFull(int $id): JsonResponse
    {
        try {
            $demandeurs = DB::table('demander')
                ->join('demandeurs', 'demander.id_demandeur', '=', 'demandeurs.id')
                ->where('demander.id_propriete', $id)
                ->select(
                    'demandeurs.id',
                    'demandeurs.titre_demandeur',
                    'demandeurs.nom_demandeur',
                    'demandeurs.prenom_demandeur',
                    'demandeurs.cin',
                    'demander.status',
                    'demander.ordre'
                )
                ->orderBy('demander.ordre')
                ->get()
                ->map(fn($dem) => [
                    'id' => $dem->id,
                    'nom_complet' => trim("{$dem->titre_demandeur} {$dem->nom_demandeur} {$dem->prenom_demandeur}"),
                    'cin' => $dem->cin,
                    'status' => $dem->status,
                    'ordre' => $dem->ordre ?? 999,
                ]);

            return response()->json([
                'success' => true,
                'demandeurs' => $demandeurs,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur getProprieteDemandeursFull', [
                'propriete_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des demandeurs'
            ], 500);
        }
    }

    // ========================================================================
    // VALIDATION DE SUPPRESSION - DEMANDEURS
    // ========================================================================

    /**
     * Vérifier si un demandeur peut être retiré d'un dossier spécifique
     * 
     * @param int $id ID du demandeur
     * @param int $dossierId ID du dossier
     * @return JsonResponse
     */
    public function checkDemandeurRemove(int $id, int $dossierId): JsonResponse
    {
        try {
            $validation = $this->deletionService->validateDemandeurRemovalFromDossier($id, $dossierId);
            $demandeur = Demandeur::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'can_remove' => $validation['can_remove'],
                'reason' => $validation['reason'],
                'demandeur' => [
                    'id' => $demandeur->id,
                    'nom_complet' => $demandeur->nom_complet,
                    'cin' => $demandeur->cin,
                ],
                'details' => $validation['details'],
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur checkDemandeurRemove', [
                'demandeur_id' => $id,
                'dossier_id' => $dossierId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification : ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vérifier si un demandeur peut être supprimé définitivement (tous dossiers)
     * 
     * @param int $id ID du demandeur
     * @return JsonResponse
     */
    public function checkDemandeurDelete(int $id): JsonResponse
    {
        try {
            $validation = $this->deletionService->validateDemandeurDefinitiveDeletion($id);
            $demandeur = Demandeur::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'can_delete_completely' => $validation['can_delete'],
                'reason' => $validation['reason'],
                'demandeur' => [
                    'id' => $demandeur->id,
                    'nom_complet' => $demandeur->nom_complet,
                    'cin' => $demandeur->cin,
                ],
                'total_associations' => $validation['details']['total_associations'] ?? 0,
                'total_actives' => $validation['details']['total_actives'] ?? 0,
                'total_archivees' => $validation['details']['total_archivees'] ?? 0,
                'dossiers' => $validation['details']['dossiers'] ?? [],
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur checkDemandeurDelete', [
                'demandeur_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification : ' . $e->getMessage()
            ], 500);
        }
    }

    // ========================================================================
    // VALIDATION DE SUPPRESSION - PROPRIÉTÉS
    // ========================================================================

    /**
     * Vérifier si une propriété peut être supprimée
     * 
     * @param int $id ID de la propriété
     * @return JsonResponse
     */
    public function checkProprieteDelete(int $id): JsonResponse
    {
        try {
            $validation = $this->deletionService->validateProprieteDeletion($id);
            $propriete = Propriete::with('dossier')->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'can_delete' => $validation['can_delete'],
                'reason' => $validation['reason'],
                'is_archived' => $propriete->is_archived,
                'is_dossier_closed' => $propriete->dossier->is_closed ?? false,
                'propriete' => [
                    'id' => $propriete->id,
                    'lot' => $propriete->lot,
                    'titre' => $propriete->titre,
                    'contenance' => $propriete->contenance,
                ],
                'total_demandeurs_actifs' => $validation['details']['total_demandeurs_actifs'] ?? 0,
                'total_demandeurs_archives' => $validation['details']['total_demandeurs_archives'] ?? 0,
                'demandeurs_actifs' => $validation['details']['demandeurs_actifs'] ?? [],
                'demandeurs_archives' => $validation['details']['demandeurs_archives'] ?? [],
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur checkProprieteDelete', [
                'propriete_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification : ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir la disponibilité d'une propriété pour génération de documents
     * 
     * @param int $id ID de la propriété
     * @return JsonResponse
     */
    public function getProprieteAvailability(int $id): JsonResponse
    {
        try {
            $propriete = Propriete::with('dossier')->findOrFail($id);
            
            $demandesActives = Demander::where('id_propriete', $id)
                ->where('status', 'active')
                ->count();
            
            $demandesArchivees = Demander::where('id_propriete', $id)
                ->where('status', 'archive')
                ->count();
            
            $hasRecu = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
                ->where('id_propriete', $id)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->exists();
            
            [$status, $message] = $this->determineAvailabilityStatus($demandesActives, $demandesArchivees);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'propriete_id' => $id,
                    'status' => $status,
                    'message' => $message,
                    'has_recu' => $hasRecu,
                    'demandeurs' => [
                        'actifs' => $demandesActives,
                        'archives' => $demandesArchivees,
                        'total' => $demandesActives + $demandesArchivees,
                    ],
                    'can_generate' => [
                        'recu' => $status === 'available' && !$hasRecu,
                        'acte_vente' => $status === 'available' && $hasRecu,
                        'csf' => $status === 'available',
                        'requisition' => $demandesActives > 0,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur getProprieteAvailability', [
                'propriete_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification de disponibilité'
            ], 500);
        }
    }

    // ========================================================================
    // STATISTIQUES
    // ========================================================================

    /**
     * Obtenir les statistiques de documents d'un dossier
     * 
     * @param int $dossierId ID du dossier
     * @return JsonResponse
     */
    public function getDossierDocumentsStats(int $dossierId): JsonResponse
    {
        try {
            $dossier = Dossier::findOrFail($dossierId);
            
            $totalProprietes = $dossier->proprietes()->count();
            
            // Propriétés avec demandes actives
            $proprietesDisponibles = $dossier->proprietes()
                ->whereHas('demandesActives')
                ->count();
            
            // Propriétés acquises (toutes les demandes archivées, aucune active)
            $proprietesAcquises = $dossier->proprietes()
                ->whereHas('demandesArchivees')
                ->whereDoesntHave('demandesActives')
                ->count();
            
            // Propriétés sans aucune demande
            $proprietesSansDemandeur = $dossier->proprietes()
                ->whereDoesntHave('demandes')
                ->count();
            
            $stats = $this->getDocumentGenerationStats($dossierId);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'proprietes' => [
                        'total' => $totalProprietes,
                        'disponibles' => $proprietesDisponibles,
                        'acquises' => $proprietesAcquises,
                        'sans_demandeur' => $proprietesSansDemandeur,
                        'pourcentage_disponible' => $totalProprietes > 0 
                            ? round(($proprietesDisponibles / $totalProprietes) * 100, 1) 
                            : 0,
                    ],
                    'documents' => $stats,
                    'progression' => [
                        'recus_vs_proprietes' => $proprietesDisponibles > 0
                            ? round(($stats['recus'] / $proprietesDisponibles) * 100, 1)
                            : 0,
                        'adv_vs_recus' => $stats['recus'] > 0
                            ? round(($stats['actes_vente'] / $stats['recus']) * 100, 1)
                            : 0,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur getDossierDocumentsStats', [
                'dossier_id' => $dossierId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques'
            ], 500);
        }
    }

    // ========================================================================
    // MÉTHODES PRIVÉES
    // ========================================================================

    /**
     * Grouper les associations par dossier
     * 
     * @param \Illuminate\Support\Collection $associations
     * @return array
     */
    private function groupAssociationsByDossier($associations): array
    {
        $grouped = [];
        
        foreach ($associations as $assoc) {
            if (!isset($grouped[$assoc->dossier_id])) {
                $grouped[$assoc->dossier_id] = [
                    'dossier_id' => $assoc->dossier_id,
                    'dossier_nom' => $assoc->dossier_nom,
                    'lots' => [],
                    'actives' => 0,
                    'archivees' => 0,
                ];
            }
            
            $grouped[$assoc->dossier_id]['lots'][] = $assoc->lot;
            
            if ($assoc->status === 'active') {
                $grouped[$assoc->dossier_id]['actives']++;
            } else if ($assoc->status === 'archive') {
                $grouped[$assoc->dossier_id]['archivees']++;
            }
        }
        
        return $grouped;
    }

    /**
     * Déterminer le statut de disponibilité d'une propriété
     * 
     * @param int $actives Nombre de demandes actives
     * @param int $archivees Nombre de demandes archivées
     * @return array [status, message]
     */
    private function determineAvailabilityStatus(int $actives, int $archivees): array
    {
        if ($actives === 0 && $archivees > 0) {
            return ['all_archived', "Tous les demandeurs ({$archivees}) ont été archivés (acquis)"];
        }
        
        if ($actives === 0) {
            return ['no_demandeur', 'Aucun demandeur actif'];
        }
        
        return ['available', null];
    }

    /**
     * Obtenir les statistiques de génération de documents
     * 
     * @param int $dossierId ID du dossier
     * @return array
     */
    private function getDocumentGenerationStats(int $dossierId): array
    {
        $recus = DocumentGenere::where('id_dossier', $dossierId)
            ->where('type_document', DocumentGenere::TYPE_RECU)
            ->where('status', DocumentGenere::STATUS_ACTIVE)
            ->count();
        
        $adv = DocumentGenere::where('id_dossier', $dossierId)
            ->where('type_document', DocumentGenere::TYPE_ADV)
            ->where('status', DocumentGenere::STATUS_ACTIVE)
            ->count();
        
        $csf = DocumentGenere::where('id_dossier', $dossierId)
            ->where('type_document', DocumentGenere::TYPE_CSF)
            ->where('status', DocumentGenere::STATUS_ACTIVE)
            ->count();
        
        $req = DocumentGenere::where('id_dossier', $dossierId)
            ->where('type_document', DocumentGenere::TYPE_REQ)
            ->where('status', DocumentGenere::STATUS_ACTIVE)
            ->count();
        
        return [
            'recus' => $recus,
            'actes_vente' => $adv,
            'csf' => $csf,
            'requisitions' => $req,
            'total' => $recus + $adv + $csf + $req,
        ];
    }
}