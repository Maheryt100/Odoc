<?php
// ============================================
// config/jwt.php - NOUVEAU FICHIER
// Configuration JWT pour GeODOC
// ============================================

return [

    /*
    |--------------------------------------------------------------------------
    | Durée de vie du token (en secondes)
    |--------------------------------------------------------------------------
    |
    | Définit combien de temps un token JWT reste valide.
    | Valeur par défaut : 28800 secondes (8 heures)
    | 
    | Pour usage terrain, 8 heures est recommandé.
    | Pour usage bureau, 1 heure (3600) suffit.
    |
    */
    'lifetime' => env('JWT_LIFETIME', 28800),

    /*
    |--------------------------------------------------------------------------
    | Délai avant expiration pour rafraîchissement automatique (en secondes)
    |--------------------------------------------------------------------------
    |
    | Si un token expire dans moins de X secondes, il sera automatiquement
    | rafraîchi par le middleware InertiaTopoData.
    |
    | Valeur par défaut : 1800 secondes (30 minutes)
    |
    */
    'refresh_threshold' => env('JWT_REFRESH_THRESHOLD', 1800),

    /*
    |--------------------------------------------------------------------------
    | Algorithme de signature
    |--------------------------------------------------------------------------
    |
    | Algorithme utilisé pour signer les tokens.
    | HS256 est recommandé pour la plupart des usages.
    |
    */
    'algorithm' => 'HS256',

    /*
    |--------------------------------------------------------------------------
    | Issuer (Émetteur)
    |--------------------------------------------------------------------------
    |
    | Identifie qui a créé le token (claim "iss" dans le JWT).
    | Par défaut, utilise l'URL de l'application.
    |
    */
    'issuer' => env('JWT_ISSUER', env('APP_URL')),

    /*
    |--------------------------------------------------------------------------
    | Logging
    |--------------------------------------------------------------------------
    |
    | Active les logs pour les opérations JWT.
    | Désactiver en production pour les performances.
    |
    */
    'logging' => env('JWT_LOGGING', env('APP_DEBUG', false)),

];