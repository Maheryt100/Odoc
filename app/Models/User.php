<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * Class User - VERSION CORRIGÉE
 * 
 * RÈGLES DE PERMISSIONS FINALES:
 * 
 * 1. SUPER ADMIN:
 *    - Lecture seule sur TOUS les districts
 *    - Peut créer UNIQUEMENT des admin_district
 *    - Peut exporter les données
 *    - NE PEUT PAS créer/modifier/supprimer de données métier
 * 
 * 2. CENTRAL USER:
 *    - Lecture seule sur TOUS les districts
 *    - Peut exporter les données
 *    - NE PEUT PAS créer/modifier/supprimer
 *    - NE PEUT PAS gérer d'utilisateurs
 * 
 * 3. ADMIN DISTRICT:
 *    - Création/Modification/Suppression dans SON district uniquement
 *    - Peut créer UNIQUEMENT des user_district de son district
 *    - Peut configurer les prix de son district
 *    - Peut fermer/rouvrir les dossiers
 *    - Peut générer les documents
 * 
 * 4. USER DISTRICT:
 *    - Création/Modification dans SON district uniquement
 *    - NE PEUT PAS supprimer
 *    - NE PEUT PAS gérer d'utilisateurs
 *    - Peut générer les documents
 */
class User extends Authenticatable
{
    use HasFactory, Notifiable;

    // Constantes pour les rôles
    const ROLE_SUPER_ADMIN = 'super_admin';
    const ROLE_ADMIN_DISTRICT = 'admin_district';
    const ROLE_USER_DISTRICT = 'user_district';
    const ROLE_CENTRAL_USER = 'central_user';

    protected $fillable = [
        'name',
        'email',
        'role',
        'id_district',
        'status',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'status' => 'boolean',
    ];

