<?php

namespace App\Rules;

use App\Models\DocumentGenere;
use Illuminate\Contracts\Validation\Rule;

class NumeroRecuRule implements Rule
{
    private $idDossier;
    
    public function __construct($idDossier)
    {
        $this->idDossier = $idDossier;
    }
    
    public function passes($attribute, $value)
    {
        // Vérifier le format: NNN/DDD
        if (!preg_match('/^\d{3}\/\d+$/', $value)) {
            return false;
        }
        
        // Vérifier l'unicité PAR DOSSIER
        $exists = DocumentGenere::where('numero_document', $value)
            ->where('id_dossier', $this->idDossier)
            ->where('type_document', DocumentGenere::TYPE_RECU)
            ->where('status', DocumentGenere::STATUS_ACTIVE)
            ->exists();
        
        return !$exists;
    }
    
    public function message()
    {
        return 'Le numéro de reçu :attribute est invalide ou existe déjà pour ce dossier.';
    }
}