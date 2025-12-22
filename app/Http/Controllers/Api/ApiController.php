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
// use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;


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
            // Log::error('Erreur getDemandeurAssociations', [
            //     'demandeur_id' => $id,
            //     'error' => $e->getMessage(),
            //     'trace' => $e->getTraceAsString()
            // ]);
            
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
            // Log::error('Erreur getProprieteDemandeursFull', [
            //     'propriete_id' => $id,
            //     'error' => $e->getMessage()
            // ]);
            
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
     * ✅ Vérifier si un demandeur peut être retiré d'un dossier
     * 
     * @param int $id ID du demandeur
     * @return JsonResponse
     */
    public function checkDemandeurRemove(int $id): JsonResponse
    {
        try {
            // ✅ Récupérer dossierId depuis query string
            $dossierId = request()->query('dossierId');
            
            if (!$dossierId) {
                return response()->json([
                    'error' => 'dossierId manquant dans la requête'
                ], 400);
            }
            
            $demandeur = Demandeur::findOrFail($id);
            
            // Propriétés liées dans ce dossier spécifique
            $demandes = $demandeur->demandes()
                ->whereHas('propriete', fn($q) => $q->where('id_dossier', $dossierId))
                ->with('propriete')
                ->get();
            
            $lotsActifs = [];
            $lotsArchives = [];
            
            foreach ($demandes as $demande) {
                if ($demande->status === 'active') {
                    $lotsActifs[] = $demande->propriete->lot;
                } else {
                    $lotsArchives[] = $demande->propriete->lot;
                }
            }
            
            $canRemove = empty($lotsActifs) && empty($lotsArchives);
            
            // ✅ Structure attendue par le frontend
            return response()->json([
                'can_remove' => $canRemove,
                'lots_actifs' => $lotsActifs,
                'lots_archives' => $lotsArchives,
                'total_proprietes' => count($lotsActifs) + count($lotsArchives),
                'demandeur' => [
                    'id' => $demandeur->id,
                    'nom_complet' => $demandeur->nom_complet,
                    'cin' => $demandeur->cin,
                ],
            ], 200);
            
        } catch (\Exception $e) {
            
            return response()->json([
                'error' => 'Erreur lors de la vérification',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Vérifier si un demandeur peut être supprimé définitivement
     * Structure alignée avec SmartDeleteDemandeurDialog.tsx
     */
    public function checkDemandeurDelete(int $id): JsonResponse
    {
        try {
            $demandeur = Demandeur::with(['demandes.propriete.dossier'])->findOrFail($id);
            
            $demandesActives = $demandeur->demandes()
                ->where('status', 'active')
                ->with('propriete.dossier')
                ->get();
            
            $demandesArchivees = $demandeur->demandes()
                ->where('status', 'archive')
                ->with('propriete.dossier')
                ->get();
            
            // Grouper par dossier
            $dossiersMap = [];
            foreach ($demandeur->demandes as $demande) {
                $dossierId = $demande->propriete->dossier->id;
                
                if (!isset($dossiersMap[$dossierId])) {
                    $dossiersMap[$dossierId] = [
                        'id' => $dossierId,
                        'nom' => $demande->propriete->dossier->nom_dossier,
                        'is_closed' => $demande->propriete->dossier->is_closed,
                        'lots_actifs' => [],
                        'lots_archives' => [],
                    ];
                }
                
                if ($demande->status === 'active') {
                    $dossiersMap[$dossierId]['lots_actifs'][] = $demande->propriete->lot;
                } else {
                    $dossiersMap[$dossierId]['lots_archives'][] = $demande->propriete->lot;
                }
            }
            
            $canDelete = $demandesActives->isEmpty() && $demandesArchivees->isEmpty();
            
            // ✅ Structure EXACTE attendue par le frontend
            return response()->json([
                'can_delete_completely' => $canDelete,
                'can_remove_from_dossier' => false, // Sera déterminé par checkDemandeurRemove
                'total_associations' => $demandeur->demandes()->count(),
                'total_actives' => $demandesActives->count(),
                'total_archivees' => $demandesArchivees->count(),
                'dossiers' => array_values($dossiersMap),
                'demandeur' => [
                    'id' => $demandeur->id,
                    'nom_complet' => $demandeur->nom_complet,
                    'cin' => $demandeur->cin,
                ],
            ], 200);
            
        } catch (\Exception $e) {
       
            return response()->json([
                'error' => 'Erreur lors de la vérification',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ========================================================================
    // VALIDATION DE SUPPRESSION - PROPRIÉTÉS
    // ========================================================================

    /**
     * ✅ Vérifier si une propriété peut être supprimée
     * Structure alignée avec SmartDeleteProprieteDialog.tsx
     */
    public function checkProprieteDelete(int $id): JsonResponse
    {
        try {
            $propriete = Propriete::with(['demandes.demandeur', 'dossier'])->findOrFail($id);
            
            // Récupérer les demandes actives avec leurs demandeurs
            $demandesActives = $propriete->demandes()
                ->where('status', 'active')
                ->with('demandeur')
                ->get();
            
            // Récupérer TOUTES les demandes (pour stats)
            $totalDemandes = $propriete->demandes()->count();
            
            // Déterminer si suppression possible
            $canDelete = $demandesActives->isEmpty();
            
            // ✅ Structure EXACTE attendue par le frontend
            return response()->json([
                'can_delete' => $canDelete,
                'is_archived' => $propriete->is_archived,
                'total_demandeurs_actifs' => $demandesActives->count(),
                'total_demandes' => $totalDemandes,
                'propriete' => [
                    'id' => $propriete->id,
                    'lot' => $propriete->lot,
                    'titre' => $propriete->titre,
                    'contenance' => $propriete->contenance,
                ],
                'demandeurs_actifs' => $demandesActives->map(fn($d) => [
                    'id' => $d->demandeur->id,
                    'nom_complet' => $d->demandeur->nom_complet,
                    'cin' => $d->demandeur->cin,
                    'ordre' => $d->ordre,
                ])->toArray(),
            ], 200);
            
        } catch (\Exception $e) {
            
            return response()->json([
                'error' => 'Erreur lors de la vérification',
                'message' => $e->getMessage()
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
            // Log::error('Erreur getProprieteAvailability', [
            //     'propriete_id' => $id,
            //     'error' => $e->getMessage()
            // ]);
            
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
            // Log::error('Erreur getDossierDocumentsStats', [
            //     'dossier_id' => $dossierId,
            //     'error' => $e->getMessage()
            // ]);
            
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

    /**
     * Vérifier si un dossier peut être supprimé
     */
    public function checkDossierDelete($id)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            
            $dossier = Dossier::with([
                'demandeurs',
                'proprietes',
                'piecesJointes'
            ])->findOrFail($id);

            // Vérifier les permissions de base
            $canDelete = false;
            
            if ($user->isSuperAdmin()) {
                $canDelete = true;
            } elseif ($user->isAdminDistrict() && $user->id_district === $dossier->id_district) {
                $canDelete = true;
            }

            // Compter les associations
            $totalDemandeurs = $dossier->demandeurs()->count();
            $totalProprietes = $dossier->proprietes()->count();
            $totalPiecesJointes = $dossier->piecesJointes()->count();

            // Conditions de suppression
            $isEmpty = $totalDemandeurs === 0 
                    && $totalProprietes === 0 
                    && $totalPiecesJointes === 0;
            
            $isNotClosed = !$dossier->is_closed;
            
            $finalCanDelete = $canDelete && $isEmpty && $isNotClosed;

            // Informations détaillées pour le frontend
            return response()->json([
                'can_delete' => $finalCanDelete,
                'is_closed' => $dossier->is_closed,
                'has_permission' => $canDelete,
                'is_empty' => $isEmpty,
                'total_demandeurs' => $totalDemandeurs,
                'total_proprietes' => $totalProprietes,
                'total_pieces_jointes' => $totalPiecesJointes,
                'dossier' => [
                    'id' => $dossier->id,
                    'nom_dossier' => $dossier->nom_dossier,
                    'numero_ouverture' => $dossier->numero_ouverture,
                    'commune' => $dossier->commune,
                    'date_ouverture' => $dossier->date_ouverture,
                    'date_fermeture' => $dossier->date_fermeture,
                ],
                'blocking_reasons' => $this->getDossierBlockingReasons(
                    $dossier, 
                    $totalDemandeurs, 
                    $totalProprietes, 
                    $totalPiecesJointes,
                    $canDelete
                )
            ]);

        } catch (\Exception $e) {
            // Log::error('Erreur vérification suppression dossier', [
            //     'dossier_id' => $id,
            //     'error' => $e->getMessage()
            // ]);

            return response()->json([
                'error' => 'Erreur lors de la vérification'
            ], 500);
        }
    }

    /**
     *  Obtenir les raisons qui bloquent la suppression
     */
    private function getDossierBlockingReasons(
        Dossier $dossier,
        int $totalDemandeurs,
        int $totalProprietes,
        int $totalPiecesJointes,
        bool $hasPermission
    ): array
    {
        $reasons = [];

        if (!$hasPermission) {
            $reasons[] = [
                'type' => 'permission',
                'message' => 'Vous n\'avez pas la permission de supprimer ce dossier'
            ];
        }

        if ($dossier->is_closed) {
            $reasons[] = [
                'type' => 'closed',
                'message' => 'Le dossier est fermé'
            ];
        }

        if ($totalDemandeurs > 0) {
            $reasons[] = [
                'type' => 'demandeurs',
                'count' => $totalDemandeurs,
                'message' => "$totalDemandeurs demandeur(s) associé(s)"
            ];
        }

        if ($totalProprietes > 0) {
            $reasons[] = [
                'type' => 'proprietes',
                'count' => $totalProprietes,
                'message' => "$totalProprietes propriété(s) enregistrée(s)"
            ];
        }

        if ($totalPiecesJointes > 0) {
            $reasons[] = [
                'type' => 'pieces_jointes',
                'count' => $totalPiecesJointes,
                'message' => "$totalPiecesJointes pièce(s) jointe(s)"
            ];
        }

        return $reasons;
    }
}