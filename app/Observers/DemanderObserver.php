<?php

namespace App\Observers;

use App\Models\Demander;
use App\Services\PrixCalculatorService;
use App\Http\Controllers\Dashboard\Services\Statistics\StatisticsCacheService;
use Illuminate\Support\Facades\Log;

class DemanderObserver
{
    public function __construct(
        private StatisticsCacheService $cache
    ) {}

    /**
     * ✅ CORRECTION : On calcule AVANT création, mais on NE SAUVEGARDE PAS
     * Laravel va automatiquement insérer avec le total_prix modifié
     */
    public function creating(Demander $demander): void
    {
        try {
            // Charger relation si pas chargée
            if (!$demander->relationLoaded('propriete')) {
                $demander->load('propriete.dossier');
            }

            $propriete = $demander->propriete;

            if (!$propriete) {
                Log::warning("Observer Demander [creating]: Propriété introuvable", [
                    'id_propriete' => $demander->id_propriete,
                ]);
                return;
            }

            // ✅ Calcul du prix AVANT insertion
            $prix = PrixCalculatorService::calculerPrixTotal($propriete);
            $demander->total_prix = $prix; // ✅ Juste modifier, Laravel va insérer avec cette valeur

            Log::info("Observer Demander [creating]: Prix calculé", [
                'propriete_id' => $propriete->id,
                'lot' => $propriete->lot,
                'prix_calcule' => $prix,
            ]);

        } catch (\Exception $e) {
            Log::error("Observer Demander [creating]: Erreur calcul prix", [
                'id_propriete' => $demander->id_propriete,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(), // ✅ AJOUTER LA STACK TRACE
            ]);
            
            // ✅ IMPORTANT : Ne pas bloquer la création si le prix échoue
            // Mettre un prix à 0 par défaut
            $demander->total_prix = 0;
        }
    }

    /**
     * ✅ APRÈS création : invalider cache + log
     */
    public function created(Demander $demander): void
    {
        $this->invalidateCache($demander);
        
        Log::info("Demande créée avec succès", [
            'demande_id' => $demander->id,
            'id_demandeur' => $demander->id_demandeur,
            'id_propriete' => $demander->id_propriete,
            'ordre' => $demander->ordre,
            'status' => $demander->status,
            'total_prix' => $demander->total_prix,
        ]);
    }

    /**
     * ✅ AVANT mise à jour : recalcul si propriété change
     */
    public function updating(Demander $demander): void
    {
        if ($demander->isDirty('id_propriete')) {
            try {
                $demander->load('propriete.dossier');
                $propriete = $demander->propriete;

                if ($propriete) {
                    $prix = PrixCalculatorService::calculerPrixTotal($propriete);
                    $demander->total_prix = $prix;

                    Log::info("Observer Demander [updating]: Prix recalculé", [
                        'demande_id' => $demander->id,
                        'ancienne_propriete' => $demander->getOriginal('id_propriete'),
                        'nouvelle_propriete' => $demander->id_propriete,
                        'prix_recalcule' => $prix,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error("Observer Demander [updating]: Erreur recalcul prix", [
                    'demande_id' => $demander->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * ✅ APRÈS mise à jour : invalider cache
     */
    public function updated(Demander $demander): void
    {
        $this->invalidateCache($demander);
        
        Log::info("Demande mise à jour", [
            'demande_id' => $demander->id,
            'changes' => $demander->getChanges(),
        ]);
    }

    /**
     * ✅ APRÈS suppression : invalider cache
     */
    public function deleted(Demander $demander): void
    {
        $this->invalidateCache($demander);
        
        Log::info("Demande supprimée", [
            'demande_id' => $demander->id,
            'id_propriete' => $demander->id_propriete,
        ]);
    }

    /**
     * Invalidation du cache du district
     */
    private function invalidateCache(Demander $demander): void
    {
        try {
            if ($demander->propriete && $demander->propriete->dossier) {
                $district = $demander->propriete->dossier->id_district;
                $this->cache->forgetDistrictCache($district);

                Log::info("Cache district invalidé", [
                    'demande_id' => $demander->id,
                    'district_id' => $district,
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Erreur invalidation cache", [
                'demande_id' => $demander->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}