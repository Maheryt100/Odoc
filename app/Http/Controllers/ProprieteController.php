<?php
 
namespace App\Http\Controllers;

use App\Models\Dossier;
use App\Models\Propriete;
use App\Models\Demander;
use App\Services\DeletionValidationService;
use App\Services\ProprieteService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use App\Services\ActivityLogger;
use App\Models\ActivityLog;

class ProprieteController extends Controller
{
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
            'date_requisition' => 'nullable|date',
            'date_inscription' => 'nullable|date',
            'dep_vol' => 'nullable|string|max:50',
            'numero_dep_vol' => 'nullable|string|max:50',
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
            
            // Convertir chaînes vides en null
            $data = array_map(fn($v) => ($v === '' ? null : $v), $request->all());
            
            $propriete = Propriete::create($data);


            $dossier = Dossier::find($request->id_dossier);
            ActivityLogger::logCreation(
                ActivityLog::ENTITY_PROPRIETE,
                $propriete->id,
                [
                    'lot' => $propriete->lot,
                    'titre' => $propriete->titre,
                    'contenance' => $propriete->contenance,
                    'nature' => $propriete->nature,
                    'vocation' => $propriete->vocation,
                    'dossier_id' => $request->id_dossier,
                    'dossier_nom' => $dossier->nom_dossier,
                    'id_district' => $dossier->id_district,
                ]
            );
            
