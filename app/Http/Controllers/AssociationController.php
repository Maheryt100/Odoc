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
     * ✅ Lier un demandeur à une propriété
     */
    public function link(Request $request)
    {
        $validated = $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
            // ❌ PROBLÈME : ordre est requis mais pas fourni par le frontend
            // ✅ SOLUTION : Le rendre nullable et auto-calculer
            'ordre' => 'nullable|integer|min:1',
        ]);

        try {
            DB::beginTransaction();

            $demandeur = Demandeur::findOrFail($validated['id_demandeur']);
            $propriete = Propriete::with('dossier')->findOrFail($validated['id_propriete']);

            // ✅ VÉRIFICATIONS MÉTIER
            if (!$propriete->canBeLinked()) {
                DB::rollBack();
                return back()->with('error', $propriete->getLinkBlockReason());
            }

            // Vérifier si déjà lié
            $existant = Demander::where('id_demandeur', $validated['id_demandeur'])
                ->where('id_propriete', $validated['id_propriete'])
                ->whereIn('status', ['active', 'archive'])
                ->first();

            if ($existant) {
                DB::rollBack();
                $statusMsg = $existant->status === 'archive' ? 'est archivée (acquise)' : 'existe déjà';
                return back()->with('error', "⚠️ L'association {$statusMsg}.");
            }

            // ✅ CORRECTION : Auto-calculer l'ordre si non fourni
            if (!isset($validated['ordre'])) {
                $maxOrdre = Demander::where('id_propriete', $validated['id_propriete'])
                    ->where('status', Demander::STATUS_ACTIVE)
                    ->max('ordre') ?? 0;
                
                $validated['ordre'] = $maxOrdre + 1;
                
                Log::info('🔢 Ordre auto-calculé', [
                    'propriete_id' => $validated['id_propriete'],
                    'ordre_calcule' => $validated['ordre']
                ]);
            }

            // S'assurer que le demandeur est dans le dossier
            $this->ensureDemandeurInDossier($validated['id_demandeur'], $propriete->id_dossier);

            // Créer la liaison
            $demande = Demander::create([
                'id_demandeur' => $validated['id_demandeur'],
                'id_propriete' => $validated['id_propriete'],
                'ordre' => $validated['ordre'],
                'status' => Demander::STATUS_ACTIVE,
                'status_consort' => $validated['ordre'] > 1,
                'id_user' => Auth::id(),
            ]);

            DB::commit();

            $role = $validated['ordre'] === 1 ? 'demandeur principal' : "consort #{$validated['ordre']}";
            
            Log::info('✅ Liaison créée', [
                'demande_id' => $demande->id,
                'demandeur' => $demandeur->nom_complet,
                'propriete_lot' => $propriete->lot,
                'ordre' => $validated['ordre']
            ]);

            return back()->with('success', 
                "✅ {$demandeur->nom_complet} lié à la propriété Lot {$propriete->lot} ({$role})."
            );

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Erreur liaison', [
                'error' => $e->getMessage(),
                'data' => $validated
            ]);

            return back()->with('error', 
                "❌ Erreur lors de la liaison : " . $e->getMessage()
            );
        }
    }

    /**
     * ✅ Dissocier un demandeur d'une propriété
     */
    public function dissociate(Request $request)
    {
        $validated = $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        try {
            DB::beginTransaction();

            $demandeur = Demandeur::findOrFail($validated['id_demandeur']);
            $propriete = Propriete::with('dossier')->findOrFail($validated['id_propriete']);

            // ✅ VÉRIFICATIONS MÉTIER
            
            // 1. Dossier fermé
            if ($propriete->dossier && $propriete->dossier->is_closed) {
                DB::rollBack();
                Log::warning('Dissociation bloquée : dossier fermé', [
                    'dossier_id' => $propriete->dossier->id
                ]);
                
                return back()->with('error', 
                    "❌ Impossible de dissocier : le dossier est fermé."
                );
            }

            // 2. Propriété archivée (toutes demandes archivées)
            if ($propriete->is_archived) {
                DB::rollBack();
                Log::warning('Dissociation bloquée : propriété archivée', [
                    'propriete_id' => $propriete->id,
                    'lot' => $propriete->lot
                ]);
                
                return back()->with('error', 
                    "❌ Impossible de dissocier : la propriété Lot {$propriete->lot} est archivée (acquise)."
                );
            }

            // 3. Trouver la demande active
            $demande = Demander::where('id_demandeur', $validated['id_demandeur'])
                ->where('id_propriete', $validated['id_propriete'])
                ->where('status', Demander::STATUS_ACTIVE)
                ->first();

            if (!$demande) {
                DB::rollBack();
                Log::warning('Dissociation bloquée : association introuvable', [
                    'demandeur_id' => $validated['id_demandeur'],
                    'propriete_id' => $validated['id_propriete']
                ]);
                
                return back()->with('error', 
                    "⚠️ Association active introuvable ou déjà dissociée."
                );
            }

            // 4. Supprimer la demande
            $ordreDissocie = $demande->ordre;
            $demande->delete();

            // 5. Réorganiser les ordres restants
            $demandesRestantes = Demander::where('id_propriete', $validated['id_propriete'])
                ->where('status', Demander::STATUS_ACTIVE)
                ->orderBy('ordre')
                ->get();

            foreach ($demandesRestantes as $index => $d) {
                $newOrdre = $index + 1;
                if ($d->ordre !== $newOrdre) {
                    $d->update([
                        'ordre' => $newOrdre,
                        'status_consort' => $newOrdre > 1
                    ]);
                }
            }

            DB::commit();

            Log::info('✅ Dissociation effectuée', [
                'demandeur' => $demandeur->nom_complet,
                'propriete_lot' => $propriete->lot,
                'ordre_dissocie' => $ordreDissocie
            ]);

            return back()->with('success', 
                "✅ {$demandeur->nom_complet} dissocié de la propriété Lot {$propriete->lot}."
            );

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Erreur dissociation', [
                'error' => $e->getMessage(),
                'data' => $validated
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
                'dossier_id' => $dossierId
            ]);
        }
    }

    /**
     * ✅ API : Obtenir les propriétés d'un demandeur avec statistiques
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
            Log::error('❌ Erreur getDemandeurProprietes', [
                'id_demandeur' => $id_demandeur,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des propriétés'
            ], 500);
        }
    }

    /**
     * ✅ API : Obtenir les demandeurs d'une propriété avec statistiques
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
            Log::error('❌ Erreur getProprieteDemandeurs', [
                'id_propriete' => $id_propriete,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des demandeurs'
            ], 500);
        }
    }

    /**
     * ✅ NOUVEAU : Obtenir l'historique des associations d'un dossier
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