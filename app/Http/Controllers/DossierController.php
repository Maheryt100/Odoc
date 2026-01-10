<?php

namespace App\Http\Controllers;

use App\Models\Dossier;
use App\Models\District;
use App\Traits\ManagesDistrictAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Models\ActivityLog;

class DossierController extends Controller
{
    use ManagesDistrictAccess;

    public function __construct()
    {
        $this->middleware(['auth', 'district.access']);
        $this->middleware('district.access:create')->only(['create', 'store']);
        $this->middleware('district.access:update')->only(['edit', 'update']);
        $this->middleware('district.access:delete')->only(['destroy']);
        $this->middleware('check.dossier.closed:modify')->only(['update', 'destroy']);
    }

    public function index(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();

        $query = Dossier::withCount(['demandeurs', 'proprietes'])
            ->with(['closedBy:id,name']);

        $query = $this->applyDistrictFilter($query);

        if ($request->filled('status')) {
            if ($request->status === 'open') {
                $query->whereNull('date_fermeture');
            } elseif ($request->status === 'closed') {
                $query->whereNotNull('date_fermeture');
            }
        }

        $dossiers = $query->orderBy('date_descente_debut', 'desc')->get();
        
        return Inertia::render('dossiers/index', [
            'dossiers' => $dossiers->map(function($dossier) use ($user) {
                return array_merge($dossier->toArray(), [
                    'can_close' => $this->canCloseDossier($dossier, $user),
                    'can_modify' => $this->canModifyDossier($dossier, $user),
                ]);
            }),
            'districtInfo' => [
                'nom' => $this->getUserDistrictName($user),
                'can_see_all' => $user->canAccessAllDistricts(),
            ],
            'userRole' => $user->role_name,
            'stats' => $this->getDistrictStatsLocal(),
            'filters' => [
                'status' => $request->get('status'),
            ],
        ]);
    }
    
    public function create()
    {
        $this->authorizeDistrictAccess('create');
        
        /** @var User $user */
        $user = Auth::user();
        
        $districts = $this->getAvailableDistricts($user);

 
        $suggestedNumero = Dossier::getNextNumeroOuverture();
        $lastNumero = Dossier::getLastNumeroOuverture();

        return Inertia::render('dossiers/create', [
            'districts' => $districts,
            'defaultDistrict' => $user->id_district,
            'canSelectDistrict' => $user->canAccessAllDistricts(),
            'suggested_numero' => $suggestedNumero,
            'last_numero' => $lastNumero, 
        ]);
    }


    public function store(Request $request)
    {
        $this->authorizeDistrictAccess('create');
        
        /** @var User $user */
        $user = Auth::user();

        $validated = $request->validate([
            'nom_dossier' => 'required|string|max:100',
            'type_commune' => 'required|string|in:Commune Urbaine,Commune Rurale',
            'commune' => 'required|string|max:70',
            'fokontany' => 'required|string|max:70',
            'circonscription' => 'required|string|max:50',
            'date_descente_debut' => 'required|date',
            'date_descente_fin' => 'required|date|after_or_equal:date_descente_debut',
            'date_ouverture' => 'required|date',
            'date_sensibilisation' => 'nullable|date',
            'id_district' => 'required|numeric|exists:districts,id',
            'numero_ouverture' => 'required|integer|min:1',
        ]);
        
        try {
            if (Dossier::numeroOuvertureExists($validated['numero_ouverture'])) {
                $existingDossier = Dossier::withoutGlobalScopes()
                    ->where('numero_ouverture', $validated['numero_ouverture'])
                    ->with('district:id,nom_district')
                    ->first();
                    
                $districtInfo = $existingDossier?->district 
                    ? " (District : {$existingDossier->district->nom_district})" 
                    : '';
                    
                return back()
                    ->withInput()
                    ->withErrors([
                        'numero_ouverture' => "Le numéro d'ouverture {$validated['numero_ouverture']} est déjà utilisé par le dossier \"{$existingDossier?->nom_dossier}\"{$districtInfo}. Veuillez en choisir un autre."
                    ]);
            }
            
            if (!$user->canAccessAllDistricts() && $validated['id_district'] != $user->id_district) {
                return back()->withErrors([
                    'error' => 'Vous ne pouvez créer des dossiers que dans votre district.'
                ]);
            }

            if (!isset($validated['date_ouverture'])) {
                $validated['date_ouverture'] = $validated['date_descente_debut'];
            }

            $validated['id_user'] = $user->id;
            
            DB::beginTransaction();
            
            $dossier = Dossier::create($validated);

            ActivityLogger::logCreation(
                ActivityLog::ENTITY_DOSSIER,
                $dossier->id,
                [
                    'nom_dossier' => $dossier->nom_dossier,
                    'numero_ouverture' => $dossier->numero_ouverture,
                    'commune' => $dossier->commune,
                    'circonscription' => $dossier->circonscription,
                    'id_district' => $dossier->id_district,
                ]
            );
            
            DB::commit();
            
            // Redirection vers la liste des dossiers
            return Redirect::route('dossiers')
                ->with('success');
                
        } catch (\Exception $exception) {
            DB::rollBack();

            return back()->withErrors(['error' => $exception->getMessage()]);
        }
    }

