<?php

namespace App\Http\Controllers;

use App\Models\Contenir;
use App\Models\Demander;
use App\Models\Demandeur;
use App\Models\Propriete;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;


class AssociationController extends Controller
{
    /**
     * Lier un demandeur à une propriété
     */
    public function link(Request $request)
    {
        // ✅ VALIDATION COMPLÈTE
        $validated = $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
            'id_dossier' => 'required|exists:dossiers,id',
        ]);

        // ✅ LOG DE DEBUG
        Log::info('🔗 Association Link - Début', [
            'user_id' => Auth::id(),
            'data' => $validated,
        ]);

        try {
            DB::beginTransaction();

            // ✅ CHARGER LES ENTITÉS AVEC RELATIONS
            $demandeur = Demandeur::findOrFail($validated['id_demandeur']);
            $propriete = Propriete::with(['dossier', 'demandes'])->findOrFail($validated['id_propriete']);

            // ✅ VÉRIFICATION 1 : Cohérence dossier
            if ($propriete->id_dossier !== (int)$validated['id_dossier']) {
                DB::rollBack();
                Log::warning('❌ Incohérence dossier', [
                    'propriete_dossier' => $propriete->id_dossier,
                    'dossier_fourni' => $validated['id_dossier'],
                ]);
                return back()->with('error', '⚠️ La propriété n\'appartient pas à ce dossier.');
            }

            // ✅ VÉRIFICATION 2 : Dossier fermé
            if ($propriete->dossier && $propriete->dossier->is_closed) {
                DB::rollBack();
                Log::warning('❌ Dossier fermé', [
                    'dossier_id' => $propriete->id_dossier,
                    'dossier_nom' => $propriete->dossier->nom_dossier,
                ]);
                return back()->with('error', '🔒 Impossible de lier : le dossier est fermé.');
            }

            // ✅ VÉRIFICATION 3 : Propriété archivée
            if ($propriete->is_archived) {
                DB::rollBack();
                Log::warning('❌ Propriété archivée', [
                    'propriete_id' => $propriete->id,
                    'lot' => $propriete->lot,
                ]);
                return back()->with('error', "📦 Impossible de lier : la propriété Lot {$propriete->lot} est archivée (acquise).");
            }

            // ✅ VÉRIFICATION 4 : Association déjà existante
            $existant = Demander::where('id_demandeur', $validated['id_demandeur'])
                ->where('id_propriete', $validated['id_propriete'])
                ->whereIn('status', ['active', 'archive'])
                ->first();

            if ($existant) {
                DB::rollBack();
                $statusMsg = $existant->status === 'archive' ? 'est archivée (acquise)' : 'existe déjà';
                Log::warning('❌ Association déjà existante', [
                    'demandeur_id' => $validated['id_demandeur'],
                    'propriete_id' => $validated['id_propriete'],
                    'status' => $existant->status,
                ]);
                return back()->with('error', "⚠️ L'association {$statusMsg}.");
            }

            // ✅ ÉTAPE 1 : S'assurer que le demandeur est dans le dossier
            $this->ensureDemandeurInDossier($validated['id_demandeur'], $propriete->id_dossier);

            // ✅ ÉTAPE 2 : Calculer l'ordre automatiquement (CÔTÉ BACKEND)
            $maxOrdre = Demander::where('id_propriete', $validated['id_propriete'])
                ->where('status', Demander::STATUS_ACTIVE)
                ->max('ordre') ?? 0;

            $nouvelOrdre = $maxOrdre + 1;

            Log::info('📊 Calcul ordre', [
                'propriete_id' => $validated['id_propriete'],
                'max_ordre_existant' => $maxOrdre,
                'nouvel_ordre' => $nouvelOrdre,
            ]);

            // ✅ ÉTAPE 3 : Créer la liaison (l'Observer calculera le prix)
            $demande = Demander::create([
                'id_demandeur' => $validated['id_demandeur'],
                'id_propriete' => $validated['id_propriete'],
                'ordre' => $nouvelOrdre,
                'status' => Demander::STATUS_ACTIVE,
                'status_consort' => $nouvelOrdre > 1,
                'id_user' => Auth::id(),
            ]);

            // ✅ VÉRIFIER QUE LE PRIX A ÉTÉ CALCULÉ
            if ($demande->total_prix <= 0) {
                Log::warning('⚠️ Prix non calculé par l\'Observer', [
                    'demande_id' => $demande->id,
                    'total_prix' => $demande->total_prix,
                ]);
            }

            DB::commit();

            $role = $nouvelOrdre === 1 ? 'demandeur principal' : "consort #{$nouvelOrdre}";

            Log::info('✅ Association créée avec succès', [
                'demande_id' => $demande->id,
                'demandeur' => $demandeur->nom_complet,
                'propriete_lot' => $propriete->lot,
                'ordre' => $nouvelOrdre,
                'total_prix' => $demande->total_prix,
            ]);

            return back()->with('success', 
                "✅ {$demandeur->nom_complet} lié à la propriété Lot {$propriete->lot} ({$role}). Prix calculé : " . number_format($demande->total_prix, 0, ',', ' ') . " Ar"
            );

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('❌ Erreur création association', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'data' => $validated,
            ]);

            return back()->with('error', 
                "❌ Erreur lors de la liaison : " . $e->getMessage()
            );
        }
    }

    /**
     * Dissocier un demandeur d'une propriété
     */
    public function dissociate(Request $request)
    {
        $validated = $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        Log::info('🔓 Association Dissociate - Début', [
            'user_id' => Auth::id(),
            'data' => $validated,
        ]);

        try {
            DB::beginTransaction();

            $demandeur = Demandeur::findOrFail($validated['id_demandeur']);
            $propriete = Propriete::with('dossier')->findOrFail($validated['id_propriete']);

            // ✅ VÉRIFICATION 1 : Dossier fermé
            if ($propriete->dossier && $propriete->dossier->is_closed) {
                DB::rollBack();
                Log::warning('❌ Dossier fermé', [
                    'dossier_id' => $propriete->id_dossier,
                ]);
                return back()->with('error', 
                    "🔒 Impossible de dissocier : le dossier est fermé."
                );
            }

            // ✅ VÉRIFICATION 2 : Propriété archivée
            if ($propriete->is_archived) {
                DB::rollBack();
                Log::warning('❌ Propriété archivée', [
                    'propriete_id' => $propriete->id,
                    'lot' => $propriete->lot,
                ]);
                return back()->with('error', 
                    "📦 Impossible de dissocier : la propriété Lot {$propriete->lot} est archivée (acquise)."
                );
            }

            // ✅ VÉRIFICATION 3 : Trouver la demande active
            $demande = Demander::where('id_demandeur', $validated['id_demandeur'])
                ->where('id_propriete', $validated['id_propriete'])
                ->where('status', Demander::STATUS_ACTIVE)
                ->first();

            if (!$demande) {
                DB::rollBack();
                Log::warning('❌ Association active introuvable', [
                    'demandeur_id' => $validated['id_demandeur'],
                    'propriete_id' => $validated['id_propriete'],
                ]);
                return back()->with('error', 
                    "⚠️ Association active introuvable ou déjà dissociée."
                );
            }

            // ✅ ÉTAPE 1 : Supprimer la demande
            $ordreDissocie = $demande->ordre;
            $demande->delete();

            Log::info('🗑️ Demande supprimée', [
                'demande_id' => $demande->id,
                'ordre_dissocie' => $ordreDissocie,
            ]);

            // ✅ ÉTAPE 2 : Réorganiser les ordres restants
            $demandesRestantes = Demander::where('id_propriete', $validated['id_propriete'])
                ->where('status', Demander::STATUS_ACTIVE)
                ->orderBy('ordre')
                ->get();

            Log::info('🔄 Réorganisation des ordres', [
                'propriete_id' => $validated['id_propriete'],
                'demandes_restantes' => $demandesRestantes->count(),
            ]);

            foreach ($demandesRestantes as $index => $d) {
                $newOrdre = $index + 1;
                if ($d->ordre !== $newOrdre) {
                    $d->update([
                        'ordre' => $newOrdre,
                        'status_consort' => $newOrdre > 1
                    ]);
                    
                    Log::info('🔄 Ordre mis à jour', [
                        'demande_id' => $d->id,
                        'ancien_ordre' => $d->ordre,
                        'nouvel_ordre' => $newOrdre,
                    ]);
                }
            }

            DB::commit();

            Log::info('✅ Dissociation réussie', [
                'demandeur' => $demandeur->nom_complet,
                'propriete_lot' => $propriete->lot,
            ]);

            return back()->with('success', 
                "✅ {$demandeur->nom_complet} dissocié de la propriété Lot {$propriete->lot}."
            );

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('❌ Erreur dissociation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'data' => $validated,
            ]);

            return back()->with('error', 
                "❌ Erreur lors de la dissociation : " . $e->getMessage()
            );
        }
    }

    /**
     * ✅ HELPER : S'assurer que le demandeur est dans le dossier
     */
    private function ensureDemandeurInDossier(int $demandeurId, int $dossierId): void
    {
        $exists = Contenir::where('id_demandeur', $demandeurId)
            ->where('id_dossier', $dossierId)
            ->exists();
            
        if (!$exists) {
            Contenir::create([
                'id_demandeur' => $demandeurId,
                'id_dossier' => $dossierId,
            ]);
            
            Log::info('➕ Demandeur ajouté au dossier', [
                'demandeur_id' => $demandeurId,
                'dossier_id' => $dossierId,
            ]);
        }
    }

    /**
     * API : Obtenir les propriétés d'un demandeur avec statistiques
     */
    public function getDemandeurProprietes($id_demandeur)
    {
        try {
            $demandeur = Demandeur::with([
                'demandes.propriete.dossier'
            ])->findOrFail($id_demandeur);
            
            $proprietes = $demandeur->demandes->map(function ($demande) {
                $propriete = $demande->propriete;
                
                return [
                    'id' => $propriete->id,
                    'lot' => $propriete->lot,
                    'titre' => $propriete->titre,
                    'contenance' => $propriete->contenance,
                    'nature' => $propriete->nature,
                    'vocation' => $propriete->vocation,
                    'situation' => $propriete->situation,
                    'status' => $propriete->status ?? 'active',
                    'is_archived' => $propriete->is_archived,
                    'dossier_nom' => $propriete->dossier->nom_dossier ?? 'N/A',
                    'dossier_closed' => $propriete->dossier->is_closed ?? false,
                    'demande_id' => $demande->id,
                    'demande_status' => $demande->status,
                    'total_prix' => $demande->total_prix,
                    'can_dissociate' => $demande->canBeDissociated(),
                    'autres_demandeurs_count' => $propriete->demandes()
                        ->where('id', '!=', $demande->id)
                        ->where('status', Demander::STATUS_ACTIVE)
                        ->count(),
                ];
            });

            return response()->json([
                'success' => true,
                'demandeur' => [
                    'id' => $demandeur->id,
                    'nom_complet' => $demandeur->nom_complet,
                    'cin' => $demandeur->cin,
                    'stats' => $demandeur->getStats(),
                ],
                'proprietes' => $proprietes,
            ]);
        } catch (\Exception $e) {
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des propriétés'
            ], 500);
        }
    }

    /**
     * API : Obtenir les demandeurs d'une propriété avec statistiques
     */
    public function getProprieteDemandeurs($id_propriete)
    {
        try {
            $propriete = Propriete::with([
                'dossier',
                'demandes.demandeur'
            ])->findOrFail($id_propriete);
            
            $demandeurs = $propriete->demandes->map(function ($demande) use ($propriete) {
                $demandeur = $demande->demandeur;
                
                return [
                    'id' => $demandeur->id,
                    'titre' => $demandeur->titre_demandeur,
                    'nom' => $demandeur->nom_demandeur,
                    'prenom' => $demandeur->prenom_demandeur,
                    'nom_complet' => $demandeur->nom_complet,
                    'cin' => $demandeur->cin,
                    'occupation' => $demandeur->occupation,
                    'telephone' => $demandeur->telephone,
                    'demande_id' => $demande->id,
                    'demande_status' => $demande->status,
                    'ordre' => $demande->ordre,
                    'is_principal' => $demande->ordre === 1,
                    'total_prix' => $demande->total_prix,
                    'is_archived' => $demande->status === Demander::STATUS_ARCHIVE,
                    'can_dissociate' => $demande->canBeDissociated(),
                    'stats' => $demandeur->getStats(),
                ];
            });

            $stats = $propriete->getStats();

            return response()->json([
                'success' => true,
                'propriete' => [
                    'id' => $propriete->id,
                    'lot' => $propriete->lot,
                    'titre' => $propriete->titre,
                    'contenance' => $propriete->contenance,
                    'status' => $propriete->status ?? 'active',
                    'is_archived' => $propriete->is_archived,
                    'dossier_closed' => $propriete->dossier->is_closed ?? false,
                    'stats' => $stats,
                ],
                'demandeurs' => $demandeurs,
            ]);
        } catch (\Exception $e) {
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des demandeurs'
            ], 500);
        }
    }

    /*
     * Obtenir l'historique des associations d'un dossier
     */
    public function getAssociationHistory($id_dossier)
    {
        try {
            // Lire depuis le fichier de log audit
            $logPath = storage_path('logs/audit.log');
            
            if (!file_exists($logPath)) {
                return response()->json([
                    'success' => true,
                    'history' => []
                ]);
            }

            // Parser les logs (simplifié - à améliorer avec une vraie DB)
            $logs = file($logPath);
            $history = [];

            foreach (array_reverse($logs) as $line) {
                if (strpos($line, 'Association') !== false) {
                    $history[] = json_decode(substr($line, strpos($line, '{')), true);
                }
                
                if (count($history) >= 50) break; // Limiter à 50 entrées
            }

            return response()->json([
                'success' => true,
                'history' => $history
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'historique'
            ], 500);
        }
    }
}