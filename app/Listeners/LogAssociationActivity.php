<?php

namespace App\Listeners;

use App\Events\AssociationCreated;
use App\Events\AssociationDissociated;
// use Illuminate\Support\Facades\Log;

class LogAssociationActivity
{
    /**
     * Log la création d'une association
     */
    public function handleCreated(AssociationCreated $event): void
    {
        
    }

    /**
     * Log la dissociation
     */
    public function handleDissociated(AssociationDissociated $event): void
    {
     
    }

    /**
     * Enregistrer les listeners
     */
    public function subscribe($events): void
    {
        $events->listen(
            AssociationCreated::class,
            [LogAssociationActivity::class, 'handleCreated']
        );

        $events->listen(
            AssociationDissociated::class,
            [LogAssociationActivity::class, 'handleDissociated']
        );
    }
}