    public function show($id)
    {
        $dossier = Dossier::with([
            'demandeurs' => function($q) {
                $q->select('demandeurs.*')
                  ->withCount([
                      'demandes as proprietes_actives_count' => fn($query) => 
                          $query->where('status', 'active'),
                      'demandes as proprietes_acquises_count' => fn($query) => 
                          $query->where('status', 'archive')
                  ]);
            },
            
            'proprietes' => function($q) {
                $q->with([
                    'demandes' => function($query) {
                        $query->whereIn('status', ['active', 'archive'])
                            ->orderBy('status', 'asc')
                            ->orderBy('ordre', 'asc')
                            ->with('demandeur:id,titre_demandeur,nom_demandeur,prenom_demandeur,cin');
                    }
                ])
                ->orderBy('lot');
            },
            
            'district:id,nom_district,edilitaire,agricole,forestiere,touristique',
            'user:id,name,email',
            'closedBy:id,name'
        ])
        ->withCount('piecesJointes')
        ->findOrFail($id);

        /** @var User $user */
        $user = Auth::user();
        $permissions = [
            'canEdit' => $dossier->canBeModifiedBy($user) && $user->canUpdate(),
            'canDelete' => $user->canDelete() 
                && ($user->isAdminDistrict() && $user->id_district === $dossier->id_district),
            'canClose' => $user->canCloseDossier() 
                && $user->isAdminDistrict() 
                && $user->id_district === $dossier->id_district,
            'canArchive' => false, 
            'canExport' => true, 
            'canGenerateDocuments' => !$dossier->is_closed 
                && $user->canGenerateDocuments()
        ];

        $enrichedDemandeurs = $dossier->demandeurs->map(function($demandeur) {
            $attrs = $demandeur->toArray();
            
            $attrs['hasProperty'] = ($attrs['proprietes_actives_count'] ?? 0) > 0
                                || ($attrs['proprietes_acquises_count'] ?? 0) > 0;
            
            return $attrs;
        });

        return Inertia::render('dossiers/Show', [
            'dossier' => [
                'id' => $dossier->id,
                'nom_dossier' => $dossier->nom_dossier,
                'numero_ouverture' => $dossier->numero_ouverture,
                'numero_ouverture_display' => $dossier->numero_ouverture_display,
                'type_commune' => $dossier->type_commune,
                'commune' => $dossier->commune,
                'fokontany' => $dossier->fokontany,
                'circonscription' => $dossier->circonscription,
                'date_descente_debut' => $dossier->date_descente_debut,
                'date_descente_fin' => $dossier->date_descente_fin,
                'date_ouverture' => $dossier->date_ouverture,
                'date_sensibilisation' => $dossier->date_sensibilisation,
                'date_fermeture' => $dossier->date_fermeture,
                'closed_by' => $dossier->closed_by,
                'motif_fermeture' => $dossier->motif_fermeture,
                'id_district' => $dossier->id_district,
                'id_user' => $dossier->id_user,
                'is_closed' => $dossier->is_closed,
                'is_open' => $dossier->is_open,
                'status_label' => $dossier->status_label,
                'demandeurs_count' => $dossier->demandeurs_count,
                'proprietes_count' => $dossier->proprietes_count,
                'pieces_jointes_count' => $dossier->pieces_jointes_count,
                
                'demandeurs' => $enrichedDemandeurs,
                'proprietes' => $dossier->proprietes,
                'district' => $dossier->district,
                'user' => $dossier->user,
                'closedBy' => $dossier->closedBy,
                
                'created_at' => $dossier->created_at,
                'updated_at' => $dossier->updated_at,
            ],
            'permissions' => $permissions,
        ]);
    }

