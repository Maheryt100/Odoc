<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('district.access:manage_users');
    }

    public function index(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();

        // ✅ Validation des paramètres
        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'user_id' => 'nullable|integer|exists:users,id',
            'action' => 'nullable|string|max:50',
            'document_type' => 'nullable|string|max:50',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'per_page' => 'nullable|integer|min:10|max:200', // ✅ Configurable
        ]);

        // ✅ Par défaut : 50 par page (modifiable)
        $perPage = $request->input('per_page', 50);

        // ✅ Query de base avec TOUS les attributs nécessaires
        $query = ActivityLog::with([
            'user:id,name,email',
            'district:id,nom_district'
        ])
        ->select([
            'id',
            'id_user',
            'action',
            'entity_type',
            'entity_id',
            'entity_name', // ✅ NOUVEAU
            'document_type',
            'id_district',
            'metadata',
            'ip_address',
            'user_agent',
            'created_at',
            'updated_at',
        ])
        ->orderBy('created_at', 'desc');

        // ✅ Filtrer par district si nécessaire
        if (!$user->canAccessAllDistricts()) {
            $query->where('id_district', $user->id_district);
        }

        // ✅ FILTRES CÔTÉ SERVEUR (plus performant)
        
        // Recherche textuelle
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('user', fn($sub) => 
                    $sub->where('name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%")
                )
                ->orWhere('action', 'ilike', "%{$search}%")
                ->orWhere('entity_type', 'ilike', "%{$search}%")
                ->orWhere('entity_name', 'ilike', "%{$search}%"); // ✅ Cherche dans les noms
            });
        }

        // Filtre utilisateur
        if ($request->filled('user_id')) {
            $query->where('id_user', $request->user_id);
        }

        // Filtre action
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        // Filtre type de document
        if ($request->filled('document_type')) {
            $query->where('document_type', $request->document_type);
        }

        // Filtre période
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // ✅ Pagination côté serveur
        $logs = $query->paginate($perPage)
            ->withQueryString() // ✅ Garde les paramètres de recherche dans l'URL
            ->through(function($log) {
                return [
                    'id' => $log->id,
                    'user' => $log->user,
                    'district' => $log->district,
                    'action' => $log->action,
                    'action_label' => $log->action_label,
                    'entity_type' => $log->entity_type,
                    'entity_label' => $log->entity_label,
                    'entity_name' => $log->entity_name, // ✅ Nom lisible
                    'document_type' => $log->document_type,
                    'entity_id' => $log->entity_id,
                    'details' => $log->details,
                    'metadata' => $log->metadata,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at->toISOString(),
                ];
            });

        // ✅ Statistiques (non paginées)
        $statsQuery = ActivityLog::query();
        if (!$user->canAccessAllDistricts()) {
            $statsQuery->where('id_district', $user->id_district);
        }

        $stats = [
            'total_actions' => $statsQuery->count(),
            'today_actions' => (clone $statsQuery)->whereDate('created_at', today())->count(),
            'week_actions' => (clone $statsQuery)->where('created_at', '>=', now()->subWeek())->count(),
            'month_actions' => (clone $statsQuery)->where('created_at', '>=', now()->subMonth())->count(),
            'total_documents' => (clone $statsQuery)->where('entity_type', ActivityLog::ENTITY_DOCUMENT)->count(),
        ];

        // ✅ Listes pour les filtres
        $usersQuery = User::select('id', 'name', 'email')->orderBy('name');
        if (!$user->canAccessAllDistricts()) {
            $usersQuery->where('id_district', $user->id_district);
        }
        $users = $usersQuery->get();

        $actions = [
            ActivityLog::ACTION_LOGIN => 'Connexion',
            ActivityLog::ACTION_LOGOUT => 'Déconnexion',
            ActivityLog::ACTION_CREATE => 'Création',
            ActivityLog::ACTION_UPDATE => 'Modification',
            ActivityLog::ACTION_DELETE => 'Suppression',
            ActivityLog::ACTION_GENERATE => 'Génération',
            ActivityLog::ACTION_DOWNLOAD => 'Téléchargement',
            ActivityLog::ACTION_ARCHIVE => 'Archivage',
            ActivityLog::ACTION_UNARCHIVE => 'Désarchivage',
            ActivityLog::ACTION_EXPORT => 'Export',
            ActivityLog::ACTION_CLOSE => 'Fermeture',
            ActivityLog::ACTION_REOPEN => 'Réouverture',
            ActivityLog::ACTION_UPLOAD => 'Upload',
            ActivityLog::ACTION_VERIFY => 'Vérification',
        ];

        $documentTypes = [
            ActivityLog::DOC_RECU => 'Reçu',
            ActivityLog::DOC_ACTE_VENTE => 'Acte de Vente',
            ActivityLog::DOC_CSF => 'CSF',
            ActivityLog::DOC_REQUISITION => 'Réquisition',
        ];

        return Inertia::render('admin/activity-logs/Index', [
            'logs' => $logs, // ✅ Paginé côté serveur
            'filters' => [
                'search' => $request->get('search'),
                'user_id' => $request->get('user_id'),
                'action' => $request->get('action'),
                'document_type' => $request->get('document_type'),
                'date_from' => $request->get('date_from'),
                'date_to' => $request->get('date_to'),
                'per_page' => $perPage,
            ],
            'stats' => $stats,
            'users' => $users,
            'actions' => $actions,
            'documentTypes' => $documentTypes,
        ]);
    }

    public function documentStats(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();

        $query = ActivityLog::documents()
            ->where('action', ActivityLog::ACTION_DOWNLOAD)
            ->with('user:id,name,email');

        if (!$user->canAccessAllDistricts()) {
            $query->where('id_district', $user->id_district);
        }

        $stats = $query->selectRaw('
                document_type,
                COUNT(*) as download_count,
                COUNT(DISTINCT id_user) as unique_users
            ')
            ->groupBy('document_type')
            ->get();

        return Inertia::render('admin/activity-logs/DocumentStats', [
            'stats' => $stats,
        ]);
    }

    public function userActivity($userId)
    {
        /** @var User $user */
        $user = Auth::user();

        $query = ActivityLog::with(['district:id,nom_district'])
            ->where('id_user', $userId)
            ->orderBy('created_at', 'desc');

        if (!$user->canAccessAllDistricts()) {
            $query->where('id_district', $user->id_district);
        }

        $logs = $query->limit(100)
            ->get()
            ->map(function($log) {
                return [
                    'id' => $log->id,
                    'action_label' => $log->action_label,
                    'entity_label' => $log->entity_label,
                    'entity_name' => $log->entity_name,
                    'details' => $log->details,
                    'created_at' => $log->created_at->toISOString(),
                ];
            });

        return response()->json([
            'logs' => $logs,
        ]);
    }

    public function export(Request $request)
    {
        // TODO: Implémenter l'export CSV
        return back()->with('info', 'Export en cours de développement');
    }
}