<?php

namespace App\Observers;

use App\Models\Demander;
use App\Services\PrixCalculatorService;
use App\Http\Controllers\Dashboard\Services\Statistics\StatisticsCacheService;
use Illuminate\Support\Facades\Log;

/**
 * Observer pour gérer les calculs de prix + invalidation cache sur les demandes
 */
class DemanderObserver
{
    public function __construct(
        private StatisticsCacheService $cache
    ) {}

    /**
     * AVANT création d'une demande
     * → calcul du prix
     */
    public function creating(Demander $demander): void
    {
        $this->calculerPrix($demander, 'creating');
    }

    /**
     * AVANT mise à jour d'une demande
     * → recalcul du prix si la propriété change
     */
    public function updating(Demander $demander): void
    {
        if ($demander->isDirty('id_propriete')) {
            $this->calculerPrix($demander, 'updating');
        }
    }

    /**
     * APRÈS création d'une demande
     * → invalider le cache
     */
    public function created(Demander $demander): void
    {
        $this->invalidateCache($demander);
    }

    /**
     * APRÈS mise à jour d'une demande
     * → invalider le cache
     */
    public function updated(Demander $demander): void
    {
        $this->invalidateCache($demander);
    }

    /**
     * APRÈS suppression d'une demande
     * → invalider le cache
     */
    public function deleted(Demander $demander): void
    {
        $this->invalidateCache($demander);
    }

    /**
     * Calcul du prix d'une demande
     */
    private function calculerPrix(Demander $demander, string $event): void
    {
        try {
            // Charger relation si pas chargée
            if (!$demander->relationLoaded('propriete')) {
                $demander->load('propriete.dossier');
            }

            $propriete = $demander->propriete;

            if (!$propriete) {
                // Log::warning("Observer Demander [{$event}]: Propriété introuvable", [
                //     'demander_id'   => $demander->id,
                //     'id_propriete'  => $demander->id_propriete,
                // ]);
                return;
            }

            // Calcul du prix
            $prix = PrixCalculatorService::calculerPrixTotal($propriete);
            $demander->total_prix = $prix;

            // Log::info("Observer Demander [{$event}]: Prix calculé", [
            //     'demander_id'   => $demander->id ?? 'nouveau',
            //     'propriete_id'  => $propriete->id,
            //     'lot'           => $propriete->lot,
            //     'prix_calcule'  => $prix,
            // ]);

        } catch (\Exception $e) {
            // Log::error("Observer Demander [{$event}]: Erreur calcul prix", [
            //     'demander_id'   => $demander->id ?? 'nouveau',
            //     'id_propriete'  => $demander->id_propriete,
            //     'error'         => $e->getMessage(),
            // ]);
        }
    }

    /**
     * Invalidation du cache du district
     */
    private function invalidateCache(Demander $demander): void
    {
        if ($demander->propriete && $demander->propriete->dossier) {
            $district = $demander->propriete->dossier->id_district;

            $this->cache->forgetDistrictCache($district);

            // Log::info("Cache invalidé suite à modification Demande", [
            //     'demande_id'    => $demander->id,
            //     'propriete_id'  => $demander->id_propriete,
            //     'district_id'   => $district,
            // ]);
        }
    }

    /**
     * Logging après sauvegarde
     */
    public function saved(Demander $demander): void
    {
        if ($demander->total_prix > 0) {
            // Log::info("Demande sauvegardée avec prix", [
            //     'demander_id' => $demander->id,
            //     'total_prix'  => $demander->total_prix,
            // ]);
        }
    }
}
