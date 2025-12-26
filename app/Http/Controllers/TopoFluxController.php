<?php
// app/Http/Controllers/TopoFluxController.php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\TopoImport;
use App\Models\TopoFile;
use App\Models\Propriete;
use App\Models\Demandeur;
use App\Models\Dossier;
use App\Models\PieceJointe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Spatie\Activitylog\Facades\Activity;

class TopoFluxController extends Controller
{
    /**
     * Page principale - Liste des imports en attente
     */
    public function index(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Filtres
        $status = $request->input('status', 'pending');
        $entityType = $request->input('entity_type');
        $dossierId = $request->input('dossier_id');
        
        // Query de base
        $query = TopoImport::with(['dossier', 'district', 'processedBy'])
            ->orderBy('import_date', 'desc');
        
        // Filtrage par district selon rôle
        if (!$user->isSuperAdmin() && !$user->isCentralUser()) {
            $query->where('target_district_id', $user->id_district);
        }
        
        // Filtres utilisateur
        if ($status) {
            $query->where('status', $status);
        }
        
        if ($entityType) {
            $query->where('entity_type', $entityType);
        }
        
        if ($dossierId) {
            $query->where('target_dossier_id', $dossierId);
        }
        
        // Pagination
        $imports = $query->paginate(20)->withQueryString();
        
        // Enrichir avec comptage fichiers
        $imports->getCollection()->transform(function ($import) {
            $import->files_count = TopoFile::where('import_id', $import->id)->count();
            return $import;
        });
        
        // Statistiques
        $stats = $this->getStatsData($user);
        
        return Inertia::render('TopoFlux/Index', [
            'imports' => $imports,
            'stats' => $stats,
            'filters' => [
                'status' => $status,
                'entity_type' => $entityType,
                'dossier_id' => $dossierId
            ]
        ]);
    }
    
    /**
     * Détails d'un import spécifique
     */
    public function show($importId)
    {
        /** @var User $user */
        $user = Auth::user();
        
        $import = TopoImport::with(['dossier', 'district', 'files', 'processedBy'])
            ->findOrFail($importId);
        
        // Vérifier permissions district
        if (!$user->isSuperAdmin() && !$user->isCentralUser()) {
            if ($import->target_district_id != $user->id_district) {
                abort(403, 'Accès refusé à cet import');
            }
        }
        
        // Enrichir avec détails entité matchée
        $matchedEntity = null;
        if ($import->matched_entity_id) {
            if ($import->entity_type === 'propriete') {
                $matchedEntity = Propriete::find($import->matched_entity_id);
            } elseif ($import->entity_type === 'demandeur') {
                $matchedEntity = Demandeur::find($import->matched_entity_id);
            }
        }
        
        return Inertia::render('TopoFlux/Show', [
            'import' => $import,
            'matchedEntity' => $matchedEntity,
            'canValidate' => $user->isAdminDistrict() || $user->isUserDistrict()
        ]);
    }
    
    /**
     * Valider un import (créer l'entité dans GeODOC)
     */
    public function validateImport(Request $request, $importId)
    {
        /** @var User $user */
        $user = Auth::user();
        
        // Vérifier permissions
        if (!$user->isAdminDistrict() && !$user->isUserDistrict()) {
            return back()->with('error', 'Vous n\'avez pas les permissions pour valider');
        }
        
        $import = TopoImport::findOrFail($importId);
        
        // Vérifier district
        if ($import->target_district_id != $user->id_district) {
            return back()->with('error', 'Import hors de votre district');
        }
        
        // Vérifier statut
        if ($import->status !== 'pending') {
            return back()->with('error', 'Import déjà traité');
        }
        
        DB::beginTransaction();
        
        try {
            // Créer ou mettre à jour l'entité
            $rawData = $import->raw_data;
            
            if ($import->entity_type === 'propriete') {
                $this->processProprieteCreation($import, $rawData, $user);
            } elseif ($import->entity_type === 'demandeur') {
                $this->processDemandeurCreation($import, $rawData, $user);
            }
            
            // Marquer comme validé
            $import->update([
                'status' => 'validated',
                'processed_at' => now(),
                'processed_by' => $user->id
            ]);
            
            // Logger
            // Activity::causedBy($user)
            //     ->performedOn($import)
            //     ->log("Import TopoManager validé et traité");
            
            DB::commit();
            
            return redirect()->route('topo-flux.index')
                ->with('success', 'Import validé et intégré avec succès');
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()->with('error', 'Erreur lors de la validation: ' . $e->getMessage());
        }
    }
    
