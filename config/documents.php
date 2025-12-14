<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Feature Flag : Nouveaux Controllers
    |--------------------------------------------------------------------------
    |
    | Active/désactive les nouveaux controllers séparés pour la génération
    | de documents.
    |
    | true  = Utiliser RecuController, ActeVenteController, etc.
    | false = Utiliser DocumentGenerationController (ancien système)
    |
    */
    'use_new_controllers' => env('DOCUMENTS_USE_NEW_CONTROLLERS', false),

    /*
    |--------------------------------------------------------------------------
    | Templates Paths
    |--------------------------------------------------------------------------
    |
    | Chemins vers les templates Word (.docx) pour chaque type de document
    |
    */
    'templates' => [
        'recu' => 'app/public/modele_odoc/recu_paiement.docx',
        
        'acte_vente' => [
            'sans_consort' => [
                'immatriculation' => 'app/public/modele_odoc/sans_consort/immatriculation.docx',
                'morcellement' => 'app/public/modele_odoc/sans_consort/morcellement.docx',
            ],
            'avec_consort' => [
                'immatriculation' => 'app/public/modele_odoc/avec_consort/immatriculation.docx',
                'morcellement' => 'app/public/modele_odoc/avec_consort/morcellement.docx',
            ],
        ],
        
        'csf' => 'app/public/modele_odoc/document_CSF/Certificat_situation_financiere.docx',
        
        'requisition' => [
            'immatriculation' => 'app/public/modele_odoc/requisition_IM.docx',
            'morcellement' => 'app/public/modele_odoc/requisition_MO.docx',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Storage Settings
    |--------------------------------------------------------------------------
    |
    | Configuration du stockage des documents générés
    |
    */
    'storage' => [
        'disk' => 'public',
        'base_path' => 'pieces_jointes/documents',
        'permissions' => 0644,
    ],

    /*
    |--------------------------------------------------------------------------
    | Document Types
    |--------------------------------------------------------------------------
    |
    | Types de documents supportés avec leurs configurations
    |
    */
    'types' => [
        'RECU' => [
            'label' => 'Reçu de Paiement',
            'prefix' => 'RECU',
            'requires_demandeur' => true,
            'requires_recu' => false,
            'allow_duplicates' => false,
        ],
        'ADV' => [
            'label' => 'Acte de Vente',
            'prefix' => 'ADV',
            'requires_demandeur' => true,
            'requires_recu' => true,
            'allow_duplicates' => false,
        ],
        'CSF' => [
            'label' => 'Certificat de Situation Financière',
            'prefix' => 'CSF',
            'requires_demandeur' => true,
            'requires_recu' => false,
            'allow_duplicates' => true, // Un demandeur peut avoir plusieurs CSF
        ],
        'REQ' => [
            'label' => 'Réquisition',
            'prefix' => 'REQ',
            'requires_demandeur' => false,
            'requires_recu' => false,
            'allow_duplicates' => false,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Validation Rules
    |--------------------------------------------------------------------------
    |
    | Champs requis pour chaque type de document
    |
    */
    'validation' => [
        'propriete' => [
            'full' => ['titre', 'contenance', 'proprietaire', 'nature', 'vocation', 'situation'],
            'requisition' => ['titre', 'proprietaire', 'situation', 'type_operation'],
        ],
        'demandeur' => [
            'date_naissance',
            'lieu_naissance',
            'date_delivrance',
            'lieu_delivrance',
            'domiciliation',
            'occupation',
            'nom_mere',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Numero Generation
    |--------------------------------------------------------------------------
    |
    | Configuration de la génération des numéros de documents
    |
    */
    'numero' => [
        'recu' => [
            'format' => '%03d/%s', // 001/2024-001
            'scope' => 'dossier', // 'dossier' ou 'global'
            'padding' => 3,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging
    |--------------------------------------------------------------------------
    |
    | Configuration des logs pour la génération de documents
    |
    */
    'logging' => [
        'enabled' => true,
        'channel' => 'documents',
        'level' => 'info',
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance
    |--------------------------------------------------------------------------
    |
    | Paramètres de performance
    |
    */
    'performance' => [
        'use_locks' => true, // Utiliser les locks FOR UPDATE
        'cache_templates' => false, // Cache les templates en mémoire
        'max_generation_time' => 30, // Temps max en secondes
    ],

];