<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Log};
use Inertia\Inertia;

class TopoFluxController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $districtId = $user->id_district;
        
        $status = $request->get('status', 'PENDING');
        $entityType = $request->get('entity_type');
        
        Log::info('TopoFlux index', [
            'user' => $user->name,
            'district' => $districtId,
            'status' => $status
        ]);
        
        $imports = [];
        
        // Récupérer demandeurs staging
        if (!$entityType || $entityType === 'demandeur') {
            $demandeurs = DB::table('topo_staging_demandeurs')
                ->where('target_district_id', $districtId)
                ->where('status', $status)
                ->orderBy('created_at', 'desc')
                ->get();
            
            foreach ($demandeurs as $d) {
                $filesCount = DB::table('topo_staging_files')
                    ->where('demandeur_id', $d->id)
                    ->count();
                
                $imports[] = [
                    'id' => $d->id,
                    'entity_type' => 'demandeur',
                    'batch_id' => $d->batch_id,
                    'status' => $d->status,
                    'target_dossier_id' => $d->target_dossier_id,
                    'target_district_id' => $d->target_district_id,
                    'topo_user_name' => $d->topo_user_name,
                    'created_at' => $d->created_at,
                    'files_count' => $filesCount,
                    'payload' => json_decode($d->payload, true)
                ];
            }
        }
        
        // Récupérer propriétés staging
        if (!$entityType || $entityType === 'propriete') {
            $proprietes = DB::table('topo_staging_proprietes')
                ->where('target_district_id', $districtId)
                ->where('status', $status)
                ->orderBy('created_at', 'desc')
                ->get();
            
            foreach ($proprietes as $p) {
                $filesCount = DB::table('topo_staging_files')
                    ->where('propriete_id', $p->id)
                    ->count();
                
                $imports[] = [
                    'id' => $p->id,
                    'entity_type' => 'propriete',
                    'batch_id' => $p->batch_id,
                    'status' => $p->status,
                    'target_dossier_id' => $p->target_dossier_id,
                    'target_district_id' => $p->target_district_id,
                    'topo_user_name' => $p->topo_user_name,
                    'created_at' => $p->created_at,
                    'files_count' => $filesCount,
                    'payload' => json_decode($p->payload, true)
                ];
            }
        }
        
        // Trier par date
        usort($imports, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
        
        $stats = [
            'total' => count($imports),
            'pending' => DB::table('topo_staging_demandeurs')
                ->where('target_district_id', $districtId)
                ->where('status', 'PENDING')
                ->count() +
                DB::table('topo_staging_proprietes')
                ->where('target_district_id', $districtId)
                ->where('status', 'PENDING')
                ->count()
        ];
        
        return Inertia::render('TopoFlux/Index', [
            'imports' => $imports,
            'stats' => $stats,
            'filters' => [
                'status' => $status,
                'entity_type' => $entityType
            ]
        ]);
    }
    
    public function show(Request $request, string $entityType, int $id)
    {
        $user = $request->user();
        
        if ($entityType === 'demandeur') {
            $staging = DB::table('topo_staging_demandeurs')
                ->where('id', $id)
                ->where('target_district_id', $user->id_district)
                ->first();
            
            if (!$staging) {
                return back()->with('error', 'Import introuvable');
            }
            
            $files = DB::table('topo_staging_files')
                ->where('demandeur_id', $id)
                ->get();
            
        } elseif ($entityType === 'propriete') {
            $staging = DB::table('topo_staging_proprietes')
                ->where('id', $id)
                ->where('target_district_id', $user->id_district)
                ->first();
            
            if (!$staging) {
                return back()->with('error', 'Import introuvable');
            }
            
            $files = DB::table('topo_staging_files')
                ->where('propriete_id', $id)
                ->get();
        } else {
            return back()->with('error', 'Type invalide');
        }
        
        $import = [
            'id' => $staging->id,
            'entity_type' => $entityType,
            'batch_id' => $staging->batch_id,
            'status' => $staging->status,
            'target_dossier_id' => $staging->target_dossier_id,
            'target_district_id' => $staging->target_district_id,
            'topo_user_name' => $staging->topo_user_name,
            'created_at' => $staging->created_at,
            'payload' => json_decode($staging->payload, true),
            'error_reason' => $staging->error_reason
        ];
        
        return Inertia::render('TopoFlux/Show', [
            'import' => $import,
            'files' => $files
        ]);
    }
    
    public function reject(Request $request, string $entityType, int $id)
    {
        $request->validate([
            'error_reason' => 'required|string|min:10'
        ]);
        
        $user = $request->user();
        $table = $entityType === 'demandeur' 
            ? 'topo_staging_demandeurs' 
            : 'topo_staging_proprietes';
        
        $updated = DB::table($table)
            ->where('id', $id)
            ->where('target_district_id', $user->id_district)
            ->update([
                'status' => 'REJECTED',
                'error_reason' => $request->error_reason,
                'validated_at' => now(),
                'validated_by' => $user->id
            ]);
        
        if (!$updated) {
            return back()->with('error', 'Import introuvable');
        }
        
        Log::info('Import rejeté', [
            'entity_type' => $entityType,
            'id' => $id,
            'user' => $user->name,
            'reason' => $request->error_reason
        ]);
        
        return redirect()
            ->route('topo-flux.index')
            ->with('success', 'Import rejeté');
    }
}