    public function edit($id)
    {
        $this->authorizeDistrictAccess('update');
        
        /** @var User $user */
        $user = Auth::user();
        $dossier = Dossier::findOrFail($id);
        
        if (!$this->canModifyDossier($dossier, $user)) {
            return back()->withErrors([
                'error' => 'Ce dossier est fermé et ne peut pas être modifié.'
            ]);
        }
        
        $this->authorizeDistrictAccess('update', $dossier);
        
        $districts = $this->getAvailableDistricts($user);
        
        $dossierData = $dossier->toArray();
        
        if (isset($dossierData['date_descente_debut'])) {
            $dossierData['date_descente_debut'] = \Carbon\Carbon::parse($dossierData['date_descente_debut'])->format('Y-m-d');
        }
        if (isset($dossierData['date_descente_fin'])) {
            $dossierData['date_descente_fin'] = \Carbon\Carbon::parse($dossierData['date_descente_fin'])->format('Y-m-d');
        }
        if (isset($dossierData['date_ouverture'])) {
            $dossierData['date_ouverture'] = \Carbon\Carbon::parse($dossierData['date_ouverture'])->format('Y-m-d');
        }
        
        return Inertia::render('dossiers/update', [
            'dossier' => $dossierData,
            'districts' => $districts,
            'canChangeDistrict' => $user->canAccessAllDistricts(),
        ]);
    }

    public function update(Request $request, $id)
    {
        $this->authorizeDistrictAccess('update');
        
        /** @var User $user */
        $user = Auth::user();
        $dossier = Dossier::findOrFail($id);
        
        if (!$this->canModifyDossier($dossier, $user)) {
            return back()->withErrors([
                'error' => 'Ce dossier est fermé et ne peut pas être modifié.'
            ]);
        }
        
        $this->authorizeDistrictAccess('update', $dossier);

        $validated = $request->validate([
            'nom_dossier' => 'required|string|max:255',
            'type_commune' => 'required|string|in:Commune Urbaine,Commune Rurale',
            'commune' => 'required|string|max:255',
            'fokontany' => 'required|string|max:255',
            'date_descente_debut' => 'required|date',
            'date_descente_fin' => 'required|date|after_or_equal:date_descente_debut',
            'date_ouverture' => 'required|date', 
            'date_sensibilisation' => 'nullable|date',
            'circonscription' => 'required|string|max:255',
            'id_district' => 'required|exists:districts,id',
            'numero_ouverture' => 'required|integer|min:1',
        ]);
        
        if (Dossier::numeroOuvertureExists($validated['numero_ouverture'], $id)) {
            $existingDossier = Dossier::withoutGlobalScopes()
                ->where('numero_ouverture', $validated['numero_ouverture'])
                ->where('id', '!=', $id)
                ->with('district:id,nom_district')
                ->first();
                
            $districtInfo = $existingDossier?->district 
                ? " (District : {$existingDossier->district->nom_district})" 
                : '';
                
            return back()
                ->withInput()
                ->withErrors([
                    'numero_ouverture' => "Le numéro d'ouverture {$validated['numero_ouverture']} est déjà utilisé par le dossier \"{$existingDossier?->nom_dossier}\"{$districtInfo}."
                ]);
        }

        if (!$user->canAccessAllDistricts() && $validated['id_district'] != $dossier->id_district) {
            return back()->withErrors([
                'error' => 'Vous ne pouvez pas changer le district du dossier.'
            ]);
        }

        try {
            DB::beginTransaction();
            
            $dossier->update($validated);
            
            ActivityLogger::logUpdate(
                ActivityLog::ENTITY_DOSSIER,
                $id,
                [
                    'nom_dossier' => $dossier->nom_dossier,
                    'numero_ouverture' => $dossier->numero_ouverture,
                    'commune' => $dossier->commune,
                    'id_district' => $dossier->id_district,
                ]
            );
            
            DB::commit();

            return redirect()
                ->route('dossiers.show', $id)
                ->with('message', 'Dossier modifié avec succès');
                
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    private function canCloseDossier(Dossier $dossier, User $user): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isCentralUser()) {
            return true;
        }

        if ($user->isAdminDistrict()) {
            return $user->id_district === $dossier->id_district;
        }

        return false;
    }