    /**
     * Rejeter un import
     */
    public function rejectImport(Request $request, $importId)
    {
        /** @var User $user */
        $user = Auth::user();
        
        $request->validate([
            'rejection_reason' => 'required|string|min:10'
        ]);
        
        $import = TopoImport::findOrFail($importId);
        
        // Vérifier permissions
        if (!$user->isAdminDistrict() && !$user->isUserDistrict()) {
            return back()->with('error', 'Permissions insuffisantes');
        }
        
        if ($import->target_district_id != $user->id_district) {
            return back()->with('error', 'Import hors de votre district');
        }
        
        $import->update([
            'status' => 'rejected',
            'processed_at' => now(),
            'processed_by' => $user->id,
            'rejection_reason' => $request->rejection_reason
        ]);
        
        // Activity::causedBy($user)
        //     ->performedOn($import)
        //     ->withProperties(['reason' => $request->rejection_reason])
        //     ->log("Import TopoManager rejeté");
        
        return redirect()->route('topo-flux.index')
            ->with('success', 'Import rejeté');
    }
    
    /**
     * Ouvrir formulaire pré-rempli pour propriété
     */
    public function openProprieteForm($importId)
    {
        $import = TopoImport::findOrFail($importId);
        
        if ($import->entity_type !== 'propriete') {
            return back()->with('error', 'Cet import n\'est pas une propriété');
        }
        
        $rawData = $import->raw_data;
        $dossier = $import->dossier;
        
        // Rediriger vers formulaire création/édition
        if ($import->action_suggested === 'update' && $import->matched_entity_id) {
            return redirect()->route('proprietes.edit', $import->matched_entity_id)
                ->with('topo_data', $rawData);
        } else {
            return redirect()->route('proprietes.create', $dossier->id)
                ->with('topo_data', $rawData);
        }
    }
    
    /**
     * Ouvrir formulaire pré-rempli pour demandeur
     */
    public function openDemandeurForm($importId)
    {
        $import = TopoImport::findOrFail($importId);
        
        if ($import->entity_type !== 'demandeur') {
            return back()->with('error', 'Cet import n\'est pas un demandeur');
        }
        
        $rawData = $import->raw_data;
        $dossier = $import->dossier;
        
        if ($import->action_suggested === 'update' && $import->matched_entity_id) {
            return redirect()->route('demandeurs.edit', $import->matched_entity_id)
                ->with('topo_data', $rawData);
        } else {
            return redirect()->route('demandeurs.create', $dossier->id)
                ->with('topo_data', $rawData);
        }
    }
    
    /**
     * Télécharger un fichier temporaire
     */
    public function downloadFile($fileId)
    {
        $file = TopoFile::findOrFail($fileId);
        $import = TopoImport::findOrFail($file->import_id);
        
        /** @var User $user */
        $user = Auth::user();
        
        // Vérifier permissions
        if (!$user->isSuperAdmin() && !$user->isCentralUser()) {
            if ($import->target_district_id != $user->id_district) {
                abort(403);
            }
        }
        
        // Télécharger le fichier
        if (file_exists($file->storage_path)) {
            return response()->download($file->storage_path, $file->original_name);
        }
        
        abort(404, 'Fichier introuvable');
    }
    