            return Redirect::route('dossiers.show', $request->id_dossier)
                ->with('success', 'Propriété ajoutée avec succès');
        } catch (\Exception $exception) {
            // Log::error('Erreur création propriété', [
            //     'error' => $exception->getMessage(),
            //     'data' => $request->all()
            // ]);
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
            'proprietes.*.titre' => 'nullable|string|max:50',
            'proprietes.*.contenance' => 'nullable|numeric',
            'proprietes.*.proprietaire' => 'nullable|string|max:100',
            'proprietes.*.propriete_mere' => 'nullable|string|max:50',
            'proprietes.*.titre_mere' => 'nullable|string|max:50',
            'proprietes.*.charge' => 'nullable|string',
            'proprietes.*.situation' => 'nullable|string',
            'proprietes.*.nature' => 'required|in:Urbaine,Suburbaine,Rurale',
            'proprietes.*.vocation' => 'required|in:Edilitaire,Agricole,Forestière,Touristique',
            'proprietes.*.numero_FN' => 'nullable|string|max:30',
            'proprietes.*.numero_requisition' => 'nullable|string|max:50',
            'proprietes.*.date_requisition' => 'nullable|date',
            'proprietes.*.date_inscription' => 'nullable|date',
            'proprietes.*.dep_vol' => 'nullable|string|max:50',
            'proprietes.*.numero_dep_vol' => 'nullable|string|max:50',
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
            $dossier = Dossier::find($validated['id_dossier']);
            
            foreach ($proprietes as $proprieteData) {
                $proprieteData = array_map(fn($v) => ($v === '' ? null : $v), $proprieteData);
                
                $proprieteData['id_user'] = Auth::id();
                $proprieteData['id_dossier'] = $validated['id_dossier'];
                
                Propriete::create($proprieteData);
                
                $createdCount++;
            }

            DB::commit();

            ActivityLogger::logCreation(
                ActivityLog::ENTITY_PROPRIETE,
                null,
                [
                    'action_type' => 'bulk_create',
                    'count' => $createdCount,
                    'dossier_id' => $validated['id_dossier'],
                    'dossier_nom' => $dossier->nom_dossier,
                    'id_district' => $dossier->id_district,
                ]
            );

            // Log::info('Propriétés multiples créées', [
            //     'count' => $createdCount,
            //     'dossier_id' => $validated['id_dossier'],
            //     'user_id' => Auth::id()
            // ]);

            return Redirect::route('dossiers.show', $validated['id_dossier'])
                ->with('success', "{$createdCount} propriété(s) créée(s) avec succès");

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Log::error('Erreur création multiple propriétés', [
            //     'error' => $e->getMessage(),
            //     'trace' => $e->getTraceAsString(),
            //     'data' => $proprietes
            // ]);

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
            'nature' => 'required|string|max:50',
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
            'date_requisition' => 'nullable|date',
            'date_inscription' => 'nullable|date',
            'dep_vol' => 'nullable|string|max:50',
            'numero_dep_vol' => 'nullable|string|max:50',
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
            $validate = array_map(fn($v) => ($v === '' ? null : $v), $validate);
            
            $existPropriete->update($validate);
            
            DB::commit();

            $dossier = Dossier::find($request->id_dossier);
            ActivityLogger::logUpdate(
                ActivityLog::ENTITY_PROPRIETE,
                $id,
                [
                    'lot' => $existPropriete->lot,
                    'titre' => $existPropriete->titre,
                    'dossier_id' => $request->id_dossier,
                    'id_district' => $dossier->id_district,
                ]
            );
            
            return Redirect::route('dossiers.show', $request->id_dossier)
                ->with('success', 'Propriété modifiée avec succès');
                
        } catch (\Exception $exception) {
            DB::rollBack();
            
            // Log::error('Erreur modification propriété', [
            //     'propriete_id' => $id,
            //     'error' => $exception->getMessage()
            // ]);
            
            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }

    /**
     * Suppression (utilise le service)
     */
    public function destroy(string $id)
    {
        try {
            $propriete = Propriete::findOrFail($id);
            $dossierId = $propriete->id_dossier;
            $districtId = $propriete->dossier->id_district;
            $proprieteData = [
                'lot' => $propriete->lot,
                'titre' => $propriete->titre,
            ];
            
            $result = $this->deletionService->deletePropriete((int)$id);

            if ($result['success']) {
                
                ActivityLogger::logDeletion(
                    ActivityLog::ENTITY_PROPRIETE,
                    $id,
                    array_merge($proprieteData, [
                        'dossier_id' => $dossierId,
                        'id_district' => $districtId,
                    ])
                );

                return Redirect::route('dossiers.show', $dossierId)
                    ->with('success', $result['message']);
            } else {
                return back()->with('error', $result['message']);
            }
            
        } catch (\Exception $e) {
            // Log::error('Erreur destroy propriété', [
            //     'propriete_id' => $id,
            //     'error' => $e->getMessage()
            // ]);
            
            return back()->with('error', 'Erreur : ' . $e->getMessage());
        }
    }

    /**
     * Archiver (utilise le service)
     */
     public function archive(Request $request)
    {
        $propriete = Propriete::find($request->id);
        
        $result = $this->proprieteService->archivePropriete($request->id);
        
        if ($result['success']) {
            ActivityLogger::logArchive(
                ActivityLog::ENTITY_PROPRIETE,
                $request->id,
                [
                    'lot' => $propriete->lot,
                    'titre' => $propriete->titre,
                    'id_district' => $propriete->dossier->id_district,
                ]
            );
        }
        
        return $result['success']
            ? back()->with('success', $result['message'])
            : back()->withErrors(['error' => $result['message']]);
    }

    /**
     * Désarchiver (utilise le service)
     */
    public function unarchive(Request $request)
    {
        $propriete = Propriete::find($request->id);

        $result = $this->proprieteService->unarchivePropriete($request->id);

        if ($result['success']) {
            ActivityLogger::logUnarchive(
                ActivityLog::ENTITY_PROPRIETE,
                $request->id,
                [
                    'lot' => $propriete->lot,
                    'titre' => $propriete->titre,
                    'id_district' => $propriete->dossier->id_district,
                ]
            );
        }

        return $result['success']
            ? back()->with('success', $result['message'])
            : back()->withErrors(['error' => $result['message']]);
    }
}