<?php
// ============================================
// app/Services/TopoValidationService.php
// SERVICE DE VALIDATION COMPLETE DES IMPORTS TOPO
// ============================================

namespace App\Services;

use App\Models\{Demandeur, Propriete, Dossier, User};
use Illuminate\Support\Facades\{DB, Log, Auth};
use Carbon\Carbon;

class TopoValidationService
{
    // ========================================
    // VALIDATION COMPLÈTE D'UN IMPORT
    // ========================================
    
    /**
     * Valide un import et retourne le résultat détaillé
     */
    public function validateImport(array $importData, User $user): array
    {
        try {
            Log::info('🔍 Début validation import', [
                'import_id' => $importData['id'] ?? 'N/A',
                'entity_type' => $importData['entity_type'],
                'user_id' => $user->id
            ]);
            
            // 1. Vérifications préliminaires
            $preliminaryChecks = $this->runPreliminaryChecks($importData, $user);
            
            if (!$preliminaryChecks['success']) {
                return [
                    'success' => false,
                    'can_proceed' => false,
                    'errors' => $preliminaryChecks['errors'],
                    'warnings' => []
                ];
            }
            
            // 2. Validation des données
            $dataValidation = $this->validateData($importData);
            
            // 3. Détection des doublons
            $duplicateCheck = $this->checkForDuplicates($importData);
            
            // 4. Validation des fichiers
            $filesValidation = $this->validateFiles($importData['files'] ?? []);
            
            // 5. Calcul du score de qualité
            $qualityScore = $this->calculateQualityScore(
                $dataValidation, 
                $filesValidation
            );
            
            // 6. Déterminer l'action recommandée
            $recommendedAction = $this->determineRecommendedAction(
                $duplicateCheck,
                $dataValidation
            );
            
            $result = [
                'success' => true,
                'can_proceed' => $preliminaryChecks['can_proceed'],
                'recommended_action' => $recommendedAction,
                'duplicate_info' => $duplicateCheck,
                'data_validation' => $dataValidation,
                'files_validation' => $filesValidation,
                'quality_score' => $qualityScore,
                'warnings' => array_merge(
                    $preliminaryChecks['warnings'] ?? [],
                    $dataValidation['warnings'] ?? [],
                    $filesValidation['warnings'] ?? []
                ),
                'errors' => []
            ];
            
            Log::info('✅ Validation terminée', [
                'import_id' => $importData['id'] ?? 'N/A',
                'recommended_action' => $recommendedAction['action'],
                'quality_score' => $qualityScore
            ]);
            
            return $result;
            
        } catch (\Exception $e) {
            Log::error('❌ Erreur validation import', [
                'import_id' => $importData['id'] ?? 'N/A',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'can_proceed' => false,
                'errors' => ['Erreur système : ' . $e->getMessage()],
                'warnings' => []
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
        $dossier = Dossier::find($importData['dossier_id']);
        
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
    // VALIDATION DES DONNÉES
    // ========================================
    
    private function validateData(array $importData): array
    {
        $entityType = $importData['entity_type'];
        $rawData = $importData['raw_data'];
        
        if ($entityType === 'demandeur') {
            return $this->validateDemandeurData($rawData);
        } else {
            return $this->validateProprieteData($rawData);
        }
    }
    
    private function validateDemandeurData(array $data): array
    {
        $errors = [];
        $warnings = [];
        $missingFields = [];
        $validFields = [];
        
        // Champs obligatoires
        $requiredFields = [
            'titre_demandeur' => 'Titre de civilité',
            'nom_demandeur' => 'Nom',
            'prenom_demandeur' => 'Prénom',
            'date_naissance' => 'Date de naissance',
            'cin' => 'CIN'
        ];
        
        foreach ($requiredFields as $field => $label) {
            if (empty($data[$field])) {
                $errors[] = "{$label} obligatoire";
                $missingFields[] = $field;
            } else {
                $validFields[] = $field;
            }
        }
        
        // Validation CIN
        if (!empty($data['cin'])) {
            if (!preg_match('/^\d{12}$/', $data['cin'])) {
                $errors[] = "CIN invalide (12 chiffres requis)";
            }
        }
        
        // Validation date de naissance (>18 ans)
        if (!empty($data['date_naissance'])) {
            $birthDate = Carbon::parse($data['date_naissance']);
            $age = $birthDate->diffInYears(Carbon::now());
            
            if ($age < 18) {
                $errors[] = "Le demandeur doit avoir au moins 18 ans";
            }
        }
        
        // Champs recommandés
        $recommendedFields = [
            'lieu_naissance' => 'Lieu de naissance',
            'occupation' => 'Profession',
            'domiciliation' => 'Domiciliation',
            'telephone' => 'Téléphone',
            'date_delivrance' => 'Date délivrance CIN',
            'lieu_delivrance' => 'Lieu délivrance CIN'
        ];
        
        foreach ($recommendedFields as $field => $label) {
            if (empty($data[$field])) {
                $warnings[] = "{$label} recommandé mais non fourni";
                $missingFields[] = $field;
            } else {
                $validFields[] = $field;
            }
        }
        
        return [
            'is_valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
            'missing_fields' => $missingFields,
            'valid_fields' => $validFields,
            'completeness' => $this->calculateCompleteness($data, array_merge($requiredFields, $recommendedFields))
        ];
    }
    
    private function validateProprieteData(array $data): array
    {
        $errors = [];
        $warnings = [];
        $missingFields = [];
        $validFields = [];
        
        // Champs obligatoires
        $requiredFields = [
            'lot' => 'Lot',
            'type_operation' => 'Type d\'opération',
            'nature' => 'Nature',
            'vocation' => 'Vocation'
        ];
        
        foreach ($requiredFields as $field => $label) {
            if (empty($data[$field])) {
                $errors[] = "{$label} obligatoire";
                $missingFields[] = $field;
            } else {
                $validFields[] = $field;
            }
        }
        
        // Validation cohérence des dates
        if (!empty($data['date_requisition']) && !empty($data['date_approbation_acte'])) {
            $dateReq = Carbon::parse($data['date_requisition']);
            $dateAppro = Carbon::parse($data['date_approbation_acte']);
            
            if ($dateAppro->lessThan($dateReq)) {
                $errors[] = "La date d'approbation ne peut pas être antérieure à la date de réquisition";
            }
        }
        
        // Validation cohérence dates de dépôt
        if (!empty($data['date_depot_1']) && !empty($data['date_depot_2'])) {
            $depot1 = Carbon::parse($data['date_depot_1']);
            $depot2 = Carbon::parse($data['date_depot_2']);
            
            if ($depot2->lessThan($depot1)) {
                $warnings[] = "La date du dépôt 2 est antérieure au dépôt 1";
            }
        }
        
        // Champs recommandés
        $recommendedFields = [
            'titre' => 'Titre',
            'proprietaire' => 'Propriétaire',
            'contenance' => 'Contenance',
            'situation' => 'Situation',
            'date_requisition' => 'Date réquisition'
        ];
        
        foreach ($recommendedFields as $field => $label) {
            if (empty($data[$field])) {
                $warnings[] = "{$label} recommandé mais non fourni";
                $missingFields[] = $field;
            } else {
                $validFields[] = $field;
            }
        }
        
        return [
            'is_valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
            'missing_fields' => $missingFields,
            'valid_fields' => $validFields,
            'completeness' => $this->calculateCompleteness($data, array_merge($requiredFields, $recommendedFields))
        ];
    }
    
    private function calculateCompleteness(array $data, array $allFields): float
    {
        $total = count($allFields);
        $filled = 0;
        
        foreach ($allFields as $field => $label) {
            if (!empty($data[$field])) {
                $filled++;
            }
        }
        
        return $total > 0 ? round(($filled / $total) * 100, 1) : 0;
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
    
    private function checkDemandeurDuplicate(array $data): array
    {
        if (empty($data['cin'])) {
            return [
                'is_duplicate' => false,
                'existing_entity' => null,
                'match_confidence' => 0,
                'match_method' => null
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
    
    private function checkProprieteDuplicate(array $data, int $dossierId): array
    {
        if (empty($data['lot'])) {
            return [
                'is_duplicate' => false,
                'existing_entity' => null,
                'match_confidence' => 0,
                'match_method' => null
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
    
    // ========================================
    // VALIDATION DES FICHIERS
    // ========================================
    
    private function validateFiles(array $files): array
    {
        $warnings = [];
        $totalSize = 0;
        $filesByCategory = [];
        
        foreach ($files as $file) {
            $size = $file['size'] ?? 0;
            $totalSize += $size;
            
            $category = $file['category'] ?? 'non_classé';
            $filesByCategory[$category] = ($filesByCategory[$category] ?? 0) + 1;
            
            // Vérifier taille individuelle (max 10MB)
            if ($size > 10 * 1024 * 1024) {
                $warnings[] = "Fichier '{$file['name']}' dépasse 10MB";
            }
        }
        
        // Vérifier taille totale (max 50MB)
        if ($totalSize > 50 * 1024 * 1024) {
            $warnings[] = "Taille totale des fichiers dépasse 50MB";
        }
        
        return [
            'total_files' => count($files),
            'total_size' => $totalSize,
            'files_by_category' => $filesByCategory,
            'warnings' => $warnings,
            'has_files' => count($files) > 0
        ];
    }
    
    // ========================================
    // CALCUL SCORE DE QUALITÉ
    // ========================================
    
    private function calculateQualityScore(array $dataValidation, array $filesValidation): array
    {
        $dataScore = $dataValidation['completeness'] ?? 0;
        $filesScore = $filesValidation['has_files'] ? 20 : 0;
        
        $totalScore = ($dataScore * 0.8) + $filesScore;
        
        $level = 'faible';
        if ($totalScore >= 90) {
            $level = 'excellent';
        } elseif ($totalScore >= 75) {
            $level = 'bon';
        } elseif ($totalScore >= 60) {
            $level = 'moyen';
        }
        
        return [
            'score' => round($totalScore, 1),
            'level' => $level,
            'data_completeness' => $dataValidation['completeness'] ?? 0,
            'has_files' => $filesValidation['has_files']
        ];
    }
    
    // ========================================
    // DÉTERMINER L'ACTION RECOMMANDÉE
    // ========================================
    
    private function determineRecommendedAction(array $duplicateCheck, array $dataValidation): array
    {
        // Si doublon détecté
        if ($duplicateCheck['is_duplicate']) {
            return [
                'action' => 'update',
                'dialog' => $duplicateCheck['existing_entity']['id'] ? 'edit_dialog' : 'create_form',
                'entity_id' => $duplicateCheck['existing_entity']['id'] ?? null,
                'message' => 'Une entité similaire existe déjà. Mise à jour recommandée.',
                'requires_confirmation' => true
            ];
        }
        
        // Si données invalides
        if (!$dataValidation['is_valid']) {
            return [
                'action' => 'review',
                'dialog' => 'validation_errors',
                'entity_id' => null,
                'message' => 'Les données contiennent des erreurs. Correction requise.',
                'requires_confirmation' => true
            ];
        }
        
        // Si données valides, création normale
        return [
            'action' => 'create',
            'dialog' => 'create_form',
            'entity_id' => null,
            'message' => 'Prêt pour création.',
            'requires_confirmation' => false
        ];
    }
}