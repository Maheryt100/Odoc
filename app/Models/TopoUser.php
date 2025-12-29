<?php

// ============================================
// app/Models/TopoUser.php (Optionnel)
// ============================================

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TopoUser extends Model
{
    protected $table = 'topo_users';
    
    protected $fillable = [
        'username',
        'email',
        'full_name',
        'password_hash',
        'role',
        'is_active',
        'linked_geodoc_user_id',
        'allowed_districts',
        'last_token_refresh'
    ];
    
    protected $casts = [
        'is_active' => 'boolean',
        'allowed_districts' => 'array',
        'last_token_refresh' => 'datetime'
    ];
    
    protected $hidden = [
        'password_hash'
    ];
    
    public function linkedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'linked_geodoc_user_id');
    }
    
    public function isActive(): bool
    {
        return $this->is_active;
    }
    
    public function hasDistrictAccess(int $districtId): bool
    {
        if ($this->allowed_districts === null) {
            return true; // Accès à tous les districts
        }
        
        return in_array($districtId, $this->allowed_districts);
    }
}