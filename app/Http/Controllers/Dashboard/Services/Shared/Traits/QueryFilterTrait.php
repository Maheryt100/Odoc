<?php

namespace App\Http\Controllers\Dashboard\Services\Shared\Traits;

use App\Models\Dossier;
use App\Models\District;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

/**
 * Trait pour appliquer automatiquement les filtres géographiques
 * Gère la hiérarchie : Province → Région → District
 * 
 * @method bool canAccessAllDistricts() Méthode du modèle User
 */
trait QueryFilterTrait
{
    /**
     * Requête de base pour les dossiers avec scope géographique
     * 
     * @param array $geoFilters ['province_id' => int|null, 'region_id' => int|null, 'district_id' => int|null]
     * @return Builder
     */
    protected function baseQuery(array $geoFilters = []): Builder
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        $query = Dossier::query();
        
        // LOGIQUE HIÉRARCHIQUE : District > Région > Province
        
        // Si l'utilisateur ne peut accéder qu'à son district
        if (!$user->canAccessAllDistricts()) {
            return $query->where('id_district', $user->id_district);
        }
        
        // Si un district spécifique est demandé
        if (!empty($geoFilters['district_id'])) {
            return $query->where('id_district', $geoFilters['district_id']);
        }
        
        // Si une région est demandée → filtrer tous les districts de cette région
        if (!empty($geoFilters['region_id'])) {
            $districtIds = District::where('id_region', $geoFilters['region_id'])
                ->pluck('id')
                ->toArray();
            
            return $query->whereIn('id_district', $districtIds);
        }
        
        // Si une province est demandée → filtrer tous les districts de cette province
        if (!empty($geoFilters['province_id'])) {
            $districtIds = District::query()
                ->whereHas('region', fn($q) => $q->where('id_province', $geoFilters['province_id']))
                ->pluck('id')
                ->toArray();
            
            return $query->whereIn('id_district', $districtIds);
        }
        
        // Sinon → tous les districts (Super Admin / Central User)
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
     * Appliquer le filtre géographique sur une requête quelconque
     * 
     * Utile pour filtrer d'autres modèles (Propriete, Demandeur, etc.)
     * 
     * @param Builder $query
     * @param array $geoFilters ['province_id' => int|null, 'region_id' => int|null, 'district_id' => int|null]
     * @return Builder
     */
    protected function applyGeographicFilter(Builder $query, array $geoFilters = []): Builder
    {
        $user = $this->getAuthUser();
        
        // Si utilisateur district → forcer son district
        if (!$user->canAccessAllDistricts()) {
            return $query->where('id_district', $user->id_district);
        }
        
        // District spécifique
        if (!empty($geoFilters['district_id'])) {
            return $query->where('id_district', $geoFilters['district_id']);
        }
        
        // Région → tous les districts de cette région
        if (!empty($geoFilters['region_id'])) {
            $districtIds = District::where('id_region', $geoFilters['region_id'])
                ->pluck('id')
                ->toArray();
            
            return $query->whereIn('id_district', $districtIds);
        }
        
        // Province → tous les districts de cette province
        if (!empty($geoFilters['province_id'])) {
            $districtIds = District::query()
                ->whereHas('region', fn($q) => $q->where('id_province', $geoFilters['province_id']))
                ->pluck('id')
                ->toArray();
            
            return $query->whereIn('id_district', $districtIds);
        }
        
        // Pas de filtre → tous les districts
        return $query;
    }
    
    /**
     * Obtenir les IDs de districts selon les filtres géographiques
     * 
     * @param array $geoFilters
     * @return array
     */
    protected function getFilteredDistrictIds(array $geoFilters = []): array
    {
        $user = $this->getAuthUser();
        
        // Utilisateur district → son district uniquement
        if (!$user->canAccessAllDistricts()) {
            return [$user->id_district];
        }
        
        // District spécifique
        if (!empty($geoFilters['district_id'])) {
            return [(int)$geoFilters['district_id']];
        }
        
        // Région → tous les districts de cette région
        if (!empty($geoFilters['region_id'])) {
            return District::where('id_region', $geoFilters['region_id'])
                ->pluck('id')
                ->toArray();
        }
        
        // Province → tous les districts de cette province
        if (!empty($geoFilters['province_id'])) {
            return District::query()
                ->whereHas('region', fn($q) => $q->where('id_province', $geoFilters['province_id']))
                ->pluck('id')
                ->toArray();
        }
        
        // Tous les districts
        return District::pluck('id')->toArray();
    }
    
    /**
     * Obtenir le label géographique pour le cache
     * 
     * @param array $geoFilters
     * @return string
     */
    protected function getGeographicCacheKey(array $geoFilters = []): string
    {
        $user = $this->getAuthUser();
        
        if (!$user->canAccessAllDistricts()) {
            return 'district_' . $user->id_district;
        }
        
        if (!empty($geoFilters['district_id'])) {
            return 'district_' . $geoFilters['district_id'];
        }
        
        if (!empty($geoFilters['region_id'])) {
            return 'region_' . $geoFilters['region_id'];
        }
        
        if (!empty($geoFilters['province_id'])) {
            return 'province_' . $geoFilters['province_id'];
        }
        
        return 'all_districts';
    }
}