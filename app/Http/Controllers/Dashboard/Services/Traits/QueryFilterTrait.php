<?php

namespace App\Http\Controllers\Dashboard\Services\Traits;

use App\Models\Dossier;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

/**
 * Trait pour appliquer automatiquement les filtres de district
 * Utilisé par tous les services de statistiques et du dashboard
 * 
 * @method bool canAccessAllDistricts() Méthode du modèle User
 */
trait QueryFilterTrait
{
    /**
     * Requête de base pour les dossiers avec scope district automatique
     * 
     * Cette méthode est compatible avec l'ancien code existant
     * 
     * @return Builder
     */
    protected function baseQuery(): Builder
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        $query = Dossier::query();
        
        if (!$user->canAccessAllDistricts()) {
            $query->where('id_district', $user->id_district);
        }
        
        return $query;
    }
    
    /**
     * Récupérer l'utilisateur authentifié avec typage
     * 
     * @return \App\Models\User
     */
    protected function getAuthUser()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        return $user;
    }
    
    /**
     * Vérifier si l'utilisateur peut accéder à tous les districts
     * 
     * @return bool
     */
    protected function canAccessAllDistricts(): bool
    {
        return $this->getAuthUser()->canAccessAllDistricts();
    }
    
    /**
     * Appliquer le filtre district sur une requête quelconque
     * 
     * Utile pour filtrer d'autres modèles (Propriete, Demandeur, etc.)
     * 
     * @param Builder $query
     * @return Builder
     */
    protected function applyDistrictFilter(Builder $query): Builder
    {
        $user = $this->getAuthUser();
        
        if (!$user->canAccessAllDistricts()) {
            $query->where('id_district', $user->id_district);
        }
        
        return $query;
    }
}