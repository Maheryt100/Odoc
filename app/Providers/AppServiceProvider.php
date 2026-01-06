<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Demander;
use App\Models\Propriete;
use App\Models\Dossier;
use App\Models\Demandeur;
use App\Observers\DemanderObserver;
use App\Observers\ProprieteObserver;
use App\Observers\DossierObserver;
use App\Observers\DemandeurObserver;

class AppServiceProvider extends ServiceProvider
{ 
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Dossier::observe(DossierObserver::class);
        Propriete::observe(ProprieteObserver::class);
        Demandeur::observe(DemandeurObserver::class);
        Demander::observe(DemanderObserver::class);
    }
}