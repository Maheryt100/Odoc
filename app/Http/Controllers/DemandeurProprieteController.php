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
use Inertia\Inertia;
use App\Rules\ValidCIN;
use App\Http\Requests\StoreDemandeurRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class DemandeurProprieteController extends Controller
{
    /**
     * NOUVEAU LOT : Afficher le formulaire
     */
    public function create($id)
    {
        $dossier = Dossier::findOrFail($id);
        
        return Inertia::render('DemandeursProprietes/NouveauLot', [
            'dossier' => $dossier,
        ]);
    }

    /**
     * ✅ CORRECTION CRITIQUE : Validation et décodage corrigés
     */
    public function store(Request $request)
    {
        // ✅ ÉTAPE 1 : Validation AVANT décodage JSON
        $validated = $request->validate([
            // Propriété
            'lot' => 'required|string|max:15',
            'type_operation' => 'required|in:morcellement,immatriculation',
            'nature' => 'required|in:Urbaine,Suburbaine,Rurale',
            'vocation' => 'required|in:Edilitaire,Agricole,Forestière,Touristique',
            'proprietaire' => 'nullable|string|max:100',
            'situation' => 'nullable|string',
            'propriete_mere' => 'nullable|string|max:50',
            'titre_mere' => 'nullable|string|max:50',
            'titre' => 'nullable|string|max:50',
            'contenance' => 'nullable|numeric|min:1',
            'charge' => 'nullable|string|max:255',
            'numero_FN' => 'nullable|string|max:30',
            'numero_requisition' => 'nullable|string|max:50',
            'id_dossier' => 'required|numeric|exists:dossiers,id',
            
            // Dates
            'date_requisition' => 'nullable|date',
            'date_depot_1' => 'nullable|date',
            'date_depot_2' => 'nullable|date',
            'date_approbation_acte' => 'nullable|date|after_or_equal:date_requisition',
            'date_demande' => 'nullable|date|before_or_equal:today|after_or_equal:2020-01-01',
            
            // Dep/Vol
            'dep_vol_inscription' => 'nullable|string|max:50',
            'numero_dep_vol_inscription' => 'nullable|string|max:50',
            'dep_vol_requisition' => 'nullable|string|max:50',
            'numero_dep_vol_requisition' => 'nullable|string|max:50',
            
            // ✅ CORRECTION : demandeurs_json au lieu de demandeurs
            'demandeurs_json' => 'required|string',
        ], [
            'lot.required' => 'Le lot est obligatoire',
            'demandeurs_json.required' => 'Au moins un demandeur est requis',
        ]);
        
        DB::beginTransaction();
        
        try {
            $id_user = Auth::id();
            
            // ✅ ÉTAPE 2 : Décoder les demandeurs APRÈS validation
            $demandeurs = json_decode($validated['demandeurs_json'], true);
            
            // ✅ ÉTAPE 3 : Validation des demandeurs décodés
            if (!is_array($demandeurs) || empty($demandeurs)) {
                throw new \Exception('Format de demandeurs invalide');
            }
            
            Log::info('📦 Demandeurs décodés', [
                'count' => count($demandeurs),
                'cins' => array_column($demandeurs, 'cin')
            ]);
            
            // ✅ ÉTAPE 4 : Vérifier les CIN en amont pour éviter les doublons
            $existingDemandeurs = [];
            foreach ($demandeurs as $demandeurData) {
                $cin = $demandeurData['cin'] ?? null;
                if ($cin) {
                    // ✅ RECHERCHE GLOBALE sans filtre district
                    $existing = Demandeur::withoutGlobalScopes()
                        ->where('cin', $cin)
                        ->first();
                    
                    if ($existing) {
                        $existingDemandeurs[$cin] = $existing;
                        Log::info('♻️ Demandeur existant détecté', [
                            'cin' => $cin,
                            'id' => $existing->id,
                            'nom' => $existing->nom_complet
                        ]);
                    }
                }
            }
            
            // 1. Créer la propriété
            $proprieteData = array_merge(
                $request->only([
                    'lot', 'propriete_mere', 'titre_mere', 'titre', 'proprietaire',
                    'contenance', 'charge', 'situation', 'nature', 'vocation',
                    'numero_FN', 'numero_requisition', 'date_requisition',
                    'date_depot_1', 'date_depot_2', 'date_approbation_acte', 
                    'dep_vol_inscription', 'numero_dep_vol_inscription',
                    'dep_vol_requisition', 'numero_dep_vol_requisition',
                    'type_operation'
                ]),
                [
                    'id_dossier' => $validated['id_dossier'],
                    'id_user' => $id_user,
                ]
            );

            $proprieteData = $this->convertEmptyToNull($proprieteData);
            $propriete = Propriete::create($proprieteData);
            
            Log::info('✅ Propriété créée', ['id' => $propriete->id, 'lot' => $propriete->lot]);

            // ✅ Préparer date_demande
            $dateDemande = isset($validated['date_demande']) 
                ? Carbon::parse($validated['date_demande']) 
                : Carbon::today();

            // ✅ VALIDATION : date_demande >= date_requisition
            if ($propriete->date_requisition && $dateDemande->lessThan($propriete->date_requisition)) {
                DB::rollBack();
                return back()->withErrors([
                    'date_demande' => "La date de demande ({$dateDemande->format('d/m/Y')}) ne peut pas être antérieure à la date de réquisition ({$propriete->date_requisition->format('d/m/Y')})."
                ]);
            }

            // 3. Traiter les demandeurs
            $demandeursTraites = [];
            
            foreach ($demandeurs as $index => $demandeurData) {
                $cleanData = $this->convertEmptyToNull($demandeurData);
                $cin = $cleanData['cin'];
                
                Log::info("🔍 Traitement demandeur #{$index}", [
                    'cin' => $cin,
                    'nom' => $cleanData['nom_demandeur'] ?? 'N/A'
                ]);

                // ✅ CORRECTION MAJEURE : Utiliser la détection globale
                if (isset($existingDemandeurs[$cin])) {
                    // ✅ MISE À JOUR du demandeur existant
                    $demandeur = $existingDemandeurs[$cin];
                    
                    // ✅ Mettre à jour UNIQUEMENT les champs non-null
                    $updateData = array_filter($cleanData, fn($v) => $v !== null);
                    $demandeur->update($updateData);
                    
                    Log::info('♻️ Demandeur existant mis à jour', [
                        'id' => $demandeur->id,
                        'cin' => $cin,
                        'champs_mis_a_jour' => count($updateData)
                    ]);
                } else {
                    // ✅ CRÉATION d'un nouveau demandeur
                    $demandeur = Demandeur::create(array_merge($cleanData, [
                        'id_user' => $id_user,
                        'nationalite' => $cleanData['nationalite'] ?? 'Malagasy',
                        'situation_familiale' => $cleanData['situation_familiale'] ?? 'Non spécifiée',
                        'regime_matrimoniale' => $cleanData['regime_matrimoniale'] ?? 'Non spécifié',
                    ]));
                    
                    Log::info('✨ Nouveau demandeur créé', [
                        'id' => $demandeur->id,
                        'cin' => $cin
                    ]);
                }

                // 4. Ajouter au dossier si pas déjà présent
                Contenir::firstOrCreate([
                    'id_demandeur' => $demandeur->id,
                    'id_dossier' => $validated['id_dossier'],
                ]);

                // ✅ 5. Créer la liaison AVEC date_demande
                $liaisonExistante = Demander::where('id_demandeur', $demandeur->id)
                    ->where('id_propriete', $propriete->id)
                    ->exists();
                
                if (!$liaisonExistante) {
                    $demande = Demander::create([
                        'id_demandeur' => $demandeur->id,
                        'id_propriete' => $propriete->id,
                        'date_demande' => $dateDemande,
                        'id_user' => $id_user,
                        'status' => Demander::STATUS_ACTIVE,
                        'status_consort' => count($demandeurs) > 1,
                        // ordre calculé par boot()
                        // total_prix calculé par Observer
                    ]);
                    
                    Log::info('🔗 Demande créée', [
                        'id' => $demande->id,
                        'ordre' => $demande->ordre,
                        'date_demande' => $dateDemande->format('Y-m-d')
                    ]);
                } else {
                    Log::warning('⚠️ Liaison déjà existante (skipped)', [
                        'demandeur_id' => $demandeur->id,
                        'propriete_id' => $propriete->id
                    ]);
                }
                
                $demandeursTraites[] = $demandeur->nom_demandeur;
            }

            DB::commit();
            
            $message = count($demandeurs) > 1 
                ? count($demandeurs) . ' demandeurs liés à la propriété avec succès'
                : 'Demandeur et propriété créés avec succès';
            
            Log::info('✅ SUCCÈS TOTAL', [
                'propriete_id' => $propriete->id,
                'demandeurs_count' => count($demandeursTraites),
                'demandeurs' => $demandeursTraites,
                'existants_mis_a_jour' => count($existingDemandeurs),
                'nouveaux_crees' => count($demandeurs) - count($existingDemandeurs)
            ]);
            
            return Redirect::route('dossiers.show', $validated['id_dossier'])
                ->with('success', $message);
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('❌ Erreur store nouveau lot', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
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
     * ✅ LIER EXISTANT : Enregistrer (avec date_demande)
     */
    public function storeLink(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
            'mode' => 'required|in:existant,nouveau',
            'date_demande' => 'nullable|date|before_or_equal:today|after_or_equal:2020-01-01',
        ]);

        DB::beginTransaction();
        
        try {
            $id_user = Auth::id();
            $propriete = Propriete::findOrFail($request->id_propriete);
            
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

            // ✅ Préparer date_demande
            $dateDemande = $request->filled('date_demande') 
                ? Carbon::parse($request->date_demande) 
                : Carbon::today();

            // ✅ VALIDATION
            if ($propriete->date_requisition && $dateDemande->lessThan($propriete->date_requisition)) {
                DB::rollBack();
                return back()->withErrors([
                    'date_demande' => "La date de demande ne peut pas être antérieure à la date de réquisition."
                ]);
            }

            // ✅ Créer la liaison AVEC date_demande
            Demander::create([
                'id_demandeur' => $id_demandeur,
                'id_propriete' => $request->id_propriete,
                'date_demande' => $dateDemande,
                'id_user' => $id_user,
                'status' => Demander::STATUS_ACTIVE,
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
     * ✅ AJOUTER DEMANDEUR : Enregistrer (avec date_demande)
     */
    public function storeToProperty(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
            'mode' => 'required|in:nouveau,existant',
            'date_demande' => 'nullable|date|before_or_equal:today|after_or_equal:2020-01-01',
        ]);

        DB::beginTransaction();
        
        try {
            $id_user = Auth::id();
            $propriete = Propriete::findOrFail($request->id_propriete);
            
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

            // ✅ Préparer date_demande
            $dateDemande = $request->filled('date_demande') 
                ? Carbon::parse($request->date_demande) 
                : Carbon::today();

            // ✅ VALIDATION
            if ($propriete->date_requisition && $dateDemande->lessThan($propriete->date_requisition)) {
                DB::rollBack();
                return back()->withErrors([
                    'date_demande' => "La date de demande ne peut pas être antérieure à la date de réquisition."
                ]);
            }

            // ✅ Créer la liaison AVEC date_demande
            Demander::create([
                'id_demandeur' => $demandeur->id,
                'id_propriete' => $request->id_propriete,
                'date_demande' => $dateDemande, 
                'id_user' => $id_user,
                'status' => Demander::STATUS_ACTIVE,
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
     * Convertir chaînes vides en null
     */
    private function convertEmptyToNull(array $data): array
    {
        return array_map(fn($v) => ($v === '' || $v === null) ? null : $v, $data);
    }
}