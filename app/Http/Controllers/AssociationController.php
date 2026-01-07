<?php

namespace App\Http\Controllers;

use App\Models\Contenir;
use App\Models\Demander;
use App\Models\Demandeur;
use App\Models\Propriete;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
// use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class AssociationController extends Controller
{
    /**
     * Lier un demandeur à une propriété (avec date_demande)
     */
    public function link(Request $request)
    {
        $validated = $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
            'id_dossier' => 'required|exists:dossiers,id',
            'date_demande' => 'nullable|date|before_or_equal:today|after_or_equal:2020-01-01',
        ]);

        // Log::info('Association Link - Début', [
        //     'user_id' => Auth::id(),
        //     'data' => $validated,
        // ]);

        try {
            DB::beginTransaction();

            // CHARGER LES ENTITÉS
            $demandeur = Demandeur::findOrFail($validated['id_demandeur']);
            $propriete = Propriete::with(['dossier', 'demandes'])->findOrFail($validated['id_propriete']);

            //VÉRIFICATIONS MÉTIER (inchangées)
            if ($propriete->id_dossier !== (int)$validated['id_dossier']) {
                DB::rollBack();
                // Log::warning('Incohérence dossier', [
                //     'propriete_dossier' => $propriete->id_dossier,
                //     'dossier_fourni' => $validated['id_dossier'],
                // ]);
                return back()->with('error', 'La propriété n\'appartient pas à ce dossier.');
            }

            if ($propriete->dossier && $propriete->dossier->is_closed) {
                DB::rollBack();
                // Log::warning('Dossier fermé');
                return back()->with('error', 'Impossible de lier : le dossier est fermé.');
            }

            if ($propriete->is_archived) {
                DB::rollBack();
                // Log::warning('Propriété archivée');
                return back()->with('error', "Impossible de lier : la propriété Lot {$propriete->lot} est archivée (acquise).");
            }

            $existant = Demander::where('id_demandeur', $validated['id_demandeur'])
                ->where('id_propriete', $validated['id_propriete'])
                ->whereIn('status', ['active', 'archive'])
                ->first();

            if ($existant) {
                DB::rollBack();
                $statusMsg = $existant->status === 'archive' ? 'est archivée (acquise)' : 'existe déjà';
                // Log::warning('Association déjà existante');
                return back()->with('error', "L'association {$statusMsg}.");
            }

            $this->ensureDemandeurInDossier($validated['id_demandeur'], $propriete->id_dossier);

            $maxOrdre = Demander::where('id_propriete', $validated['id_propriete'])
                ->where('status', Demander::STATUS_ACTIVE)
                ->max('ordre') ?? 0;

            $nouvelOrdre = $maxOrdre + 1;

            // Log::info('Calcul ordre', [
            //     'propriete_id' => $validated['id_propriete'],
            //     'max_ordre_existant' => $maxOrdre,
            //     'nouvel_ordre' => $nouvelOrdre,
            // ]);

            $dateDemande = isset($validated['date_demande']) 
                ? Carbon::parse($validated['date_demande']) 
                : Carbon::today();

            if ($propriete->date_requisition && $dateDemande->lessThan($propriete->date_requisition)) {
                DB::rollBack();
                return back()->withErrors([
                    'date_demande' => "La date de demande ({$dateDemande->format('d/m/Y')}) ne peut pas être antérieure à la date de réquisition ({$propriete->date_requisition->format('d/m/Y')})."
                ]);
            }

            $demande = Demander::create([
                'id_demandeur' => $validated['id_demandeur'],
                'id_propriete' => $validated['id_propriete'],
                'date_demande' => $dateDemande,
                'ordre' => $nouvelOrdre,
                'status' => Demander::STATUS_ACTIVE,
                'status_consort' => $nouvelOrdre > 1,
                'id_user' => Auth::id(),
            ]);

            if ($demande->total_prix <= 0) {
                // Log::warning('Prix non calculé par l\'Observer', [
                //     'demande_id' => $demande->id,
                //     'total_prix' => $demande->total_prix,
                // ]);
            }

            DB::commit();

            $role = $nouvelOrdre === 1 ? 'demandeur principal' : "consort #{$nouvelOrdre}";

            // Log::info('Association créée avec succès', [
            //     'demande_id' => $demande->id,
            //     'demandeur' => $demandeur->nom_complet,
            //     'propriete_lot' => $propriete->lot,
            //     'ordre' => $nouvelOrdre,
            //     'date_demande' => $dateDemande->format('d/m/Y'),
            //     'total_prix' => $demande->total_prix,
            // ]);

            return back()->with('success', 
                "{$demandeur->nom_complet} lié à la propriété Lot {$propriete->lot} ({$role}). Date de demande : {$dateDemande->format('d/m/Y')}."
            );

        } catch (\Exception $e) {
            DB::rollBack();

            // Log::error('Erreur création association', [
            //     'error' => $e->getMessage(),
            //     'trace' => $e->getTraceAsString(),
            //     'data' => $validated,
            // ]);

            return back()->with('error', 
                "Erreur lors de la liaison : " . $e->getMessage()
            );
        }
    }

    /**
     * Dissocier (inchangé)
     */
    public function dissociate(Request $request)
    {
        $validated = $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        // Log::info('Association Dissociate - Début', [
        //     'user_id' => Auth::id(),
        //     'data' => $validated,
        // ]);

        try {
            DB::beginTransaction();

            $demandeur = Demandeur::findOrFail($validated['id_demandeur']);
            $propriete = Propriete::with('dossier')->findOrFail($validated['id_propriete']);

            if ($propriete->dossier && $propriete->dossier->is_closed) {
                DB::rollBack();
                return back()->with('error', 'Impossible de dissocier : le dossier est fermé.');
            }

            if ($propriete->is_archived) {
                DB::rollBack();
                return back()->with('error', "Impossible de dissocier : la propriété Lot {$propriete->lot} est archivée (acquise).");
            }

            $demande = Demander::where('id_demandeur', $validated['id_demandeur'])
                ->where('id_propriete', $validated['id_propriete'])
                ->where('status', Demander::STATUS_ACTIVE)
                ->first();

            if (!$demande) {
                DB::rollBack();
                return back()->with('error', 'Association active introuvable ou déjà dissociée.');
            }

            $ordreDissocie = $demande->ordre;
            $demande->delete();

            // Log::info('Demande supprimée', [
            //     'demande_id' => $demande->id,
            //     'ordre_dissocie' => $ordreDissocie,
            // ]);

            // Réorganiser ordres
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

            return back()->with('success', 
                "{$demandeur->nom_complet} dissocié de la propriété Lot {$propriete->lot}."
            );

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', "Erreur lors de la dissociation : " . $e->getMessage());
        }
    }

    /**
     * Helper (inchangé)
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
            
            // Log::info('Demandeur ajouté au dossier');
        }
    }

    /**
     * API : Obtenir les propriétés d'un demandeur (avec date_demande)
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
                    'date_demande' => $demande->date_demande?->format('Y-m-d'), 
                    'date_demande_formatted' => $demande->date_demande_formatted, 
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
     * API : Obtenir les demandeurs d'une propriété (avec date_demande)
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
                    'date_demande' => $demande->date_demande?->format('Y-m-d'), 
                    'date_demande_formatted' => $demande->date_demande_formatted, 
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

    public function getAssociationHistory($id_dossier)
    {
        try {
            $logPath = storage_path('logs/audit.log');
            
            if (!file_exists($logPath)) {
                return response()->json([
                    'success' => true,
                    'history' => []
                ]);
            }

            $logs = file($logPath);
            $history = [];

            foreach (array_reverse($logs) as $line) {
                if (strpos($line, 'Association') !== false) {
                    $history[] = json_decode(substr($line, strpos($line, '{')), true);
                }
                
                if (count($history) >= 50) break;
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