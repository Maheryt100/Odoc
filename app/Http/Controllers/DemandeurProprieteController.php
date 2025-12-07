<?php

namespace App\Http\Controllers;

use App\Models\Contenir;
use App\Models\Demandeur;
use App\Models\Demander;
use App\Models\Dossier;
use App\Models\Propriete;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Rules\ValidCIN;
use App\Http\Requests\StoreDemandeurRequest;

class DemandeurProprieteController extends Controller
{
    /**
     * 1. NOUVEAU LOT : Afficher le formulaire
     */
    public function create($id)
    {
        $dossier = Dossier::findOrFail($id);
        
        return Inertia::render('DemandeursProprietes/NouveauLot', [
            'dossier' => $dossier,
        ]);
    }

    /**
     * 1. NOUVEAU LOT : Enregistrer
     * ✅ AMÉLIORATION: Utilisation de Form Request
     */
    public function store(StoreDemandeurRequest $request)
    {
        // ✅ Données déjà validées par StoreDemandeurRequest
        $validated = $request->validated();
        
        DB::beginTransaction();
        
        try {
            $id_user = Auth::id();
            
            // 1. Créer la propriété
            $proprieteData = array_merge(
                $request->only([
                    'lot', 'propriete_mere', 'titre_mere', 'titre', 'proprietaire',
                    'contenance', 'charge', 'situation', 'nature', 'vocation',
                    'numero_FN', 'numero_requisition', 'date_requisition',
                    'date_inscription', 'dep_vol', 'numero_dep_vol', 'type_operation'
                ]),
                [
                    'id_dossier' => $validated['id_dossier'],
                    'id_user' => $id_user,
                ]
            );

            // ✅ AMÉLIORATION: Convertir chaînes vides en null
            $proprieteData = $this->convertEmptyToNull($proprieteData);

            Log::info('Création propriété', ['data' => $proprieteData]);
            $propriete = Propriete::create($proprieteData);

            // 2. Traiter les demandeurs
            $demandeursTraites = [];
            
            foreach ($validated['demandeurs'] as $index => $demandeurData) {
                $num = $index + 1;
                Log::info("👤 Traitement demandeur $num", [
                    'cin' => $demandeurData['cin'],
                    'nom' => $demandeurData['nom_demandeur'],
                ]);

                // ✅ Convertir chaînes vides en null
                $cleanData = $this->convertEmptyToNull($demandeurData);

                // Vérifier si demandeur existe
                $demandeurExistant = Demandeur::where('cin', $cleanData['cin'])->first();
                
                if ($demandeurExistant) {
                    Log::info("Demandeur existant trouvé, mise à jour", [
                        'id' => $demandeurExistant->id,
                        'cin' => $demandeurExistant->cin
                    ]);
                    
                    // ✅ Mise à jour sélective (garde les valeurs existantes si nouvelles sont null)
                    $updateData = array_filter($cleanData, fn($v) => $v !== null);
                    $demandeurExistant->update($updateData);
                    $demandeur = $demandeurExistant;
                    
                } else {
                    Log::info("Création nouveau demandeur", [
                        'cin' => $cleanData['cin'],
                        'nom' => $cleanData['nom_demandeur']
                    ]);
                    
                    $demandeur = Demandeur::create(array_merge($cleanData, [
                        'id_user' => $id_user,
                        'nationalite' => $cleanData['nationalite'] ?? 'Malagasy',
                        'situation_familiale' => $cleanData['situation_familiale'] ?? 'Non spécifiée',
                        'regime_matrimoniale' => $cleanData['regime_matrimoniale'] ?? 'Non spécifié',
                    ]));
                }

                Log::info("Demandeur traité", [
                    'id' => $demandeur->id,
                    'action' => $demandeurExistant ? 'mis à jour' : 'créé'
                ]);

                // 3. Ajouter au dossier
                Contenir::firstOrCreate([
                    'id_demandeur' => $demandeur->id,
                    'id_dossier' => $validated['id_dossier'],
                ]);

                // 4. Créer la liaison (si pas déjà existante)
                $liaisonExistante = Demander::where('id_demandeur', $demandeur->id)
                    ->where('id_propriete', $propriete->id)
                    ->exists();
                
                if (!$liaisonExistante) {
                    Demander::create([
                        'id_demandeur' => $demandeur->id,
                        'id_propriete' => $propriete->id,
                        'id_user' => $id_user,
                        'status' => Demander::STATUS_ACTIVE,
                        'status_consort' => count($validated['demandeurs']) > 1,
                        // ordre sera calculé automatiquement par le boot() du modèle
                        // total_prix sera calculé par l'Observer
                    ]);
                }
                
                $demandeursTraites[] = $demandeur->nom_demandeur;
            }

            DB::commit();
            
            Log::info('🎉 Création complète réussie', [
                'propriete_id' => $propriete->id,
                'demandeurs_count' => count($demandeursTraites),
                'demandeurs' => $demandeursTraites
            ]);
            
            $message = count($validated['demandeurs']) > 1 
                ? count($validated['demandeurs']) . ' demandeurs liés à la propriété avec succès'
                : 'Demandeur et propriété créés avec succès';
            
            return Redirect::route('dossiers.show', $validated['id_dossier'])
                ->with('success', $message);
                
        } catch (\Exception $e) {
            DB::rollBack();
        
            Log::error('Erreur création', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }

    /**
     * ✅ CORRECTION : Vérifier via demandes
     */
    private function isPropertyArchived(Propriete $propriete): bool
    {
        $demandesActives = Demander::where('id_propriete', $propriete->id)
            ->where('status', 'active')
            ->count();
            
        $demandesArchivees = Demander::where('id_propriete', $propriete->id)
            ->where('status', 'archive')
            ->count();
            
        return $demandesArchivees > 0 && $demandesActives === 0;
    }

    private function getBlockedActionMessage(Propriete $propriete, string $action): string
    {
        return "Impossible d'effectuer l'action '{$action}' : la propriété Lot {$propriete->lot} est archivée (acquise).";
    }


    /**
     * LIER EXISTANT : Afficher le formulaire
     */
    public function linkExisting($id, $id_demandeur = null, $id_propriete = null)
    {
        $dossier = Dossier::with(['proprietes', 'demandeurs'])->findOrFail($id);
        
        if ($id_propriete) {
            $propriete = Propriete::findOrFail($id_propriete);
            if ($propriete->is_archived) {
                return Redirect::route('dossiers.show', $dossier->id)
                    ->with('error', "❌ Impossible de lier : la propriété Lot {$propriete->lot} est archivée (acquise).");
            }
        }
        
        $demandeur = null;
        if ($id_demandeur) {
            $demandeur = Demandeur::find($id_demandeur);
        }
        
        return Inertia::render('DemandeursProprietes/LierExistant', [
            'dossier' => $dossier,
            'proprietes' => $dossier->proprietes,
            'demandeur' => $demandeur,
            'id_propriete' => $id_propriete,
        ]);
    }

    /**
     * LIER EXISTANT : Rechercher
     */
    public function searchToLink(Request $request)
    {
        $request->validate([
            'cin' => 'required|string',
            'id_dossier' => 'required|exists:dossiers,id'
        ]);
        
        $demandeur = null;
        
        if (preg_match('/^\d{12}$/', $request->cin)) {
            $demandeur = Demandeur::where('cin', $request->cin)->first();
        } else {
            $demandeur = Demandeur::where('nom_demandeur', 'ilike', '%' . $request->cin . '%')
                ->orWhere('prenom_demandeur', 'ilike', '%' . $request->cin . '%')
                ->first();
        }
        
        $dossier = Dossier::with(['proprietes', 'demandeurs'])->findOrFail($request->id_dossier);
        
        if ($demandeur) {
            $existeInDossier = Contenir::where('id_demandeur', $demandeur->id)
                ->where('id_dossier', $dossier->id)
                ->exists();
                
            if (!$existeInDossier) {
                Contenir::create([
                    'id_demandeur' => $demandeur->id,
                    'id_dossier' => $dossier->id,
                ]);
            }
        }
        
        return Inertia::render('DemandeursProprietes/LierExistant', [
            'dossier' => $dossier,
            'proprietes' => $dossier->proprietes,
            'demandeur' => $demandeur,
            'cin_search' => $request->cin,
        ]);
    }


    /**
     * LIER EXISTANT : Enregistrer
     */
    public function storeLink(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
            'mode' => 'required|in:existant,nouveau',
        ]);

        DB::beginTransaction();
        
        try {
            $id_user = Auth::id();
            $propriete = Propriete::findOrFail($request->id_propriete);
            
            // ✅ Vérification métier
            if ($propriete->is_archived) {
                DB::rollBack();
                return back()->with('error', "❌ Impossible de lier : la propriété Lot {$propriete->lot} est archivée (acquise).");
            }
            
            if ($request->mode === 'nouveau') {
                $request->validate([
                    'titre_demandeur' => 'required|string|max:15',
                    'nom_demandeur' => 'required|string|max:40',
                    'prenom_demandeur' => 'required|string|max:50',
                    'date_naissance' => 'required|date|before:-18 years',
                    'cin' => 'required|string|size:12|unique:demandeurs,cin',
                ]);
                
                $demandeurData = $this->convertEmptyToNull($request->only([
                    'titre_demandeur', 'nom_demandeur', 'prenom_demandeur',
                    'date_naissance', 'lieu_naissance', 'sexe', 'occupation',
                    'nom_pere', 'nom_mere', 'cin', 'date_delivrance',
                    'lieu_delivrance', 'date_delivrance_duplicata',
                    'lieu_delivrance_duplicata', 'domiciliation', 'nationalite',
                    'situation_familiale', 'regime_matrimoniale', 'date_mariage',
                    'lieu_mariage', 'marie_a', 'telephone'
                ]));
                
                $demandeur = Demandeur::create(array_merge($demandeurData, [
                    'id_user' => $id_user,
                    'nationalite' => $demandeurData['nationalite'] ?? 'Malagasy',
                    'situation_familiale' => $demandeurData['situation_familiale'] ?? 'Non spécifiée',
                    'regime_matrimoniale' => $demandeurData['regime_matrimoniale'] ?? 'Non spécifié',
                ]));
                
                Contenir::create([
                    'id_demandeur' => $demandeur->id,
                    'id_dossier' => $request->id_dossier,
                ]);
                
                $id_demandeur = $demandeur->id;
            } else {
                $request->validate(['id_demandeur' => 'required|exists:demandeurs,id']);
                $id_demandeur = $request->id_demandeur;
            }

            // Vérifier si déjà lié
            $existingLink = Demander::where('id_demandeur', $id_demandeur)
                ->where('id_propriete', $request->id_propriete)
                ->exists();
                
            if ($existingLink) {
                return back()->withErrors(['error' => 'Ce demandeur est déjà lié à cette propriété']);
            }

            // Créer la liaison
            Demander::create([
                'id_demandeur' => $id_demandeur,
                'id_propriete' => $request->id_propriete,
                'id_user' => $id_user,
                'status' => Demander::STATUS_ACTIVE,
                // ordre calculé automatiquement par boot()
                // total_prix calculé par Observer
            ]);

            DB::commit();

            return Redirect::route('dossiers.show', $propriete->id_dossier)
                ->with('success', 'Demandeur lié à la propriété avec succès');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }

    /**
     * AJOUTER DEMANDEUR : Afficher
     */
    public function addToProperty($id, $id_propriete = null)
    {
        $dossier = Dossier::with('proprietes')->findOrFail($id);
        
        if ($id_propriete) {
            $propriete = Propriete::findOrFail($id_propriete);
            if ($propriete->is_archived) {
                return Redirect::route('dossiers.show', $dossier->id)
                    ->with('error', "❌ Impossible d'ajouter : la propriété Lot {$propriete->lot} est archivée (acquise).");
            }
        }
        
        return Inertia::render('DemandeursProprietes/AjouterDemandeur', [
            'dossier' => $dossier,
            'proprietes' => $dossier->proprietes,
            'id_propriete' => $id_propriete,
        ]);
    }

    /**
     * AJOUTER DEMANDEUR : Enregistrer
     */
    public function storeToProperty(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
            'mode' => 'required|in:nouveau,existant',
        ]);