    // ============ RELATIONS ============
    
    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class, 'id_district');
    }

    public function accessLogs(): HasMany
    {
        return $this->hasMany(UserAccessLog::class, 'id_user');
    }

    public function permissions(): HasMany
    {
        return $this->hasMany(UserPermission::class, 'id_user');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'id_user');
    }

    public function dossiers(): HasMany
    {
        return $this->hasMany(Dossier::class, 'id_user');
    }

    public function proprietes(): HasMany
    {
        return $this->hasMany(Propriete::class, 'id_user');
    }

    public function demandeurs(): HasMany
    {
        return $this->hasMany(Demandeur::class, 'id_user');
    }

    // ============ VÉRIFICATIONS DE RÔLES ============
    
    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN && $this->status;
    }

    public function isAdminDistrict(): bool
    {
        return $this->role === self::ROLE_ADMIN_DISTRICT && $this->status;
    }

    public function isUserDistrict(): bool
    {
        return $this->role === self::ROLE_USER_DISTRICT && $this->status;
    }

    public function isCentralUser(): bool
    {
        return $this->role === self::ROLE_CENTRAL_USER && $this->status;
    }

    public function isAdmin(): bool
    {
        return $this->isSuperAdmin() || $this->isAdminDistrict();
    }

    public function hasDistrictAccess(): bool
    {
        return $this->status && in_array($this->role, [
            self::ROLE_ADMIN_DISTRICT,
            self::ROLE_USER_DISTRICT
        ]) && $this->id_district !== null;
    }

    public function canAccessAllDistricts(): bool
    {
        return $this->isSuperAdmin() || $this->isCentralUser();
    }

    public function isReadOnly(): bool
    {
        return $this->isSuperAdmin() || $this->isCentralUser();
    }

    // ============ PERMISSIONS MÉTIER (CREATE/UPDATE/DELETE) ============

    /**
     * Peut créer des données métier (dossiers, propriétés, demandeurs)
     * ✅ Admin District et User District UNIQUEMENT
     * ❌ Super Admin et Central User: LECTURE SEULE
     */
    public function canCreate(?string $resource = null): bool
    {
        if (!$this->status) {
            return false;
        }

        // ❌ Super Admin et Central User : LECTURE SEULE
        if ($this->isReadOnly()) {
            return false;
        }
        
        // ✅ Admin District et User District : peuvent créer dans leur district
        if ($this->isAdminDistrict() || $this->isUserDistrict()) {
            return $this->id_district !== null;
        }
        
        return false;
    }

    /**
     * Peut modifier des données métier
     * ✅ Admin District et User District UNIQUEMENT
     * ❌ Super Admin et Central User: LECTURE SEULE
     */
    public function canUpdate(?string $resource = null): bool
    {
        if (!$this->status) {
            return false;
        }

        // ❌ Super Admin et Central User : LECTURE SEULE
        if ($this->isReadOnly()) {
            return false;
        }

        // ✅ Admin District et User District : peuvent modifier dans leur district
        if ($this->isAdminDistrict() || $this->isUserDistrict()) {
            return $this->id_district !== null;
        }
        
        return false;
    }

    /**
     * Peut supprimer des données métier
     * ✅ Admin District UNIQUEMENT
     * ❌ Tous les autres: NON
     */
    public function canDelete(?string $resource = null): bool
    {
        if (!$this->status) {
            return false;
        }

        // ❌ Super Admin et Central User : LECTURE SEULE
        if ($this->isReadOnly()) {
            return false;
        }

        // ✅ Seul Admin District peut supprimer
        return $this->isAdminDistrict() && $this->id_district !== null;
    }

    /**
     * Peut archiver des données
     * ✅ Admin District et User District UNIQUEMENT
     */
    public function canArchive(): bool
    {
        if (!$this->status) {
            return false;
        }

        // ❌ Super Admin et Central User : NE PEUVENT PAS archiver
        if ($this->isReadOnly()) {
            return false;
        }

        return ($this->isAdminDistrict() || $this->isUserDistrict()) 
            && $this->id_district !== null;
    }

    /**
     * Peut exporter des données
     * ✅ TOUS peuvent exporter (lecture seule pour Super Admin et Central User)
     */
    public function canExportData(): bool
    {
        return $this->status;
    }

    // ============ GESTION DES UTILISATEURS ============

    /**
     * Peut gérer des utilisateurs
     * ✅ Super Admin : peut créer admin_district
     * ✅ Admin District : peut créer/gérer user_district de son district
     * ❌ Central User : AUCUNE gestion
     * ❌ User District : AUCUNE gestion
     */
    public function canManageUsers(): bool
    {
        if (!$this->status) {
            return false;
        }

        // ✅ Super Admin peut gérer (mais seulement admin_district)
        if ($this->isSuperAdmin()) {
            return true;
        }

        // ✅ Admin District peut gérer (user_district de leur district)
        if ($this->isAdminDistrict()) {
            return $this->id_district !== null;
        }

        // ❌ Central User et User District : AUCUNE gestion
        return false;
    }

    /**
     * Vérifie quel type d'utilisateur peut être créé
     * Super Admin : UNIQUEMENT admin_district
     * Admin District : UNIQUEMENT user_district de son district
     */
    public function canCreateUserRole(string $targetRole): bool
    {
        if (!$this->status) {
            return false;
        }

        // Super Admin : UNIQUEMENT admin_district
        if ($this->isSuperAdmin()) {
            return $targetRole === self::ROLE_ADMIN_DISTRICT;
        }
        
        // Admin District : UNIQUEMENT user_district
        if ($this->isAdminDistrict()) {
            return $targetRole === self::ROLE_USER_DISTRICT;
        }
        
        // Central User et User District : RIEN
        return false;
    }

    /**
     * Peut modifier un utilisateur spécifique
     */
    public function canEditUser(User $targetUser): bool
    {
        if (!$this->canManageUsers()) {
            return false;
        }

        // Ne peut pas se modifier soi-même via cette interface
        if ($targetUser->id === $this->id) {
            return false;
        }

        // Super Admin peut modifier les admin_district
        if ($this->isSuperAdmin()) {
            return $targetUser->role === self::ROLE_ADMIN_DISTRICT;
        }

        // Admin District peut modifier les user_district de son district
        if ($this->isAdminDistrict()) {
            return $targetUser->role === self::ROLE_USER_DISTRICT
                && $targetUser->id_district === $this->id_district;
        }

        return false;
    }

    /**
     * Peut supprimer un utilisateur
     * ✅ Super Admin UNIQUEMENT
     */
    public function canDeleteUser(User $targetUser): bool
    {
        if (!$this->status || $targetUser->id === $this->id) {
            return false;
        }

        // Seul Super Admin peut supprimer
        return $this->isSuperAdmin();
    }

    // ============ CONFIGURATION & DOCUMENTS ============

    /**
     * Peut configurer les prix
     * ✅ Admin District UNIQUEMENT
     */
    public function canConfigurePrices(): bool
    {
        if (!$this->status) {
            return false;
        }

        // ❌ Super Admin et Central User : LECTURE SEULE
        if ($this->isReadOnly()) {
            return false;
        }

        return $this->isAdminDistrict() && $this->id_district !== null;
    }

    /**
     * Peut générer des documents
     * ✅ Admin District et User District UNIQUEMENT
     */
    public function canGenerateDocuments(): bool
    {
        if (!$this->status) {
            return false;
        }

        // ❌ Super Admin et Central User : NE PEUVENT PAS
        if ($this->isReadOnly()) {
            return false;
        }

        // ✅ Admin District et User District : PEUVENT
        return ($this->isAdminDistrict() || $this->isUserDistrict()) 
            && $this->id_district !== null;
    }

    /**
     * Peut fermer/rouvrir un dossier
     * ✅ Admin District UNIQUEMENT
     */
    public function canCloseDossier(?Dossier $dossier = null): bool
    {
        if (!$this->status) {
            return false;
        }

        // ❌ Super Admin et Central User : NE PEUVENT PAS
        if ($this->isReadOnly()) {
            return false;
        }

        // ✅ Seul Admin District peut fermer/rouvrir
        if (!$this->isAdminDistrict()) {
            return false;
        }

        // Si un dossier est fourni, vérifier qu'il appartient au district
        if ($dossier) {
            return $this->id_district === $dossier->id_district;
        }

        return $this->id_district !== null;
    }

    // ============ ACCÈS AUX DONNÉES ============
    
    public function canAccessDistrict(?int $districtId): bool
    {
        if (!$districtId || !$this->status) {
            return false;
        }

        if ($this->canAccessAllDistricts()) {
            return true;
        }
        
        return $this->id_district === $districtId;
    }

    public function canAccessDossier(Dossier $dossier): bool
    {
        if (!$this->status) {
            return false;
        }

        if ($this->canAccessAllDistricts()) {
            return true;
        }
        
        return $this->id_district === $dossier->id_district;
    }

    // ============ MÉTHODES POUR DOSSIERS SPÉCIFIQUES ============
    
    public function canUpdateDossier(Dossier $dossier): bool
    {
        if ($dossier->is_closed || !$this->canAccessDossier($dossier)) {
            return false;
        }

        // ❌ Super Admin et Central User : LECTURE SEULE
        if ($this->isReadOnly()) {
            return false;
        }

        // ✅ Admin District : peut modifier tous les dossiers de son district
        if ($this->isAdminDistrict()) {
            return $this->id_district === $dossier->id_district;
        }

        // ✅ User District : peut modifier uniquement SES dossiers
        if ($this->isUserDistrict()) {
            return $this->id === $dossier->id_user 
                && $this->id_district === $dossier->id_district;
        }

        return false;
    }

    public function canDeleteDossier(Dossier $dossier): bool
    {
        if ($dossier->is_closed || !$this->canAccessDossier($dossier)) {
            return false;
        }

        // ❌ Super Admin et Central User : NE PEUVENT PAS
        if ($this->isReadOnly()) {
            return false;
        }

        // ✅ Seul Admin District peut supprimer
        return $this->isAdminDistrict() 
            && $this->id_district === $dossier->id_district;
    }

    public function canCloseDossierInstance(Dossier $dossier): bool
    {
        if ($dossier->is_closed || !$this->canAccessDossier($dossier)) {
            return false;
        }

        return $this->canCloseDossier($dossier);
    }

    public function canExportDossier(Dossier $dossier): bool
    {
        // Tous peuvent exporter s'ils ont accès
        return $this->canAccessDossier($dossier);
    }

    // ============ SCOPES POUR FILTRAGE ============
    
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', true);
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('status', false);
    }

    public function scopeForDistrict(Builder $query, int $districtId): Builder
    {
        return $query->where('id_district', $districtId);
    }

    public function scopeSuperAdmins(Builder $query): Builder
    {
        return $query->where('role', self::ROLE_SUPER_ADMIN);
    }

    public function scopeAdminDistricts(Builder $query): Builder
    {
        return $query->where('role', self::ROLE_ADMIN_DISTRICT);
    }

    public function scopeUserDistricts(Builder $query): Builder
    {
        return $query->where('role', self::ROLE_USER_DISTRICT);
    }

    public function scopeCentralUsers(Builder $query): Builder
    {
        return $query->where('role', self::ROLE_CENTRAL_USER);
    }

    public function scopeDistrictUsers(Builder $query): Builder
    {
        return $query->whereIn('role', [
            self::ROLE_ADMIN_DISTRICT,
            self::ROLE_USER_DISTRICT
        ])->whereNotNull('id_district');
    }

    // ============ ACCESSEURS (ATTRIBUTES) ============
    
    public function getRoleNameAttribute(): string
    {
        return match($this->role) {
            self::ROLE_SUPER_ADMIN => 'Super Administrateur',
            self::ROLE_ADMIN_DISTRICT => 'Administrateur District',
            self::ROLE_USER_DISTRICT => 'Utilisateur District',
            self::ROLE_CENTRAL_USER => 'Utilisateur Central',
            default => 'Utilisateur',
        };
    }

    public function getLocationAttribute(): string
    {
        if ($this->canAccessAllDistricts()) {
            return 'Tous les districts';
        }
        
        if (!$this->district) {
            return 'Non assigné';
        }

        $districtName = $this->district->nom_district ?? 'District inconnu';
        $regionName = $this->district->region?->nom_region ?? 'Région inconnue';
        $provinceName = $this->district->region?->province?->nom_province ?? 'Province inconnue';
        
        return sprintf('%s, %s, %s', $districtName, $regionName, $provinceName);
    }

    public function getStatusBadgeAttribute(): string
    {
        return $this->status ? 'Actif' : 'Inactif';
    }

    public function getStatusColorAttribute(): string
    {
        return $this->status ? 'success' : 'danger';
    }

    // ============ PERMISSIONS PERSONNALISÉES ============
    
    public function hasPermission(string $permission): bool
    {
        if ($this->isSuperAdmin()) {
            // Super admin a accès à toutes les permissions de lecture
            $readOnlyPermissions = ['view_statistics', 'export_data'];
            return in_array($permission, $readOnlyPermissions);
        }
        
        return $this->permissions()
            ->where('permission', $permission)
            ->where('granted', true)
            ->exists();
    }

    public function grantPermission(string $permission): void
    {
        UserPermission::grant($this->id, $permission);
    }

    public function revokePermission(string $permission): void
    {
        UserPermission::revoke($this->id, $permission);
    }

    public function getPermissionsList(): array
    {
        if ($this->isSuperAdmin() || $this->isCentralUser()) {
            return ['view_statistics', 'export_data'];
        }

        return UserPermission::getUserPermissions($this->id);
    }

    // ============ LOGGING ============
    
    public function logAccess(string $action, string $resourceType, ?int $resourceId = null): void
    {
        UserAccessLog::create([
            'id_user' => $this->id,
            'id_district' => $this->id_district,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'ip_address' => request()->ip(),
        ]);
    }

    public function getRecentLogs(int $limit = 10)
    {
        return $this->accessLogs()
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function getRecentActivityLogs(int $limit = 50)
    {
        return $this->activityLogs()
            ->with(['district:id,nom_district'])
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function getActivityStats(): array
    {
        return [
            'total_actions' => $this->activityLogs()->count(),
            'documents_generated' => $this->activityLogs()
                ->where('entity_type', ActivityLog::ENTITY_DOCUMENT)
                ->where('action', ActivityLog::ACTION_GENERATE)
                ->count(),
            'documents_downloaded' => $this->activityLogs()
                ->where('entity_type', ActivityLog::ENTITY_DOCUMENT)
                ->where('action', ActivityLog::ACTION_DOWNLOAD)
                ->count(),
            'last_activity' => $this->activityLogs()->latest()->first()?->created_at,
        ];
    }

    // ============ MÉTHODES UTILITAIRES ============
    
    public function canLogin(): bool
    {
        if (!$this->status) {
            return false;
        }

        if (in_array($this->role, [self::ROLE_ADMIN_DISTRICT, self::ROLE_USER_DISTRICT])) {
            return $this->id_district !== null;
        }

        return true;
    }

    public function getStats(): array
    {
        return [
            'dossiers_created' => $this->dossiers()->count(),
            'proprietes_created' => $this->proprietes()->count(),
            'demandeurs_created' => $this->demandeurs()->count(),
            'last_access' => $this->accessLogs()->latest()->first()?->created_at,
            'total_actions' => $this->accessLogs()->count(),
        ];
    }

    public function deactivate(): bool
    {
        return $this->update(['status' => false]);
    }

    public function activate(): bool
    {
        return $this->update(['status' => true]);
    }

    public function toggleStatus(): bool
    {
        return $this->update(['status' => !$this->status]);
    }

    // ============ VALIDATION HELPERS ============
    
    public function hasValidRoleDistrictCombination(): bool
    {
        if (in_array($this->role, [self::ROLE_SUPER_ADMIN, self::ROLE_CENTRAL_USER])) {
            return $this->id_district === null;
        }

        if (in_array($this->role, [self::ROLE_ADMIN_DISTRICT, self::ROLE_USER_DISTRICT])) {
            return $this->id_district !== null;
        }

        return true;
    }

    public static function getAvailableRoles(?User $forUser = null): array
    {
        $allRoles = [
            self::ROLE_SUPER_ADMIN => 'Super Administrateur',
            self::ROLE_CENTRAL_USER => 'Utilisateur Central',
            self::ROLE_ADMIN_DISTRICT => 'Administrateur District',
            self::ROLE_USER_DISTRICT => 'Utilisateur District',
        ];

        if (!$forUser) {
            return $allRoles;
        }

        if ($forUser->isSuperAdmin()) {
            // Super admin ne peut créer que des admin_district
            return [
                self::ROLE_ADMIN_DISTRICT => 'Administrateur District',
            ];
        }

        if ($forUser->isAdminDistrict()) {
            // Admin district ne peut créer que des user_district
            return [
                self::ROLE_USER_DISTRICT => 'Utilisateur District',
            ];
        }

        return [];
    }

    public function getRoleLabel(): string
    {
        return $this->role_name;
    }
}