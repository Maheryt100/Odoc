<?php

namespace App\Http\Controllers\Documents\Concerns;

use App\Models\Propriete;
use App\Models\Demandeur;
use App\Models\DocumentGenere;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;


trait ValidatesDocumentData
{
    /**
     * Valider les données pour un reçu
     */
    protected function validateRecuData(Propriete $propriete, Demandeur $demandeur): array
    {
        $errors = [];
        
        // ✅ Vérification COMPLÈTE de la propriété
        if (!$propriete->titre) {
            $errors[] = 'Le titre de la propriété est manquant';
        }
        if (!$propriete->contenance || $propriete->contenance <= 0) {
            $errors[] = 'La contenance de la propriété est invalide';
        }
        if (!$propriete->proprietaire) {
            $errors[] = 'Le propriétaire de la propriété est manquant';
        }
        if (!$propriete->nature) {
            $errors[] = 'La nature de la propriété est manquante';
        }
        if (!$propriete->vocation) {
            $errors[] = 'La vocation de la propriété est manquante';
        }
        if (!$propriete->situation) {
            $errors[] = 'La situation de la propriété est manquante';
        }
        
        // ✅ Vérification COMPLÈTE du demandeur
        if (!$demandeur->nom_demandeur) {
            $errors[] = 'Le nom du demandeur est manquant';
        }
        if (!$demandeur->cin) {
            $errors[] = 'Le CIN du demandeur est manquant';
        }
        if (!$demandeur->date_naissance) {
            $errors[] = 'La date de naissance du demandeur est manquante';
        }
        if (!$demandeur->lieu_naissance) {
            $errors[] = 'Le lieu de naissance du demandeur est manquant';
        }
        if (!$demandeur->date_delivrance) {
            $errors[] = 'La date de délivrance du CIN est manquante';
        }
        if (!$demandeur->lieu_delivrance) {
            $errors[] = 'Le lieu de délivrance du CIN est manquant';
        }
        if (!$demandeur->domiciliation) {
            $errors[] = 'La domiciliation du demandeur est manquante';
        }
        if (!$demandeur->occupation) {
            $errors[] = 'L\'occupation du demandeur est manquante';
        }
        if (!$demandeur->nom_mere) {
            $errors[] = 'Le nom de la mère du demandeur est manquant';
        }
        
        // ✅ Vérifier le dossier et le district
        if (!$propriete->dossier) {
            $errors[] = 'Le dossier de la propriété est introuvable';
        } elseif (!$propriete->dossier->district) {
            $errors[] = 'Le district du dossier est introuvable';
        }
        
        // ✅ LOG pour debugging
        if (!empty($errors)) {
            Log::warning('Validation reçu échouée', [
                'propriete_id' => $propriete->id,
                'demandeur_id' => $demandeur->id,
                'errors' => $errors
            ]);
        }
        
        return $errors;
    }
    
     /**
     *  CORRIGÉ : Valider les données pour un acte de vente
     */
    protected function validateActeVenteData(Propriete $propriete, Demandeur $demandeur): array
    {
        // Validation de base (même que reçu)
        $errors = $this->validateRecuData($propriete, $demandeur);
        
        // Vérifier que le reçu existe
        $recuExists = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
            ->where('id_propriete', $propriete->id)
            ->where('id_district', $propriete->dossier->id_district)
            ->where('status', DocumentGenere::STATUS_ACTIVE)
            ->exists();
        
        if (!$recuExists) {
            $errors[] = 'Le reçu de paiement doit être généré avant l\'acte de vente';
        }
        
        // Vérifications spécifiques à l'ADV
        if (!$propriete->type_operation) {
            $errors[] = 'Le type d\'opération (immatriculation/morcellement) est manquant';
        }
        
        if ($propriete->type_operation === 'morcellement') {
            if (!$propriete->propriete_mere) {
                $errors[] = 'La propriété mère est requise pour un morcellement';
            }
            if (!$propriete->titre_mere) {
                $errors[] = 'Le titre mère est requis pour un morcellement';
            }
        }
        
        // ✅ CORRIGÉ : Vérifier les dates avec les nouveaux noms
        if (!$propriete->date_requisition) {
            $errors[] = 'La date de réquisition est manquante';
        }
        if (!$propriete->date_depot_1) {
            $errors[] = 'La date de dépôt 1 (inscription) est manquante';
        }
        if (!$propriete->date_approbation_acte) {
            $errors[] = "La date d'approbation de l'acte est obligatoire pour générer le document";
        }
        
        return $errors;
    }
    
