<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use App\Models\Propriete;
use App\Services\DeletionValidationService;
use App\Services\ProprieteService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
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

    private function getValidationRules(): array
    {
        return [
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
            'date_depot_1' => 'nullable|date',
            'date_depot_2' => 'nullable|date',
            'date_approbation_acte' => [
                'nullable',
                'date',
                'after_or_equal:date_requisition', 
            ],

            'dep_vol_inscription' => 'nullable|string|max:50',
            'numero_dep_vol_inscription' => 'nullable|string|max:50',
            'dep_vol_requisition' => 'nullable|string|max:50',
            'numero_dep_vol_requisition' => 'nullable|string|max:50',
        ];
    }

    private function getValidationMessages(): array
    {
        return [
            'lot.required' => 'Le lot est obligatoire',
            'type_operation.required' => 'Le type d\'opération est obligatoire',
            'nature.required' => 'La nature est obligatoire',
            'nature.in' => 'La nature doit être: Urbaine, Suburbaine ou Rurale',
            'vocation.required' => 'La vocation est obligatoire',
            'vocation.in' => 'La vocation doit être: Edilitaire, Agricole, Forestière ou Touristique',
            'contenance.min' => 'La contenance est invalide',
    
            'date_approbation_acte.after_or_equal' => 'La date d\'approbation doit être postérieure ou égale à la date de réquisition',
        ];
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
                    ->orWhere('proprietaire', 'ilike', "%{$search}%")
                    ->orWhere('dep_vol_inscription', 'ilike', "%{$search}%")
                    ->orWhere('numero_dep_vol_inscription', 'ilike', "%{$search}%")
                    ->orWhere('dep_vol_requisition', 'ilike', "%{$search}%")
                    ->orWhere('numero_dep_vol_requisition', 'ilike', "%{$search}%");
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

        $validate = $request->validate(
            $this->getValidationRules(),
            $this->getValidationMessages()
        );
        
        try {
            $request->merge(['id_user' => Auth::id()]);
            
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

        $rules = $this->getValidationRules();
        $messages = $this->getValidationMessages();
        
        $validator = Validator::make(['proprietes' => $proprietes], [
            'proprietes' => 'required|array|min:1',
            ...array_combine(
                array_map(fn($key) => "proprietes.*.{$key}", array_keys($rules)),
                array_values($rules)
            )
        ], $messages);

        if ($validator->fails()) {
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

            return Redirect::route('dossiers.show', $validated['id_dossier'])
                ->with('success', "{$createdCount} propriété(s) créée(s) avec succès");

        } catch (\Exception $e) {
            DB::rollBack();
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

        $validate = $request->validate(
            $this->getValidationRules(),
            $this->getValidationMessages()
        );
        
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
            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }

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
            return back()->with('error', 'Erreur : ' . $e->getMessage());
        }
    }

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