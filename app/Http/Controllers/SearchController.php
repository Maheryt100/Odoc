<?php

namespace App\Http\Controllers;

use App\Models\Demandeur;
use App\Models\Propriete;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SearchController extends Controller
{
    /**
     * Recherche globale d'un demandeur par CIN
     * (tous districts - pas de filtre)
     */
    public function searchDemandeurByCin($cin)
    {
        // Valider format CIN
        if (!preg_match('/^\d{12}$/', $cin)) {
            return response()->json([
                'found' => false,
                'message' => 'Format CIN invalide (12 chiffres requis)'
            ], 400);
        }
        
        // Rechercher demandeur
        $demandeur = Demandeur::where('cin', $cin)->first();
        
        if (!$demandeur) {
            return response()->json([
                'found' => false,
                'message' => 'Aucun demandeur trouvé avec ce CIN'
            ]);
        }
        
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Vérifier si même district
        $sameDistrict = false;
        if ($demandeur->dossiers && $demandeur->dossiers->isNotEmpty()) {
            $dossier = $demandeur->dossiers->first();
            $sameDistrict = ($dossier->id_district === $user->id_district);
        }
        
        return response()->json([
            'found' => true,
            'message' => $sameDistrict 
                ? 'Demandeur trouvé dans votre district' 
                : '⚠️ Demandeur trouvé dans un autre district',
            'demandeur' => [
                'id' => $demandeur->id,
                'titre_demandeur' => $demandeur->titre_demandeur,
                'nom_demandeur' => $demandeur->nom_demandeur,
                'prenom_demandeur' => $demandeur->prenom_demandeur,
                'date_naissance' => $demandeur->date_naissance,
                'lieu_naissance' => $demandeur->lieu_naissance,
                'sexe' => $demandeur->sexe,
                'occupation' => $demandeur->occupation,
                'nom_pere' => $demandeur->nom_pere,
                'nom_mere' => $demandeur->nom_mere,
                'cin' => $demandeur->cin,
                'date_delivrance' => $demandeur->date_delivrance,
                'lieu_delivrance' => $demandeur->lieu_delivrance,
                'date_delivrance_duplicata' => $demandeur->date_delivrance_duplicata,
                'lieu_delivrance_duplicata' => $demandeur->lieu_delivrance_duplicata,
                'domiciliation' => $demandeur->domiciliation,
                'nationalite' => $demandeur->nationalite,
                'situation_familiale' => $demandeur->situation_familiale,
                'regime_matrimoniale' => $demandeur->regime_matrimoniale,
                'date_mariage' => $demandeur->date_mariage,
                'lieu_mariage' => $demandeur->lieu_mariage,
                'marie_a' => $demandeur->marie_a,
                'telephone' => $demandeur->telephone
            ],
            'meta' => [
                'same_district' => $sameDistrict,
                'district_id' => $dossier->id_district ?? null,
                'district_nom' => $dossier->district->nom_district ?? null
            ]
        ]);
    }
    
    /**
     * Recherche propriété par lot dans un dossier
     */
    public function searchProprieteByLot($id_dossier, $lot)
    {
        $propriete = Propriete::where('id_dossier', $id_dossier)
            ->where('lot', strtoupper(trim($lot)))
            ->first();
        
        if (!$propriete) {
            return response()->json([
                'found' => false,
                'message' => 'Aucune propriété trouvée avec ce lot'
            ]);
        }
        
        return response()->json([
            'found' => true,
            'message' => 'Propriété existante détectée',
            'propriete' => $propriete
        ]);
    }
}