    private function canGenerateDocuments(Dossier $dossier, User $user): bool
    {
        if (!$dossier->is_closed) {
            return true;
        }

        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdminDistrict()) {
            return $user->id_district === $dossier->id_district;
        }

        return false;
    }

    public function close(Request $request, $id)
    {
        /** @var User $user */
        $user = Auth::user();
        $dossier = Dossier::findOrFail($id);

        if (!$user->canCloseDossier()) {
            return back()->withErrors([
                'error' => 'Seul un administrateur district peut fermer un dossier.'
            ]);
        }

        if (!$this->canCloseDossier($dossier, $user)) {
            return back()->withErrors([
                'error' => 'Vous n\'avez pas la permission de fermer ce dossier.'
            ]);
        }

        $validated = $request->validate([
            'date_fermeture' => 'required|date|after_or_equal:' . $dossier->date_ouverture,
            'motif_fermeture' => 'nullable|string|max:500',
        ]);

        try {
            DB::beginTransaction();

            $dossier->update([
                'date_fermeture' => $validated['date_fermeture'],
                'closed_by' => $user->id,
                'motif_fermeture' => $validated['motif_fermeture'] ?? null,
            ]);

            if (class_exists(ActivityLog::class)) {
               ActivityLog::create([
                    'id_user' => $user->id,
                    'action' => 'close',
                    'entity_type' => 'dossier',
                    'entity_id' => $dossier->id,
                    'id_district' => $dossier->id_district,
                    'metadata' => json_encode([
                        'motif' => $validated['motif_fermeture'],
                        'date_fermeture' => $validated['date_fermeture'],
                    ]),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            }

            DB::commit();

            return back()->with('success', 'Dossier fermé avec succès');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    } 

    public function reopen($id)
    {
        /** @var User $user */
        $user = Auth::user();
        $dossier = Dossier::findOrFail($id);

        if (!$user->canCloseDossier()) {
            return back()->withErrors([
                'error' => 'Seul un administrateur district peut rouvrir un dossier.'
            ]);
        }

        if (!$this->canCloseDossier($dossier, $user)) {
            return back()->withErrors([
                'error' => 'Vous n\'avez pas la permission de rouvrir ce dossier.'
            ]);
        }

        if (!$dossier->date_fermeture) {
            return back()->withErrors(['error' => 'Ce dossier est déjà ouvert.']);
        }

        try {
            DB::beginTransaction();

            $dossier->update([
                'date_fermeture' => null,
                'closed_by' => null,
                'motif_fermeture' => null,
            ]);

            if (class_exists(ActivityLog::class)) {
                ActivityLog::create([
                    'id_user' => $user->id,
                    'action' => 'reopen',
                    'entity_type' => 'dossier',
                    'entity_id' => $dossier->id,
                    'id_district' => $dossier->id_district,
                    'metadata' => json_encode(['reopened_at' => now()]),
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);
            }

            DB::commit();
            return back()->with('success', 'Dossier rouvert avec succès');

        } catch (\Exception $e) {
            DB::rollBack();
    
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }

    private function canDeleteDossier(Dossier $dossier, User $user): bool
    {
        if ($dossier->is_closed) {
            return false;
        }

        if (!$user->canAccessAllDistricts() && $user->id_district !== $dossier->id_district) {
            return false;
        }

        return $user->isSuperAdmin() || $user->isAdminDistrict();
    }

    private function canExportDossier(Dossier $dossier, User $user): bool
    {
        if (!$user->canAccessAllDistricts() && $user->id_district !== $dossier->id_district) {
            return false;
        }

        return $user->isSuperAdmin() 
            || $user->isCentralUser() 
            || $user->isAdminDistrict();
    }

    private function canModifyDossier(Dossier $dossier, User $user): bool
    {
        if ($dossier->is_closed) {
            return false;
        }

        if (!$user->canAccessAllDistricts() && $user->id_district !== $dossier->id_district) {
            return false;
        }

        if ($user->isSuperAdmin() || $user->isAdminDistrict() || $user->isCentralUser()) {
            return true;
        }

        return $user->isUserDistrict() && $user->id_district === $dossier->id_district;
    }

    private function getDistrictStatsLocal(): array
    {
        /** @var User $user */
        $user = Auth::user();

        $query = Dossier::query();

        if (!$user->canAccessAllDistricts()) {
            $query->where('id_district', $user->id_district);
        }

        return [
            'total' => $query->count(),
            'open' => (clone $query)->whereNull('date_fermeture')->count(),
            'closed' => (clone $query)->whereNotNull('date_fermeture')->count(),
            'recent' => (clone $query)->where('created_at', '>=', now()->subDays(30))->count(),
        ];
    }

    public function destroy($id)
    {
        $this->authorizeDistrictAccess('delete');
        
        /** @var User $user */
        $user = Auth::user();
        $dossier = Dossier::with(['demandeurs', 'proprietes', 'piecesJointes'])
            ->findOrFail($id);
        
        if ($dossier->is_closed) {
            return back()->withErrors([
                'error' => 'Impossible de supprimer un dossier fermé.'
            ]);
        }
        
        $canDelete = $user->isSuperAdmin() || 
                    ($user->isAdminDistrict() && $user->id_district === $dossier->id_district);
        
        if (!$canDelete) {
            return back()->withErrors([
                'error' => 'Vous n\'avez pas la permission de supprimer ce dossier.'
            ]);
        }
        
        $totalDemandeurs = $dossier->demandeurs()->count();
        $totalProprietes = $dossier->proprietes()->count();
        $totalPiecesJointes = $dossier->piecesJointes()->count();
        
        if ($totalDemandeurs > 0 || $totalProprietes > 0 || $totalPiecesJointes > 0) {
            $message = 'Le dossier ne peut pas être supprimé car il contient : ';
            $details = [];
            
            if ($totalDemandeurs > 0) {
                $details[] = "$totalDemandeurs demandeur(s)";
            }
            if ($totalProprietes > 0) {
                $details[] = "$totalProprietes propriété(s)";
            }
            if ($totalPiecesJointes > 0) {
                $details[] = "$totalPiecesJointes pièce(s) jointe(s)";
            }
            
            return back()->withErrors([
                'error' => $message . implode(', ', $details) . '. Veuillez d\'abord supprimer ces éléments.'
            ]);
        }

        try {
            DB::beginTransaction();
            
            ActivityLogger::logDeletion(
                ActivityLog::ENTITY_DOSSIER,
                $dossier->id,
                [
                    'nom_dossier' => $dossier->nom_dossier,
                    'numero_ouverture' => $dossier->numero_ouverture,
                    'commune' => $dossier->commune,
                    'circonscription' => $dossier->circonscription,
                    'type_commune' => $dossier->type_commune,
                    'fokontany' => $dossier->fokontany,
                    'date_ouverture' => $dossier->date_ouverture,
                    'id_district' => $dossier->id_district,
                ]
            );
            
            $dossier->delete();
            
            DB::commit();
            
            return Redirect::route('dossiers')
                ->with('success', 'Dossier vide supprimé avec succès');
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->withErrors(['error' => 'Erreur lors de la suppression : ' . $e->getMessage()]);
        }
    }
}