    /**
     * Prévisualiser une image
     */
    public function previewFile($fileId)
    {
        $file = TopoFile::findOrFail($fileId);
        $import = TopoImport::findOrFail($file->import_id);
        
        /** @var User $user */
        $user = Auth::user();
        
        // Vérifier permissions
        if (!$user->isSuperAdmin() && !$user->isCentralUser()) {
            if ($import->target_district_id != $user->id_district) {
                abort(403);
            }
        }
        
        // Vérifier que c'est une image
        if (!in_array($file->file_extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            abort(400, 'Pas une image');
        }
        
        if (file_exists($file->storage_path)) {
            return response()->file($file->storage_path);
        }
        
        abort(404);
    }
    
    /**
     * Statistiques globales
     */
    public function getStats()
    {
        $user = Auth::user();
        
        return response()->json($this->getStatsData($user));
    }
    
    // ============================================
    // MÉTHODES PRIVÉES
    // ============================================
    
    private function getStatsData($user)
    {
        $query = DB::table('topo_imports');
        
        if (!$user->isSuperAdmin() && !$user->isCentralUser()) {
            $query->where('target_district_id', $user->id_district);
        }
        
        return [
            'total' => (clone $query)->count(),
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'validated' => (clone $query)->where('status', 'validated')->count(),
            'rejected' => (clone $query)->where('status', 'rejected')->count(),
            'with_warnings' => (clone $query)->where('has_warnings', true)->count(),
        ];
    }
    
    private function processProprieteCreation($import, $rawData, $user)
    {
        $dossier = $import->dossier;
        
        if ($import->action_suggested === 'update' && $import->matched_entity_id) {
            // Mise à jour
            $propriete = Propriete::findOrFail($import->matched_entity_id);
            $propriete->update(array_merge($rawData, [
                'id_user' => $user->id
            ]));
        } else {
            // Création
            $propriete = Propriete::create(array_merge($rawData, [
                'id_dossier' => $dossier->id,
                'id_user' => $user->id
            ]));
        }
        
        // Transférer les fichiers vers pièces jointes
        $this->transferFilesToPiecesJointes($import, 'App\Models\Propriete', $propriete->id);
        
        return $propriete;
    }
    
    private function processDemandeurCreation($import, $rawData, $user)
    {
        if ($import->action_suggested === 'update' && $import->matched_entity_id) {
            // Mise à jour
            $demandeur = Demandeur::findOrFail($import->matched_entity_id);
            $demandeur->update(array_merge($rawData, [
                'id_user' => $user->id
            ]));
        } else {
            // Création
            $demandeur = Demandeur::create(array_merge($rawData, [
                'id_user' => $user->id
            ]));
            
            // Lier au dossier via table contenir
            DB::table('contenir')->insert([
                'id_dossier' => $import->target_dossier_id,
                'id_demandeur' => $demandeur->id,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
        
        // Transférer fichiers
        $this->transferFilesToPiecesJointes($import, 'App\Models\Demandeur', $demandeur->id);
        
        return $demandeur;
    }
    
    private function transferFilesToPiecesJointes($import, $attachableType, $attachableId)
    {
        $files = TopoFile::where('import_id', $import->id)->get();
        
        foreach ($files as $file) {
            // Copier le fichier vers storage définitif
            $newPath = "pieces_jointes/" . date('Y/m/') . $file->stored_name;
            $fullNewPath = storage_path('app/' . $newPath);
            
            // Créer répertoires si nécessaire
            if (!file_exists(dirname($fullNewPath))) {
                mkdir(dirname($fullNewPath), 0755, true);
            }
            
            // Copier fichier
            copy($file->storage_path, $fullNewPath);
            
            // Créer pièce jointe
            PieceJointe::create([
                'attachable_type' => $attachableType,
                'attachable_id' => $attachableId,
                'nom_original' => $file->original_name,
                'nom_fichier' => $file->stored_name,
                'chemin' => $newPath,
                'type_mime' => $file->mime_type,
                'taille' => $file->file_size,
                'extension' => $file->file_extension,
                'categorie' => $file->category,
                'type_document' => $file->category,
                'description' => $file->description,
                'id_user' => Auth::id(),
                'id_district' => $import->target_district_id
            ]);
        }
    }
}