        DB::beginTransaction();
        
        try {
            $id_user = Auth::id();
            $propriete = Propriete::findOrFail($request->id_propriete);
            
            // ✅ Vérification métier
            if ($propriete->is_archived) {
                DB::rollBack();
                return back()->withErrors(['error' => "❌ Impossible d'ajouter : la propriété Lot {$propriete->lot} est archivée (acquise)."]);
            }

            if ($request->mode === 'existant') {
                $request->validate(['cin' => 'required|exists:demandeurs,cin']);
                $demandeur = Demandeur::where('cin', $request->cin)->firstOrFail();
                
                $existingLink = Demander::where('id_demandeur', $demandeur->id)
                    ->where('id_propriete', $request->id_propriete)
                    ->exists();
                    
                if ($existingLink) {
                    return back()->withErrors(['cin' => 'Ce demandeur est déjà lié à cette propriété']);
                }
                
                $existeInDossier = Contenir::where('id_demandeur', $demandeur->id)
                    ->where('id_dossier', $propriete->id_dossier)
                    ->exists();
                    
                if (!$existeInDossier) {
                    Contenir::create([
                        'id_demandeur' => $demandeur->id,
                        'id_dossier' => $propriete->id_dossier,
                    ]);
                }
                
            } else {
                $request->validate([
                    'titre_demandeur' => 'required|string|max:15',
                    'nom_demandeur' => 'required|string|max:40',
                    'prenom_demandeur' => 'required|string|max:50',
                    'date_naissance' => 'required|date|before:-18 years',
                    'cin' => ['required', new ValidCIN, 'unique:demandeurs,cin']
                ]);
                
                $demandeurData = $this->convertEmptyToNull($request->only([
                    'titre_demandeur', 'nom_demandeur', 'prenom_demandeur',
                    'date_naissance', 'lieu_naissance', 'sexe', 'occupation',
                    'nom_pere', 'nom_mere', 'cin', 'date_delivrance',
                    'lieu_delivrance', 'date_delivrance_duplicata',
                    'lieu_delivrance_duplicata', 'domiciliation', 'nationalite',
                    'situation_familiale', 'regime_matrimoniale', 'date_mariage',
                    'lieu_mariage', 'marie_a', 'telephone'
                ]));
                
                $demandeur = Demandeur::create(array_merge($demandeurData, [
                    'id_user' => $id_user,
                    'nationalite' => $demandeurData['nationalite'] ?? 'Malagasy',
                    'situation_familiale' => $demandeurData['situation_familiale'] ?? 'Non spécifiée',
                    'regime_matrimoniale' => $demandeurData['regime_matrimoniale'] ?? 'Non spécifié',
                ]));
                
                Contenir::create([
                    'id_demandeur' => $demandeur->id,
                    'id_dossier' => $propriete->id_dossier,
                ]);
            }

            // Créer la liaison
            Demander::create([
                'id_demandeur' => $demandeur->id,
                'id_propriete' => $request->id_propriete,
                'id_user' => $id_user,
                'status' => Demander::STATUS_ACTIVE,
                // ordre calculé automatiquement
                // total_prix calculé par Observer
            ]);

            DB::commit();
            
            return Redirect::route('dossiers.show', $propriete->id_dossier)
                ->with('success', 'Demandeur ajouté à la propriété avec succès');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }

    /**
     * DISSOCIER
     */
    public function dissociate(Request $request)
    {
        $request->validate([
            'id_demandeur' => 'required|exists:demandeurs,id',
            'id_propriete' => 'required|exists:proprietes,id',
        ]);

        DB::beginTransaction();
        
        try {
            $propriete = Propriete::findOrFail($request->id_propriete);
            
            // ✅ Vérification métier
            if ($propriete->is_archived) {
                DB::rollBack();
                return back()->with('error', "❌ Impossible de dissocier : la propriété Lot {$propriete->lot} est archivée (acquise).");
            }
            
            $deleted = Demander::where('id_demandeur', $request->id_demandeur)
                ->where('id_propriete', $request->id_propriete)
                ->delete();

            if (!$deleted) {
                return back()->withErrors(['error' => 'Liaison introuvable']);
            }

            DB::commit();
            
            return back()->with('success', 'Demandeur dissocié avec succès');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }
 
    /**
     * ✅ HELPER : Convertir chaînes vides en null
     */
    private function convertEmptyToNull(array $data): array
    {
        return array_map(fn($v) => ($v === '' || $v === null) ? null : $v, $data);
    }
}