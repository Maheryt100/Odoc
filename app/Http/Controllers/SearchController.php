<?php

namespace App\Http\Controllers;

use App\Models\Demandeur;
use App\Models\Propriete;
use App\Models\Dossier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class SearchController extends Controller
{
    /**
     * ✅ Recherche demandeur par CIN (TOUS DISTRICTS)
     * 
     * Utilisé dans DemandeurCreate.tsx pour vérifier les doublons
     * 
     * Route: GET /search/demandeur/cin?cin=123456789012
     */
    public function searchDemandeurByCin(Request $request): JsonResponse
    {
        $request->validate([
            'cin' => 'required|string|size:12|regex:/^\d{12}$/'
        ]);
        
        $cin = $request->input('cin');
        $currentDistrictId = Auth::user()->district_id;
        
        Log::info('🔍 Recherche CIN globale', [
            'cin' => $cin,
            'user_district' => $currentDistrictId
        ]);
        
        // Chercher dans TOUS les districts
        $demandeur = Demandeur::where('cin', $cin)->first();
        
        if (!$demandeur) {
            Log::info('❌ CIN non trouvé', ['cin' => $cin]);
            
            return response()->json([
                'found' => false,
                'message' => 'Nouveau demandeur - CIN non trouvé dans la base'
            ]);
        }
        
        // CIN trouvé - vérifier le district
        $sameDistrict = $demandeur->district_id === $currentDistrictId;
        
        Log::info('CIN trouvé', [
            'cin' => $cin,
            'demandeur_id' => $demandeur->id,
            'same_district' => $sameDistrict,
            'district_name' => $demandeur->district->nom ?? 'N/A'
        ]);
        
        return response()->json([
            'found' => true,
            'message' => $sameDistrict 
                ? 'Demandeur existant trouvé dans votre district'
                : 'Demandeur existant trouvé dans un autre district',
            'demandeur' => [
                'id' => $demandeur->id,
                'cin' => $demandeur->cin,
                'titre_demandeur' => $demandeur->titre_demandeur,
                'nom_demandeur' => $demandeur->nom_demandeur,
                'prenom_demandeur' => $demandeur->prenom_demandeur,
                'date_naissance' => $demandeur->date_naissance,
                'lieu_naissance' => $demandeur->lieu_naissance,
                'sexe' => $demandeur->sexe,
                'occupation' => $demandeur->occupation,
                'nom_pere' => $demandeur->nom_pere,
                'nom_mere' => $demandeur->nom_mere,
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
                'telephone' => $demandeur->telephone,
            ],
            'meta' => [
                'same_district' => $sameDistrict,
                'district_name' => $demandeur->district->nom ?? null,
                'district_id' => $demandeur->district_id
            ]
        ]);
    }
    
    /**
     * ✅ Recherche propriété par lot (TOUS DISTRICTS)
     */
    public function searchProprieteByLot(Request $request): JsonResponse
    {
        $request->validate([
            'lot' => 'required|string|max:50',
            'dossier_id' => 'nullable|integer|exists:dossiers,id'
        ]);
        
        $lot = $request->input('lot');
        $dossierId = $request->input('dossier_id');
        $currentDistrictId = Auth::user()->district_id;
        
        $query = Propriete::where('lot', $lot);
        
        if ($dossierId) {
            $query->where('id_dossier', $dossierId);
        }
        
        $proprietes = $query->with('dossier.district')->get();
        
        if ($proprietes->isEmpty()) {
            return response()->json([
                'found' => false,
                'message' => 'Aucune propriété avec ce lot'
            ]);
        }
        
        return response()->json([
            'found' => true,
            'message' => 'Propriété(s) trouvée(s)',
            'proprietes' => $proprietes->map(fn($p) => [
                'id' => $p->id,
                'lot' => $p->lot,
                'nature' => $p->nature,
                'vocation' => $p->vocation,
                'dossier_nom' => $p->dossier->nom_dossier ?? null,
                'district_nom' => $p->dossier->district->nom ?? null,
                'same_district' => $p->dossier->district_id === $currentDistrictId
            ])
        ]);
    }
    
    /**
     * ✅ Recherche dossier par numéro (TOUS DISTRICTS)
     */
    public function searchDossierByNumero(Request $request): JsonResponse
    {
        $request->validate([
            'numero' => 'required|integer'
        ]);
        
        $numero = $request->input('numero');
        $currentDistrictId = Auth::user()->district_id;
        
        $dossier = Dossier::where('numero_ouverture', $numero)
            ->with('district')
            ->first();
        
        if (!$dossier) {
            return response()->json([
                'found' => false,
                'message' => 'Dossier non trouvé'
            ]);
        }
        
        return response()->json([
            'found' => true,
            'message' => 'Dossier trouvé',
            'dossier' => [
                'id' => $dossier->id,
                'numero_ouverture' => $dossier->numero_ouverture,
                'nom_dossier' => $dossier->nom_dossier,
                'commune' => $dossier->commune,
                'district_nom' => $dossier->district->nom ?? null,
                'same_district' => $dossier->district_id === $currentDistrictId
            ]
        ]);
    }
    
    /**
     * ✅ Recherche générale (autocomplete)
     */
    public function autocomplete(Request $request): JsonResponse
    {
        $request->validate([
            'q' => 'required|string|min:2',
            'type' => 'nullable|in:demandeur,propriete,dossier'
        ]);
        
        $query = $request->input('q');
        $type = $request->input('type');
        $results = [];
        
        if (!$type || $type === 'demandeur') {
            $demandeurs = Demandeur::where(function($q) use ($query) {
                $q->where('cin', 'like', "%{$query}%")
                  ->orWhere('nom_demandeur', 'like', "%{$query}%")
                  ->orWhere('prenom_demandeur', 'like', "%{$query}%");
            })
            ->limit(10)
            ->get();
            
            $results['demandeurs'] = $demandeurs->map(fn($d) => [
                'id' => $d->id,
                'label' => "{$d->nom_demandeur} {$d->prenom_demandeur} - CIN: {$d->cin}",
                'type' => 'demandeur'
            ]);
        }
        
        if (!$type || $type === 'propriete') {
            $proprietes = Propriete::where('lot', 'like', "%{$query}%")
                ->limit(10)
                ->get();
            
            $results['proprietes'] = $proprietes->map(fn($p) => [
                'id' => $p->id,
                'label' => "Lot {$p->lot} - {$p->nature}",
                'type' => 'propriete'
            ]);
        }
        
        if (!$type || $type === 'dossier') {
            $dossiers = Dossier::where(function($q) use ($query) {
                $q->where('nom_dossier', 'like', "%{$query}%")
                  ->orWhere('numero_ouverture', 'like', "%{$query}%");
            })
            ->limit(10)
            ->get();
            
            $results['dossiers'] = $dossiers->map(fn($d) => [
                'id' => $d->id,
                'label' => "N°{$d->numero_ouverture} - {$d->nom_dossier}",
                'type' => 'dossier'
            ]);
        }
        
        return response()->json($results);
    }
}