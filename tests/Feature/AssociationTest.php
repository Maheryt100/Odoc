<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\{Demandeur, Propriete, Dossier, User};
use Illuminate\Foundation\Testing\RefreshDatabase;

class AssociationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_calculates_ordre_automatically_when_linking()
    {
        $user = User::factory()->create();
        $dossier = Dossier::factory()->create();
        $propriete = Propriete::factory()->for($dossier)->create();
        $demandeur1 = Demandeur::factory()->create();
        $demandeur2 = Demandeur::factory()->create();

        /** @var User $user */
        $this->actingAs($user);

        // Lier premier demandeur
        $response1 = $this->post(route('association.link'), [
            'id_demandeur' => $demandeur1->id,
            'id_propriete' => $propriete->id,
        ]);

        $response1->assertSessionHas('success');
        $this->assertDatabaseHas('demander', [
            'id_demandeur' => $demandeur1->id,
            'id_propriete' => $propriete->id,
            'ordre' => 1,
        ]);

        // Lier deuxième demandeur
        $response2 = $this->post(route('association.link'), [
            'id_demandeur' => $demandeur2->id,
            'id_propriete' => $propriete->id,
        ]);

        $response2->assertSessionHas('success');
        $this->assertDatabaseHas('demander', [
            'id_demandeur' => $demandeur2->id,
            'id_propriete' => $propriete->id,
            'ordre' => 2,
        ]);
    }

    /** @test */
    public function it_prevents_linking_to_archived_propriete()
    {
        // ... test
    }
}