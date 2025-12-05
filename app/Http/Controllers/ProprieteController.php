<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\Demander;
use App\Services\DeletionValidationService; // ✅ NOUVEAU
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use App\Services\PrixCalculatorService;
use App\Services\ProprieteService;

class ProprieteController extends Controller
{
    // ✅ INJECTION DU SERVICE
    protected $deletionService;
    protected $proprieteService;


    public function __construct(
        DeletionValidationService $deletionService,
        ProprieteService $proprieteService
    ) {
        $this->deletionService = $deletionService;
        $this->proprieteService = $proprieteService;
    }


    public function index(Request $request, $id_dossier)
    {
        $dossier = Dossier::findOrFail($id_dossier);
        $query = Propriete::where('id_dossier', $dossier->id);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('lot', 'ilike', "%{$search}%")
                    ->orWhere('titre', 'ilike', "%{$search}%")
                    ->orWhere('nature', 'ilike', "%{$search}%")
                    ->orWhere('proprietaire', 'ilike', "%{$search}%");
            });
        }

        $proprietes = $query->paginate(20);

        return Inertia::render('proprietes/index', [
            'dossier' => $dossier,
            'proprietes' => $proprietes,
        ]);
    }

    public function create($id)
    {
        $dossier = Dossier::findOrFail($id);
        return Inertia::render('proprietes/create', [
           'dossier' => $dossier,
        ]);
    }

    public function store(Request $request)
    {
        if (is_array($request->charge)) {
            $request->merge([
                'charge' => implode(', ', $request->charge),
            ]);
        }

        $validate = $request->validate([
            'lot' => 'required|string|max:15',
            'type_operation' => 'required|in:morcellement,immatriculation',
            'nature' => 'required|in:Urbaine,Suburbaine,Rurale',
            'vocation' => 'required|in:Edilitaire,Agricole,Forestière,Touristique',
            'proprietaire' => 'nullable|string|max:50',
            'situation' => 'nullable|string',
            'propriete_mere' => 'nullable|string|max:20',
            'titre_mere' => 'nullable|string|max:20',
            'titre' => 'nullable|string|max:20',
            'contenance' => 'nullable|numeric|min:1',
            'charge' => 'nullable|string|max:255',
            'numero_FN' => 'nullable|string|max:10',
            'numero_requisition' => 'nullable|string|max:30',
            'id_dossier' => 'required|numeric|exists:dossiers,id',
            'date_requisition' => 'nullable|date',
            'date_inscription' => 'nullable|date',
            'dep_vol' => 'nullable|string',
            'numero_dep_vol' => 'nullable|string',
        ],[
            'lot.required' => 'Le lot est obligatoire',
            'type_operation.required' => 'Le type d\'opération est obligatoire',
            'nature.required' => 'La nature est obligatoire',
            'nature.in' => 'La nature doit être: Urbaine, Suburbaine ou Rurale',
            'vocation.required' => 'La vocation est obligatoire',
            'vocation.in' => 'La vocation doit être: Edilitaire, Agricole, Forestière ou Touristique',
            'contenance.min' => 'La contenance est invalide'
        ]);
        
        try {
            $request->merge(['id_user' => Auth::id()]);
            Propriete::create($request->all());
            
            return Redirect::route('dossiers.show', $request->id_dossier)
                ->with('success', 'Propriété ajoutée avec succès');
        } catch (\Exception $exception) {
            Log::error('Erreur création propriété', [
                'error' => $exception->getMessage(),
                'data' => $request->all()
            ]);
            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }

    public function storeMultiple(Request $request)
    {
        $proprietes = is_string($request->proprietes) 
            ? json_decode($request->proprietes, true) 
            : $request->proprietes;

        $validated = $request->validate([
            'id_dossier' => 'required|exists:dossiers,id',
        ]);

        $validator = Validator::make(['proprietes' => $proprietes], [
            'proprietes' => 'required|array|min:1',
            'proprietes.*.lot' => 'required|string|max:15',
            'proprietes.*.titre' => 'nullable|string|max:30',
            'proprietes.*.contenance' => 'nullable|numeric',
            'proprietes.*.proprietaire' => 'nullable|string|max:100',
            'proprietes.*.propriete_mere' => 'nullable|string|max:15',
            'proprietes.*.titre_mere' => 'nullable|string|max:30',
            'proprietes.*.charge' => 'nullable|string',
            'proprietes.*.situation' => 'nullable|string',
            'proprietes.*.nature' => 'required|in:Urbaine,Suburbaine,Rurale',
            'proprietes.*.vocation' => 'required|in:Edilitaire,Agricole,Forestière,Touristique',
            'proprietes.*.numero_FN' => 'nullable|string|max:30',
            'proprietes.*.numero_requisition' => 'nullable|string|max:30',
            'proprietes.*.date_requisition' => 'nullable|date',
            'proprietes.*.date_inscription' => 'nullable|date',
            'proprietes.*.dep_vol' => 'nullable|string|max:30',
            'proprietes.*.numero_dep_vol' => 'nullable|string|max:30',
            'proprietes.*.type_operation' => 'required|in:morcellement,immatriculation',
        ], [
            'proprietes.*.lot.required' => 'Le numéro de lot est obligatoire (propriété :position).',
            'proprietes.*.nature.required' => 'La nature est obligatoire (propriété :position).',
            'proprietes.*.vocation.required' => 'La vocation est obligatoire (propriété :position).',
            'proprietes.*.type_operation.required' => 'Le type d\'opération est obligatoire (propriété :position).',
        ]);

        if ($validator->fails()) {
            Log::warning('Validation échouée pour propriétés multiples', [
                'errors' => $validator->errors()->toArray(),
                'data' => $proprietes
            ]);
            return back()->withErrors($validator->errors());
        }

        DB::beginTransaction();

        try {
            $createdCount = 0;
            
            foreach ($proprietes as $proprieteData) {
                foreach ($proprieteData as $key => $value) {
                    if ($value === '') {
                        $proprieteData[$key] = null;
                    }
                }
                
                $proprieteData['id_user'] = Auth::id();
                $proprieteData['id_dossier'] = $validated['id_dossier'];
                
                Propriete::create($proprieteData);
                
                $createdCount++;
            }

            DB::commit();

            Log::info('Propriétés multiples créées', [
                'count' => $createdCount,
                'dossier_id' => $validated['id_dossier'],
                'user_id' => Auth::id()
            ]);

            return Redirect::route('dossiers.show', $validated['id_dossier'])
                ->with('success', "{$createdCount} propriété(s) créée(s) avec succès");

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Erreur création multiple propriétés', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'data' => $proprietes
            ]);

            return back()->withErrors(['error' => 'Erreur lors de la création: ' . $e->getMessage()]);
        }
    }

    public function show($id)
    {
        $propriete = Propriete::with(['piecesJointes' => function($q) {
            $q->orderBy('created_at', 'desc');
        }])->findOrFail($id);
        
        return Inertia::render('proprietes/read', [
            'propriete' => $propriete,
        ]);
    }

    public function edit(string $id)
    {
        $propriete = Propriete::findOrFail($id);
        $dossier = Dossier::findOrFail($propriete->id_dossier);
        
        // ✅ Vérifier si peut être modifiée
        if (!$propriete->canBeModified()) {
            return Redirect::route('dossiers.show', $dossier->id)
                ->with('error', 'Impossible de modifier cette propriété : elle est acquise (toutes les demandes sont archivées).');
        }
        
        return Inertia::render('proprietes/update', [
            'propriete' => $propriete,
            'dossier' => $dossier,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $existPropriete = Propriete::find($id);

        if (!$existPropriete) {
            return back()->with('error', 'Propriété introuvable');
        }
        
        // ✅ Vérifier si peut être modifiée
        if (!$existPropriete->canBeModified()) {
            return back()->with('error', 'Impossible de modifier cette propriété : elle est acquise.');
        }
        
        if (is_array($request->charge)) {
            $request->merge([
                'charge' => implode(', ', $request->charge),
            ]);
        }

        $validate = $request->validate([
            'lot' => 'required|string|max:15',
            'type_operation' => 'required|in:morcellement,immatriculation',
            'nature' => 'required|string|max:40',
            'vocation' => 'required|in:Edilitaire,Agricole,Forestière,Touristique',
            'proprietaire' => 'nullable|string|max:50',
            'situation' => 'nullable|string',
            'propriete_mere' => 'nullable|string|max:20',
            'titre_mere' => 'nullable|string|max:20',
            'titre' => 'nullable|string|max:20',
            'contenance' => 'nullable|numeric|min:1',
            'charge' => 'nullable|string|max:255',
            'numero_FN' => 'nullable|string|max:10',
            'numero_requisition' => 'nullable|string|max:30',
            'date_requisition' => 'nullable|date',
            'date_inscription' => 'nullable|date',
            'dep_vol' => 'nullable|string',
            'numero_dep_vol' => 'nullable|string',
            'id_dossier' => 'required|numeric|exists:dossiers,id',
        ], [
            'lot.required' => 'Le lot est obligatoire',
            'type_operation.required' => 'Le type d\'opération est obligatoire',
            'nature.required' => 'La nature est obligatoire',
            'vocation.required' => 'La vocation est obligatoire',
            'vocation.in' => 'La vocation doit être: Edilitaire, Agricole, Forestière ou Touristique',
        ]);
        
        DB::beginTransaction();
        
        try {
            // ✅ SIMPLIFICATION : L'Observer gère automatiquement le recalcul
            // Pas besoin de vérifier contenanceChanged ou vocationChanged
            $existPropriete->update($validate);
            
            DB::commit();
            
            return Redirect::route('dossiers.show', $request->id_dossier)
                ->with('success', 'Propriété modifiée avec succès');
                
        } catch (\Exception $exception) {
            DB::rollBack();
            
            Log::error('Erreur modification propriété', [
                'propriete_id' => $id,
                'error' => $exception->getMessage()
            ]);
            
            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }

    /**
     * ✅ SIMPLIFIÉ : Suppression (utilise le service)
     */
    public function destroy(string $id)
    {
        try {
            $propriete = Propriete::findOrFail($id);
            $dossierId = $propriete->id_dossier;
            
            $result = $this->deletionService->deletePropriete((int)$id);

            if ($result['success']) {
                return Redirect::route('dossiers.show', $dossierId)
                    ->with('success', $result['message']);
            } else {
                return back()->with('error', $result['message']);
            }
            
        } catch (\Exception $e) {
            Log::error('❌ Erreur destroy propriété', [
                'propriete_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return back()->with('error', 'Erreur : ' . $e->getMessage());
        }
    }

    // Simplifier les méthodes :
    public function archive(Request $request)
    {
        $request->validate(['id' => 'required|exists:proprietes,id']);
        
        $result = $this->proprieteService->archivePropriete($request->id);
        
        return $result['success']
            ? back()->with('success', $result['message'])
            : back()->withErrors(['error' => $result['message']]);
    }

    /**
     * ✅ DÉSARCHIVER : Réactiver TOUTES les demandes ENSEMBLE
     */
    public function unarchive(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:proprietes,id',
        ]);

        $result = $this->proprieteService->unarchivePropriete($request->id);

        return $result['success']
            ? back()->with('success', $result['message'])
            : back()->withErrors(['error' => $result['message']]);
    }

}