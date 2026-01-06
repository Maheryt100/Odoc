<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\District;
use App\Models\Region;
use App\Models\Province;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use App\Services\ActivityLogger;
use App\Models\ActivityLog;

class UserManagementController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('district.access:manage_users');
    }

    /**
     * Liste des utilisateurs avec filtres
     * ✅ Super Admin voit TOUS les utilisateurs (mais actions limitées)
     */
    public function index(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        $query = User::with(['district.region.province']);

        // ✅ Admin district ne voit QUE les users de son district
        if ($user->isAdminDistrict()) {
            $query->where('id_district', $user->id_district)
                  ->where('role', User::ROLE_USER_DISTRICT);
        }

        // ✅ Super Admin voit TOUS les utilisateurs (pour consultation)
        // Les actions seront limitées au niveau des boutons
        if ($user->isSuperAdmin()) {
            // Pas de filtre - voir tous les utilisateurs
            // Les permissions (can_edit, can_delete) seront calculées individuellement
        }

        // ✅ Central User voit TOUS les utilisateurs (lecture seule)
        if ($user->isCentralUser()) {
            // Pas de filtre - voir tous les utilisateurs en lecture seule
        }

        // FILTRES
        if ($request->filled('role')) {
            // Admin district ne peut filtrer que par user_district
            if ($user->isAdminDistrict() && $request->role !== User::ROLE_USER_DISTRICT) {
                return back()->withErrors(['role' => 'Vous ne pouvez voir que les utilisateurs district']);
            }
            
            $query->where('role', $request->role);
        }

        if ($request->filled('district')) {
            // Admin district ne peut filtrer que par son district
            if ($user->isAdminDistrict() && $request->district != $user->id_district) {
                return back()->withErrors(['district' => 'Vous ne pouvez voir que votre district']);
            }
            $query->where('id_district', $request->district);
        }

        if ($request->filled('status')) {
            $isActive = $request->status === 'active';
            $query->where('status', $isActive);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        /** @var User $connectedUser */
        $connectedUser = Auth::user();

        $users = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString()
            ->through(fn($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'role_name' => $user->role_name,
                'status' => $user->status,
                'district' => $user->district ? [
                    'id' => $user->district->id,
                    'nom_district' => $user->district->nom_district,
                    'nom_region' => $user->district->region?->nom_region ?? 'Région inconnue',
                    'nom_province' => $user->district->region?->province?->nom_province ?? 'Province inconnue',
                ] : null,
                'location' => $user->location,
                'created_at' => $user->created_at->format('d/m/Y'),
                // ✅ Permissions individuelles (Super Admin ne peut pas éditer user_district)
                'can_edit' => $connectedUser->canEditUser($user),
                'can_delete' => $connectedUser->canDeleteUser($user),
                // ✅ Nouveau : permission de consultation
                'can_view' => $connectedUser->canViewUser($user),
            ]);

        // ✅ Stats complètes pour Super Admin et Central User
        if ($user->isSuperAdmin() || $user->isCentralUser()) {
            $stats = [
                'total' => User::count(),
                'super_admins' => User::where('role', User::ROLE_SUPER_ADMIN)->count(),
                'central_users' => User::where('role', User::ROLE_CENTRAL_USER)->count(),
                'admin_district' => User::where('role', User::ROLE_ADMIN_DISTRICT)->count(),
                'user_district' => User::where('role', User::ROLE_USER_DISTRICT)->count(),
                'active' => User::where('status', true)->count(),
                'inactive' => User::where('status', false)->count(),
            ];
        } elseif ($user->isAdminDistrict()) {
            $stats = [
                'total' => User::where('id_district', $user->id_district)
                    ->where('role', User::ROLE_USER_DISTRICT)->count(),
                'super_admins' => 0,
                'central_users' => 0,
                'admin_district' => 0,
                'user_district' => User::where('role', User::ROLE_USER_DISTRICT)
                    ->where('id_district', $user->id_district)->count(),
                'active' => User::where('status', true)
                    ->where('id_district', $user->id_district)
                    ->where('role', User::ROLE_USER_DISTRICT)->count(),
                'inactive' => User::where('status', false)
                    ->where('id_district', $user->id_district)
                    ->where('role', User::ROLE_USER_DISTRICT)->count(),
            ];
        } else {
            $stats = [
                'total' => User::count(),
                'super_admins' => User::where('role', User::ROLE_SUPER_ADMIN)->count(),
                'central_users' => User::where('role', User::ROLE_CENTRAL_USER)->count(),
                'admin_district' => User::where('role', User::ROLE_ADMIN_DISTRICT)->count(),
                'user_district' => User::where('role', User::ROLE_USER_DISTRICT)->count(),
                'active' => User::where('status', true)->count(),
                'inactive' => User::where('status', false)->count(),
            ];
        }

        // ✅ Tous les districts visibles pour Super Admin et Central User
        $districts = District::with('region')->orderBy('nom_district')->get();

        // ✅ Tous les rôles visibles dans les filtres pour Super Admin
        if ($user->isSuperAdmin() || $user->isCentralUser()) {
            $roles = [
                User::ROLE_SUPER_ADMIN => 'Super Administrateur',
                User::ROLE_CENTRAL_USER => 'Utilisateur Central',
                User::ROLE_ADMIN_DISTRICT => 'Administrateur District',
                User::ROLE_USER_DISTRICT => 'Utilisateur District',
            ];
        } else {
            // Admin District voit uniquement user_district
            $roles = User::getAvailableRoles($user);
        }

        return Inertia::render('users/Index', [
            'users' => $users,
            'stats' => $stats,
            'districts' => $districts,
            'filters' => [
                'role' => $request->get('role'),
                'district' => $request->get('district'),
                'status' => $request->get('status'),
                'search' => $request->get('search'),
            ],
            'roles' => $roles,
        ]);
    }

    /**
     * Formulaire de création
     */
    public function create()
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user->canManageUsers()) {
            abort(403, 'Vous n\'avez pas la permission de créer des utilisateurs');
        }

        // ✅ Locations filtrées pour admin district
        if ($user->isAdminDistrict()) {
            $district = District::with(['region.province'])->find($user->id_district);
            
            if (!$district) {
                return back()->withErrors(['error' => 'District introuvable']);
            }

            $locations = [
                [
                    'id' => $district->region->province->id,
                    'nom_province' => $district->region->province->nom_province,
                    'regions' => [
                        [
                            'id' => $district->region->id,
                            'nom_region' => $district->region->nom_region,
                            'districts' => [
                                [
                                    'id' => $district->id,
                                    'nom_district' => $district->nom_district,
                                ]
                            ]
                        ]
                    ]
                ]
            ];
        } else {
            $locations = Province::with(['regions.districts'])
                ->orderBy('nom_province')
                ->get()
                ->map(function ($province) {
                    return [
                        'id' => $province->id,
                        'nom_province' => $province->nom_province,
                        'regions' => $province->regions->map(function ($region) {
                            return [
                                'id' => $region->id,
                                'nom_region' => $region->nom_region,
                                'districts' => $region->districts->map(function ($district) {
                                    return [
                                        'id' => $district->id,
                                        'nom_district' => $district->nom_district,
                                    ];
                                }),
                            ];
                        }),
                    ];
                })->toArray();
        }

        $availableRoles = User::getAvailableRoles($user);

        return Inertia::render('users/Create', [
            'locations' => $locations,
            'roles' => $availableRoles,
            'currentUserDistrict' => $user->id_district,
            'isSuperAdmin' => $user->isSuperAdmin(),
            'isAdminDistrict' => $user->isAdminDistrict(),
        ]);
    }

    /**
     * Enregistrer un nouvel utilisateur
     */
    public function store(Request $request)
    {
        /** @var User $currentUser */
        $currentUser = Auth::user();

        if (!$currentUser->canManageUsers()) {
            abort(403, 'Vous n\'avez pas la permission de créer des utilisateurs');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => 'required|in:' . implode(',', [
                User::ROLE_SUPER_ADMIN,
                User::ROLE_CENTRAL_USER,
                User::ROLE_ADMIN_DISTRICT,
                User::ROLE_USER_DISTRICT,
            ]),
            'id_district' => 'nullable|exists:districts,id',
            'status' => 'boolean',
        ], [
            'name.required' => 'Le nom est obligatoire',
            'email.required' => 'L\'email est obligatoire',
            'email.unique' => 'Cet email est déjà utilisé',
            'password.required' => 'Le mot de passe est obligatoire',
            'password.confirmed' => 'Les mots de passe ne correspondent pas',
            'role.required' => 'Le rôle est obligatoire',
            'id_district.exists' => 'Le district sélectionné n\'existe pas',
        ]);

        try {
            DB::beginTransaction();

            // ✅ Vérifier que l'utilisateur peut créer ce rôle
            if (!$currentUser->canCreateUserRole($validated['role'])) {
                return back()->withErrors([
                    'role' => 'Vous n\'avez pas la permission de créer ce type d\'utilisateur'
                ]);
            }

            // ✅ Vérifications pour Super Admin
            if ($currentUser->isSuperAdmin()) {
                // Pour super_admin et central_user : pas de district
                if (in_array($validated['role'], [User::ROLE_SUPER_ADMIN, User::ROLE_CENTRAL_USER])) {
                    if (!empty($validated['id_district'])) {
                        return back()->withErrors([
                            'id_district' => 'Ce rôle ne doit pas avoir de district affecté'
                        ]);
                    }
                }
                
                // Pour admin_district : district obligatoire
                if ($validated['role'] === User::ROLE_ADMIN_DISTRICT) {
                    if (empty($validated['id_district'])) {
                        return back()->withErrors([
                            'id_district' => 'Un district est requis pour un administrateur district'
                        ]);
                    }
                }
            }

            // ✅ Vérifications pour Admin District
            if ($currentUser->isAdminDistrict()) {
                // Ne peut créer que des user_district
                if ($validated['role'] !== User::ROLE_USER_DISTRICT) {
                    return back()->withErrors([
                        'role' => 'Vous ne pouvez créer que des utilisateurs district'
                    ]);
                }
                
                // Doit être dans SON district
                if (!isset($validated['id_district']) || $validated['id_district'] != $currentUser->id_district) {
                    return back()->withErrors([
                        'id_district' => 'Vous ne pouvez créer des utilisateurs que dans votre district'
                    ]);
                }
            }

            // Validation finale cohérence role/district
            $rolesRequiringDistrict = [User::ROLE_ADMIN_DISTRICT, User::ROLE_USER_DISTRICT];
            
            if (in_array($validated['role'], $rolesRequiringDistrict)) {
                if (empty($validated['id_district'])) {
                    return back()->withErrors([
                        'id_district' => 'Un district est requis pour ce rôle'
                    ]);
                }
            }

            // Super admin et central user ne doivent pas avoir de district
            if (in_array($validated['role'], [User::ROLE_SUPER_ADMIN, User::ROLE_CENTRAL_USER])) {
                $validated['id_district'] = null;
            }

            // Créer l'utilisateur
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'id_district' => $validated['id_district'],
                'status' => $validated['status'] ?? true,
            ]);

            DB::commit();

            ActivityLogger::logCreation(
                ActivityLog::ENTITY_USER,
                $user->id,
                [
                    'user_name' => $user->name,
                    'user_email' => $user->email,
                    'user_role' => $user->role,
                    'user_district' => $user->id_district,
                    'created_by' => $currentUser->id,
                    'created_by_name' => $currentUser->name,
                    'id_district' => $user->id_district,
                ]
            );

            return redirect()->route('users.index')
                ->with('success', "Utilisateur {$user->name} créé avec succès");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Erreur lors de la création : ' . $e->getMessage()]);
        }
    }

    /**
     * Formulaire d'édition
     */
    public function edit($id)
    {
        /** @var User $currentUser */
        $currentUser = Auth::user();
        $user = User::with('district.region.province')->findOrFail($id);

        // ✅ Vérifier les permissions
        if (!$currentUser->canEditUser($user)) {
            abort(403, 'Vous n\'avez pas la permission de modifier cet utilisateur');
        }

        if ($user->id === $currentUser->id) {
            return redirect()->route('profile.edit')
                ->with('info', 'Utilisez la page de profil pour modifier vos propres informations');
        }

        // ✅ Locations filtrées
        if ($currentUser->isAdminDistrict()) {
            $district = District::with(['region.province'])->find($currentUser->id_district);
            
            $locations = [
                [
                    'id' => $district->region->province->id,
                    'nom_province' => $district->region->province->nom_province,
                    'regions' => [
                        [
                            'id' => $district->region->id,
                            'nom_region' => $district->region->nom_region,
                            'districts' => [
                                [
                                    'id' => $district->id,
                                    'nom_district' => $district->nom_district,
                                ]
                            ]
                        ]
                    ]
                ]
            ];
        } else {
            $locations = Province::with(['regions.districts'])
                ->orderBy('nom_province')
                ->get()
                ->map(function ($province) {
                    return [
                        'id' => $province->id,
                        'nom_province' => $province->nom_province,
                        'regions' => $province->regions->map(function ($region) {
                            return [
                                'id' => $region->id,
                                'nom_region' => $region->nom_region,
                                'districts' => $region->districts->map(function ($district) {
                                    return [
                                        'id' => $district->id,
                                        'nom_district' => $district->nom_district,
                                    ];
                                }),
                            ];
                        }),
                    ];
                })->toArray();
        }

        $availableRoles = User::getAvailableRoles($currentUser);

        return Inertia::render('users/Create', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'role_name' => $user->role_name,
                'id_district' => $user->id_district,
                'status' => $user->status,
                'district' => $user->district ? [
                    'id' => $user->district->id,
                    'nom_district' => $user->district->nom_district,
                    'id_region' => $user->district->id_region,
                    'id_province' => $user->district->region->id_province,
                ] : null,
                'created_at' => $user->created_at->format('d/m/Y à H:i'),
            ],
            'locations' => $locations,
            'roles' => $availableRoles,
            'isSuperAdmin' => $currentUser->isSuperAdmin(),
            'isAdminDistrict' => $currentUser->isAdminDistrict(),
        ]);
    }

    /**
     * Mettre à jour un utilisateur
     */
    public function update(Request $request, $id)
    {
        /** @var User $currentUser */
        $currentUser = Auth::user();
        $user = User::findOrFail($id);

        if (!$currentUser->canEditUser($user)) {
            abort(403, 'Vous n\'avez pas la permission de modifier cet utilisateur');
        }

        if ($user->id === $currentUser->id) {
            return back()->withErrors([
                'error' => 'Vous ne pouvez pas modifier votre propre compte via cette interface'
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'role' => 'required|in:' . implode(',', [
                User::ROLE_SUPER_ADMIN,
                User::ROLE_CENTRAL_USER,
                User::ROLE_ADMIN_DISTRICT,
                User::ROLE_USER_DISTRICT,
            ]),
            'id_district' => 'nullable|exists:districts,id',
            'status' => 'boolean',
        ]);

        try {
            DB::beginTransaction();

            $oldData = [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'id_district' => $user->id_district,
                'status' => $user->status,
            ];

            // ✅ Vérifier que l'utilisateur peut modifier vers ce rôle
            if (!$currentUser->canCreateUserRole($validated['role'])) {
                return back()->withErrors([
                    'role' => 'Vous n\'avez pas la permission de modifier vers ce rôle'
                ]);
            }

            // ✅ Vérifications pour Super Admin
            if ($currentUser->isSuperAdmin()) {
                // Pour super_admin et central_user : pas de district
                if (in_array($validated['role'], [User::ROLE_SUPER_ADMIN, User::ROLE_CENTRAL_USER])) {
                    if (!empty($validated['id_district'])) {
                        return back()->withErrors([
                            'id_district' => 'Ce rôle ne doit pas avoir de district affecté'
                        ]);
                    }
                }
                
                // Pour admin_district : district obligatoire
                if ($validated['role'] === User::ROLE_ADMIN_DISTRICT) {
                    if (empty($validated['id_district'])) {
                        return back()->withErrors([
                            'id_district' => 'Un district est requis pour un administrateur district'
                        ]);
                    }
                }
            }

            // ✅ Vérifications pour Admin District
            if ($currentUser->isAdminDistrict()) {
                if ($validated['role'] !== User::ROLE_USER_DISTRICT) {
                    return back()->withErrors([
                        'role' => 'Vous ne pouvez gérer que des utilisateurs district'
                    ]);
                }
                
                if (!isset($validated['id_district']) || $validated['id_district'] != $currentUser->id_district) {
                    return back()->withErrors([
                        'id_district' => 'Vous ne pouvez assigner que votre district'
                    ]);
                }
            }

            // Empêcher la suppression du dernier super admin
            if ($user->role === User::ROLE_SUPER_ADMIN && $validated['role'] !== User::ROLE_SUPER_ADMIN) {
                $superAdminCount = User::where('role', User::ROLE_SUPER_ADMIN)->count();
                if ($superAdminCount <= 1) {
                    return back()->withErrors([
                        'role' => 'Impossible de retirer le rôle du dernier super administrateur'
                    ]);
                }
            }

            // Validation cohérence role/district
            $rolesRequiringDistrict = [User::ROLE_ADMIN_DISTRICT, User::ROLE_USER_DISTRICT];
            
            if (in_array($validated['role'], $rolesRequiringDistrict)) {
                if (empty($validated['id_district'])) {
                    return back()->withErrors([
                        'id_district' => 'Un district est requis pour ce rôle'
                    ]);
                }
            }

            // Super admin et central user ne doivent pas avoir de district
            if (in_array($validated['role'], [User::ROLE_SUPER_ADMIN, User::ROLE_CENTRAL_USER])) {
                $validated['id_district'] = null;
            }

            $user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'role' => $validated['role'],
                'id_district' => $validated['id_district'],
                'status' => $validated['status'] ?? $user->status,
            ]);

            if (!empty($validated['password'])) {
                $user->update(['password' => Hash::make($validated['password'])]);
            }

            DB::commit();

            ActivityLogger::logUpdate(
                ActivityLog::ENTITY_USER,
                $user->id,
                [
                    'user_name' => $user->name,
                    'user_email' => $user->email,
                    'old_data' => $oldData,
                    'new_data' => [
                        'name' => $validated['name'],
                        'email' => $validated['email'],
                        'role' => $validated['role'],
                        'id_district' => $validated['id_district'],
                        'status' => $validated['status'] ?? $user->status,
                    ],
                    'modified_by' => $currentUser->id,
                    'modified_by_name' => $currentUser->name,
                    'id_district' => $user->id_district,
                ]
            );

            return redirect()->route('users.index')
                ->with('success', "Utilisateur {$user->name} modifié avec succès");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }

    public function toggleStatus($id)
    {
        /** @var User $currentUser */
        $currentUser = Auth::user();
        $user = User::findOrFail($id);

        if (!$currentUser->canEditUser($user)) {
            abort(403, 'Vous n\'avez pas la permission de modifier cet utilisateur');
        }

        if ($user->id === $currentUser->id) {
            return back()->withErrors(['error' => 'Vous ne pouvez pas modifier votre propre statut']);
        }

        try {
            $newStatus = !$user->status;
            $user->update(['status' => $newStatus]);
            
            ActivityLogger::logUpdate(
                ActivityLog::ENTITY_USER,
                $user->id,
                [
                    'action_type' => 'toggle_status',
                    'user_name' => $user->name,
                    'old_status' => !$newStatus,
                    'new_status' => $newStatus,
                    'modified_by' => $currentUser->id,
                    'modified_by_name' => $currentUser->name,
                    'id_district' => $user->id_district,
                ]
            );

            $message = $newStatus ? 'Utilisateur activé' : 'Utilisateur désactivé';
            
            return back()->with('success', $message);

        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        /** @var User $currentUser */
        $currentUser = Auth::user();
        $user = User::findOrFail($id);

        if (!$currentUser->canDeleteUser($user)) {
            abort(403, 'Vous n\'avez pas la permission de supprimer cet utilisateur');
        }

        if ($user->id === $currentUser->id) {
            return back()->withErrors(['error' => 'Vous ne pouvez pas supprimer votre propre compte']);
        }

        if ($user->role === User::ROLE_SUPER_ADMIN) {
            $superAdminCount = User::where('role', User::ROLE_SUPER_ADMIN)->count();
            if ($superAdminCount <= 1) {
                return back()->withErrors(['error' => 'Impossible de supprimer le dernier super administrateur']);
            }
        }

        try {
            DB::beginTransaction();

            $userName = $user->name;
            $userEmail = $user->email;
            $userDistrict = $user->id_district;
            $userId = $user->id;

            $dossiersCount = DB::table('dossiers')->where('id_user', $userId)->count();
            $proprietesCount = DB::table('proprietes')->where('id_user', $userId)->count();
            $demandeursCount = DB::table('demandeurs')->where('id_user', $userId)->count();

            if ($dossiersCount > 0 || $proprietesCount > 0 || $demandeursCount > 0) {
                return back()->withErrors([
                    'error' => "Impossible de supprimer cet utilisateur. Il a créé : {$dossiersCount} dossier(s), {$proprietesCount} propriété(s), {$demandeursCount} demandeur(s)"
                ]);
            }

            $user->delete();

            DB::commit();

            ActivityLogger::logDeletion(
                ActivityLog::ENTITY_USER,
                $id,
                [
                    'user_name' => $userName,
                    'user_email' => $userEmail,
                    'deleted_by' => $currentUser->id,
                    'deleted_by_name' => $currentUser->name,
                    'id_district' => $userDistrict,
                ]
            );

            return redirect()->route('users.index')
                ->with('success', "Utilisateur {$userName} supprimé avec succès");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Erreur : ' . $e->getMessage()]);
        }
    }
}