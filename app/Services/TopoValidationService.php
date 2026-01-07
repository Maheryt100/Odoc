<?php

namespace App\Services;

use App\Models\{Demandeur, Propriete, Dossier, User};
// use Illuminate\Support\Facades\Log;

class TopoValidationService
{
    /**
     * Valide un import et retourne le résultat
     * SIMPLIFIÉ : Focus sur la détection de doublons
     */
    public function validateImport(array $importData, User $user): array
    {
        try {

            
            // 1. Vérifications préliminaires
            $preliminaryChecks = $this->runPreliminaryChecks($importData, $user);
            
            if (!$preliminaryChecks['success']) {
                return [
                    'success' => false,
                    'can_proceed' => false,
                    'errors' => $preliminaryChecks['errors'],
                    'warnings' => [],
                    'duplicate_info' => [
                        'is_duplicate' => false
                    ]
                ];
            }
            
            // 2. Détection des doublons
            $duplicateCheck = $this->checkForDuplicates($importData);
            
            // 3. Résultat
            $result = [
                'success' => true,
                'can_proceed' => $preliminaryChecks['can_proceed'],
                'duplicate_info' => $duplicateCheck,
                'warnings' => $preliminaryChecks['warnings'] ?? [],
                'errors' => []
            ];
     
            return $result;
            
        } catch (\Exception $e) {
   
            
            return [
                'success' => false,
                'can_proceed' => false,
                'errors' => ['Erreur système : ' . $e->getMessage()],
                'warnings' => [],
                'duplicate_info' => [
                    'is_duplicate' => false
                ]
            ];
        }
    }
    
    // ========================================
    // VÉRIFICATIONS PRÉLIMINAIRES
    // ========================================
    
    private function runPreliminaryChecks(array $importData, User $user): array
    {
        $errors = [];
        $warnings = [];
        $canProceed = true;
        
        // 1. Vérifier que le dossier existe
        $dossier = Dossier::find($importData['dossier_id'] ?? null);
        
        if (!$dossier) {
            $errors[] = "Le dossier #{$importData['dossier_id']} n'existe pas";
            $canProceed = false;
        } else {
            // 2. Vérifier que le dossier n'est pas fermé
            if ($dossier->is_closed) {
                $errors[] = "Le dossier '{$dossier->nom_dossier}' est fermé";
                $canProceed = false;
            }
            
            // 3. Vérifier l'accès au district
            if (!$this->userHasDistrictAccess($user, $importData['district_id'])) {
                $errors[] = "Vous n'avez pas accès au district #{$importData['district_id']}";
                $canProceed = false;
            }
            
            // 4. Vérifier cohérence district dossier
            if ($dossier->id_district !== $importData['district_id']) {
                $warnings[] = "Le dossier appartient à un district différent";
            }
        }
        
        return [
            'success' => empty($errors),
            'can_proceed' => $canProceed,
            'errors' => $errors,
            'warnings' => $warnings,
            'dossier' => $dossier
        ];
    }
    
    private function userHasDistrictAccess(User $user, int $districtId): bool
    {
        // Super admin et central user ont accès à tout
        if (in_array($user->role, ['super_admin', 'central_user'])) {
            return true;
        }
        
        // Autres utilisateurs : vérifier le district
        return $user->id_district === $districtId;
    }
    
    // ========================================
    // DÉTECTION DES DOUBLONS
    // ========================================
    
    private function checkForDuplicates(array $importData): array
    {
        $entityType = $importData['entity_type'];
        $rawData = $importData['raw_data'];
        
        if ($entityType === 'demandeur') {
            return $this->checkDemandeurDuplicate($rawData);
        } else {
            return $this->checkProprieteDuplicate($rawData, $importData['dossier_id']);
        }
    }
    
    /**
     * Recherche GLOBALE par CIN (tous districts)
     */
    private function checkDemandeurDuplicate(array $data): array
    {
        if (empty($data['cin'])) {
            return [
                'is_duplicate' => false,
                'existing_entity' => null,
                'match_confidence' => 0,
                'match_method' => null,
                'action' => 'create'
            ];
        }
        
        // Recherche GLOBALE par CIN (sans filtre district)
        $existing = Demandeur::withoutGlobalScopes()
            ->where('cin', $data['cin'])
            ->with(['dossiers.district'])
            ->first();
        
        if ($existing) {
            return [
                'is_duplicate' => true,
                'existing_entity' => [
                    'id' => $existing->id,
                    'nom_complet' => $existing->nom_complet,
                    'cin' => $existing->cin,
                    'date_naissance' => $existing->date_naissance,
                    'district' => $existing->dossiers->first()?->district->nom_district ?? 'N/A',
                    'dossiers_count' => $existing->dossiers->count()
                ],
                'match_confidence' => 100,
                'match_method' => 'cin_exact',
                'action' => 'update'
            ];
        }
        
        return [
            'is_duplicate' => false,
            'existing_entity' => null,
            'match_confidence' => 0,
            'match_method' => null,
            'action' => 'create'
        ];
    }
    
    /**
     * Recherche dans le dossier ciblé uniquement
     */
    private function checkProprieteDuplicate(array $data, int $dossierId): array
    {
        if (empty($data['lot'])) {
            return [
                'is_duplicate' => false,
                'existing_entity' => null,
                'match_confidence' => 0,
                'match_method' => null,
                'action' => 'create'
            ];
        }
        
        // Recherche dans le dossier ciblé
        $existing = Propriete::where('lot', $data['lot'])
            ->where('id_dossier', $dossierId)
            ->with('dossier')
            ->first();
        
        if ($existing) {
            return [
                'is_duplicate' => true,
                'existing_entity' => [
                    'id' => $existing->id,
                    'lot' => $existing->lot,
                    'titre' => $existing->titre,
                    'nature' => $existing->nature,
                    'vocation' => $existing->vocation,
                    'contenance' => $existing->contenance,
                    'dossier_nom' => $existing->dossier->nom_dossier,
                    'is_archived' => $existing->is_archived
                ],
                'match_confidence' => 100,
                'match_method' => 'lot_exact_in_dossier',
                'action' => 'update'
            ];
        }
        
        return [
            'is_duplicate' => false,
            'existing_entity' => null,
            'match_confidence' => 0,
            'match_method' => null,
            'action' => 'create'
        ];
    }
}