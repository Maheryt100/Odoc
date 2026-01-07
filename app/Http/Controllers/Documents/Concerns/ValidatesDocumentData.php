<?php

namespace App\Http\Controllers\Documents\Concerns;

use App\Models\Propriete;
use App\Models\Demandeur;
use Illuminate\Support\Collection;
// use Illuminate\Support\Facades\Log;

trait ValidatesDocumentData
{
    /**
     * VALIDATION STRICTE POUR ADV
     * Toutes les données utilisées dans le template sont OBLIGATOIRES
     */
    protected function validateActeVenteData(Propriete $propriete, Demandeur $demandeur, ?string $numeroRecu = null): array
    {
        $errors = [];
        
        // ============================================
        // 1. VALIDATION NUMÉRO DE REÇU (OBLIGATOIRE)
        // ============================================
        if (!$numeroRecu || trim($numeroRecu) === '') {
            $errors[] = 'Le numéro de reçu est obligatoire';
        } else {
            // Valider le format XXX/XX
            if (!$this->validateNumeroRecuFormat($numeroRecu)) {
                $errors[] = 'Le numéro de reçu doit être au format XXX/XX (ex: 001/25)';
            }
        }
        
        // ============================================
        // 2. VALIDATION PROPRIÉTÉ - TOUTES OBLIGATOIRES
        // ============================================
        
        // Informations de base
        if (!$propriete->titre) $errors[] = 'Titre de la propriété manquant';
        if (!$propriete->contenance || $propriete->contenance <= 0) $errors[] = 'Contenance invalide ou manquante';
        if (!$propriete->proprietaire) $errors[] = 'Propriétaire manquant';
        if (!$propriete->nature) $errors[] = 'Nature de la propriété manquante';
        if (!$propriete->vocation) $errors[] = 'Vocation manquante';
        if (!$propriete->situation) $errors[] = 'Situation manquante';
        if (!$propriete->type_operation) $errors[] = 'Type d\'opération (immatriculation/morcellement) manquant';
        
        // Dates OBLIGATOIRES
        if (!$propriete->date_requisition) $errors[] = 'Date de réquisition manquante';
        if (!$propriete->date_depot_1) $errors[] = 'Date de dépôt 1 (inscription) manquante';
        if (!$propriete->date_depot_2) $errors[] = 'Date de dépôt 2 manquante';
        if (!$propriete->date_approbation_acte) $errors[] = 'Date d\'approbation de l\'acte manquante';
        
        // Dep/Vol OBLIGATOIRES
        if (!$propriete->dep_vol_inscription) $errors[] = 'Dep/Vol inscription manquant';
        if (!$propriete->numero_dep_vol_inscription) $errors[] = 'Numéro Dep/Vol inscription manquant';
        if (!$propriete->dep_vol_requisition) $errors[] = 'Dep/Vol réquisition manquant';
        if (!$propriete->numero_dep_vol_requisition) $errors[] = 'Numéro Dep/Vol réquisition manquant';
        
        // Vérifications spécifiques au morcellement
        if ($propriete->type_operation === 'morcellement') {
            if (!$propriete->propriete_mere) $errors[] = 'Propriété mère requise pour un morcellement';
            if (!$propriete->titre_mere) $errors[] = 'Titre mère requis pour un morcellement';
        }
        
        // Vérifier le dossier
        if (!$propriete->dossier) {
            $errors[] = 'Dossier de la propriété introuvable';
        } else {
            if (!$propriete->dossier->district) $errors[] = 'District du dossier introuvable';
            if (!$propriete->dossier->commune) $errors[] = 'Commune manquante';
            if (!$propriete->dossier->fokontany) $errors[] = 'Fokontany manquant';
        }
        
        // ============================================
        // 3. VALIDATION DEMANDEUR - TOUTES OBLIGATOIRES
        // ============================================
        
        if (!$demandeur->titre_demandeur) $errors[] = 'Titre du demandeur (M./Mme) manquant';
        if (!$demandeur->nom_demandeur) $errors[] = 'Nom du demandeur manquant';
        if (!$demandeur->prenom_demandeur) $errors[] = 'Prénom du demandeur manquant';
        if (!$demandeur->sexe) $errors[] = 'Sexe du demandeur manquant';
        if (!$demandeur->cin) $errors[] = 'CIN du demandeur manquant';
        if (!$demandeur->date_naissance) $errors[] = 'Date de naissance manquante';
        if (!$demandeur->lieu_naissance) $errors[] = 'Lieu de naissance manquant';
        if (!$demandeur->date_delivrance) $errors[] = 'Date de délivrance du CIN manquante';
        if (!$demandeur->lieu_delivrance) $errors[] = 'Lieu de délivrance du CIN manquant';
        if (!$demandeur->domiciliation) $errors[] = 'Domiciliation manquante';
        if (!$demandeur->occupation) $errors[] = 'Occupation manquante';
        if (!$demandeur->nom_mere) $errors[] = 'Nom de la mère manquant';
        if (!$demandeur->nationalite) $errors[] = 'Nationalité manquante';
        
        // Informations mariage (si marié)
        if ($demandeur->situation_familiale === 'Marié(e)') {
            if (!$demandeur->marie_a) $errors[] = 'Nom du/de la conjoint(e) manquant';
            if (!$demandeur->date_mariage) $errors[] = 'Date de mariage manquante';
            if (!$demandeur->lieu_mariage) $errors[] = 'Lieu de mariage manquant';
        }
        
        // ============================================
        // LOGGING
        // ============================================
        if (!empty($errors)) {
            // Log::warning('Validation ADV stricte échouée', [
            //     'propriete_id' => $propriete->id,
            //     'demandeur_id' => $demandeur->id,
            //     'numero_recu' => $numeroRecu,
            //     'errors_count' => count($errors),
            //     'errors' => $errors
            // ]);
        }
        
        return $errors;
    }
    