    /**
     *  Valider les demandeurs pour un acte de vente avec consorts
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
            
            if (!$demandeur->nom_demandeur) {
                $errors[] = "{$prefix} : nom manquant";
            }
            if (!$demandeur->date_naissance) {
                $errors[] = "{$prefix} : date de naissance manquante";
            }
            if (!$demandeur->lieu_naissance) {
                $errors[] = "{$prefix} : lieu de naissance manquant";
            }
            if (!$demandeur->date_delivrance) {
                $errors[] = "{$prefix} : date de délivrance CIN manquante";
            }
            if (!$demandeur->lieu_delivrance) {
                $errors[] = "{$prefix} : lieu de délivrance CIN manquant";
            }
            if (!$demandeur->domiciliation) {
                $errors[] = "{$prefix} : domiciliation manquante";
            }
            if (!$demandeur->occupation) {
                $errors[] = "{$prefix} : occupation manquante";
            }
            if (!$demandeur->nom_mere) {
                $errors[] = "{$prefix} : nom de la mère manquant";
            }
            if (!$demandeur->cin) {
                $errors[] = "{$prefix} : CIN manquant";
            }
        }
        
        return $errors;
    }
    
    /**
     * Valider les données pour un CSF
     */
    protected function validateCsfData(Demandeur $demandeur, ?Propriete $propriete = null): array
    {
        $errors = [];
        
        // Validation du demandeur
        if (!$demandeur->titre_demandeur) {
            $errors[] = 'Le titre du demandeur (M./Mme) est manquant';
        }
        if (!$demandeur->nom_demandeur) {
            $errors[] = 'Le nom du demandeur est manquant';
        }
        if (!$demandeur->prenom_demandeur) {
            $errors[] = 'Le prénom du demandeur est manquant';
        }
        
        // Validation de la propriété si fournie
        if ($propriete) {
            if (!$propriete->numero_FN) {
                $errors[] = 'Le numéro FN de la propriété est manquant';
            }
            if (!$propriete->dossier) {
                $errors[] = 'Le dossier de la propriété est introuvable';
            } elseif (!$propriete->dossier->district) {
                $errors[] = 'Le district du dossier est introuvable';
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
        
        // Champs obligatoires pour la réquisition
        if (!$propriete->titre) {
            $errors[] = 'Le titre de la propriété est manquant';
        }
        if (!$propriete->proprietaire) {
            $errors[] = 'Le propriétaire de la propriété est manquant';
        }
        if (!$propriete->situation) {
            $errors[] = 'La situation de la propriété est manquante';
        }
        if (!$propriete->type_operation) {
            $errors[] = 'Le type d\'opération (immatriculation/morcellement) est manquant';
        }
        if (!$propriete->contenance || $propriete->contenance <= 0) {
            $errors[] = 'La contenance de la propriété est invalide';
        }
        
        // Pour le morcellement, vérifier la propriété mère
        if ($propriete->type_operation === 'morcellement') {
            if (!$propriete->propriete_mere) {
                $errors[] = 'La propriété mère est requise pour un morcellement';
            }
            if (!$propriete->titre_mere) {
                $errors[] = 'Le titre mère est requis pour un morcellement';
            }
        }
        
        // Vérifier le dossier
        if (!$propriete->dossier) {
            $errors[] = 'Le dossier de la propriété est introuvable';
        } else {
            if (!$propriete->dossier->commune) {
                $errors[] = 'La commune du dossier est manquante';
            }
            if (!$propriete->dossier->fokontany) {
                $errors[] = 'Le fokontany du dossier est manquant';
            }
            if (!$propriete->dossier->district) {
                $errors[] = 'Le district du dossier est introuvable';
            }
        }
        
        // Champs optionnels mais recommandés
        if (!$propriete->numero_FN) {
            // Warning mais pas bloquant
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