    /**
     * Valider les demandeurs pour un acte de vente avec consorts
     */
    protected function validateConsortsData(Collection $demandeurs): array
    {
        $errors = [];
        
        if ($demandeurs->isEmpty()) {
            $errors[] = 'Aucun demandeur trouvé pour cette propriété';
            return $errors;
        }
        
        // Vérifier qu'il y a un demandeur principal (ordre = 1)
        $principal = $demandeurs->firstWhere('ordre', 1);
        if (!$principal) {
            $errors[] = 'Aucun demandeur principal (ordre = 1) trouvé';
        }
        
        // Vérifier chaque demandeur
        foreach ($demandeurs as $demande) {
            $demandeur = $demande->demandeur;
            $prefix = "Demandeur (ordre {$demande->ordre})";
            
            if (!$demandeur->titre_demandeur) $errors[] = "{$prefix} : titre manquant";
            if (!$demandeur->nom_demandeur) $errors[] = "{$prefix} : nom manquant";
            if (!$demandeur->prenom_demandeur) $errors[] = "{$prefix} : prénom manquant";
            if (!$demandeur->sexe) $errors[] = "{$prefix} : sexe manquant";
            if (!$demandeur->cin) $errors[] = "{$prefix} : CIN manquant";
            if (!$demandeur->date_naissance) $errors[] = "{$prefix} : date de naissance manquante";
            if (!$demandeur->lieu_naissance) $errors[] = "{$prefix} : lieu de naissance manquant";
            if (!$demandeur->date_delivrance) $errors[] = "{$prefix} : date de délivrance CIN manquante";
            if (!$demandeur->lieu_delivrance) $errors[] = "{$prefix} : lieu de délivrance CIN manquant";
            if (!$demandeur->domiciliation) $errors[] = "{$prefix} : domiciliation manquante";
            if (!$demandeur->occupation) $errors[] = "{$prefix} : occupation manquante";
            if (!$demandeur->nom_mere) $errors[] = "{$prefix} : nom de la mère manquant";
            if (!$demandeur->nationalite) $errors[] = "{$prefix} : nationalité manquante";
        }
        
        return $errors;
    }
    
    /**
     * Valider le format du numéro de reçu XXX/XX
     */
    protected function validateNumeroRecuFormat(string $numero): bool
    {
        // Format: 3 chiffres / 2 chiffres (ex: 001/25, 123/24)
        return preg_match('/^\d{3}\/\d{2}$/', trim($numero)) === 1;
    }
    
    /**
     * Valider les données pour un CSF
     */
    protected function validateCsfData(Demandeur $demandeur, ?Propriete $propriete = null): array
    {
        $errors = [];
        
        // Validation du demandeur
        if (!$demandeur->titre_demandeur) $errors[] = 'Titre du demandeur (M./Mme) manquant';
        if (!$demandeur->nom_demandeur) $errors[] = 'Nom du demandeur manquant';
        if (!$demandeur->prenom_demandeur) $errors[] = 'Prénom du demandeur manquant';
        
        // Validation de la propriété si fournie
        if ($propriete) {
            if (!$propriete->numero_FN) $errors[] = 'Numéro FN de la propriété manquant';
            if (!$propriete->dossier) {
                $errors[] = 'Dossier de la propriété introuvable';
            } elseif (!$propriete->dossier->district) {
                $errors[] = 'District du dossier introuvable';
            }
        }
        
        return $errors;
    }
    
    /**
     * Valider les données pour une réquisition
     */
    protected function validateRequisitionData(Propriete $propriete): array
    {
        $errors = [];
        
        if (!$propriete->titre) $errors[] = 'Titre de la propriété manquant';
        if (!$propriete->proprietaire) $errors[] = 'Propriétaire manquant';
        if (!$propriete->situation) $errors[] = 'Situation manquante';
        if (!$propriete->type_operation) $errors[] = 'Type d\'opération manquant';
        if (!$propriete->contenance || $propriete->contenance <= 0) $errors[] = 'Contenance invalide';
        
        if ($propriete->type_operation === 'morcellement') {
            if (!$propriete->propriete_mere) $errors[] = 'Propriété mère requise';
            if (!$propriete->titre_mere) $errors[] = 'Titre mère requis';
        }
        
        if (!$propriete->dossier) {
            $errors[] = 'Dossier introuvable';
        } else {
            if (!$propriete->dossier->commune) $errors[] = 'Commune manquante';
            if (!$propriete->dossier->fokontany) $errors[] = 'Fokontany manquant';
            if (!$propriete->dossier->district) $errors[] = 'District introuvable';
        }
        
        return $errors;
    }
    
    /**
     * Lancer une exception si des erreurs sont trouvées
     */
    protected function throwIfErrors(array $errors): void
    {
        if (!empty($errors)) {
            throw new \Exception(implode('; ', $errors));
        }
    }
    
    /**
     * Valider et retourner les erreurs ou lancer une exception
     */
    protected function validateOrThrow(array $errors): void
    {
        $this->throwIfErrors($errors);
    }
}