<?php
// ============================================
// app/Services/TopoImportProcessor.php
// VERSION CORRIGÉE AVEC LOGS DÉTAILLÉS
// ============================================

namespace App\Services;

use App\Models\{Demandeur, Propriete, PieceJointe, TopoImportCache, Dossier};
use Illuminate\Support\Facades\{DB, Storage, Log};
use Exception;

class TopoImportProcessor
{
    public function __construct(
        private FastApiService $fastApi
    ) {}
    
    // ========================================
    // TRAITEMENT PRINCIPAL
    // ========================================
    
    public function processImport(int $importId, int $userId): array
    {
        DB::beginTransaction();
        
        try {
            Log::info("🔄 Début traitement import #{$importId}", ['user_id' => $userId]);
            
            // Vérifier si déjà traité
            $cache = TopoImportCache::where('fastapi_import_id', $importId)->first();
            
            if ($cache && $cache->status === 'validated') {
                Log::warning("⚠️ Import #{$importId} déjà traité");
                throw new Exception("Import déjà traité (ID: {$importId})");
            }
            
            // Récupérer l'import complet depuis FastAPI
            $response = $this->fastApi->getImport($importId);
            
            if (!$response || !isset($response['import'])) {
                Log::error("❌ Import #{$importId} non trouvé dans FastAPI");
                throw new Exception("Import {$importId} non trouvé dans FastAPI");
            }
            
            $importData = $response['import'];
            $files = $response['files'] ?? [];
            
            Log::info("✅ Import récupéré depuis FastAPI", [
                'entity_type' => $importData['entity_type'],
                'dossier_id' => $importData['dossier_id'],
                'district_id' => $importData['district_id'],
                'files_count' => count($files)
            ]);
            
            // Vérifier que le dossier existe
            $dossier = Dossier::find($importData['dossier_id']);
            if (!$dossier) {
                throw new Exception("Dossier #{$importData['dossier_id']} introuvable");
            }
            
            Log::info("✅ Dossier validé", [
                'dossier_id' => $dossier->id,
                'nom' => $dossier->nom_dossier,
                'district_id' => $dossier->id_district
            ]);
            
            // Créer ou mettre à jour l'entité
            $entity = $this->createOrUpdateEntity($importData, $userId);
            
            Log::info("✅ Entité créée/mise à jour", [
                'entity_type' => $importData['entity_type'],
                'entity_id' => $entity->id,
                'entity_class' => get_class($entity)
            ]);
            
            // Transférer les fichiers
            $transferredFiles = $this->transferFiles($files, $entity);
            
            Log::info("✅ Fichiers transférés", ['count' => count($transferredFiles)]);
            
            // Nettoyer FastAPI
            $this->fastApi->cleanupFiles($importId);
            
            // Notifier FastAPI du succès
            $validated = $this->fastApi->validateImport($importId);
            
            if (!$validated) {
                Log::warning("⚠️ Échec notification FastAPI");
            }
            
            // Mettre le cache à jour
            TopoImportCache::updateOrCreate(
                ['fastapi_import_id' => $importId],
                [
                    'batch_id' => $importData['batch_id'],
                    'entity_type' => $importData['entity_type'],
                    'target_dossier_id' => $importData['dossier_id'],
                    'status' => 'validated'
                ]
            );
            
            DB::commit();
            
            Log::info("🎉 Import #{$importId} traité avec succès", [
                'entity_type' => $importData['entity_type'],
                'entity_id' => $entity->id,
                'files_transferred' => count($transferredFiles)
            ]);
            
            return [
                'success' => true,
                'entity' => $entity,
                'entity_type' => $importData['entity_type'],
                'entity_id' => $entity->id,
                'files_count' => count($transferredFiles)
            ];
            
        } catch (Exception $e) {
            DB::rollBack();
            
            Log::error("❌ Erreur traitement import #{$importId}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    // ========================================
    // CRÉATION ENTITÉS
    // ========================================
    
    private function createOrUpdateEntity(array $import, int $userId)
    {
        $data = $import['raw_data'];
        
        if ($import['entity_type'] === 'demandeur') {
            Log::info("🔍 Traitement DEMANDEUR", ['cin' => $data['cin']]);
            
            // Vérifier si le demandeur existe déjà
            $existing = Demandeur::where('cin', $data['cin'])->first();
            
            if ($existing) {
                Log::info("✅ Demandeur existant trouvé", [
                    'cin' => $data['cin'],
                    'demandeur_id' => $existing->id
                ]);
                
                // Mettre à jour si nécessaire
                $existing->update([
                    'telephone' => $data['telephone'] ?? $existing->telephone,
                    'domiciliation' => $data['domiciliation'] ?? $existing->domiciliation,
                ]);
                
                // Lier au nouveau dossier si pas déjà lié
                if (!$existing->dossiers()->where('dossiers.id', $import['dossier_id'])->exists()) {
                    $existing->dossiers()->attach($import['dossier_id']);
                    Log::info("🔗 Demandeur lié au dossier #{$import['dossier_id']}");
                }
                
                return $existing;
            }
            
            // Créer nouveau demandeur
            $demandeur = Demandeur::create([
                'cin' => $data['cin'],
                'titre_demandeur' => $data['titre_demandeur'] ?? 'Mr',
                'nom_demandeur' => $data['nom_demandeur'],
                'prenom_demandeur' => $data['prenom_demandeur'] ?? null,
                'date_naissance' => $data['date_naissance'],
                'lieu_naissance' => $data['lieu_naissance'] ?? null,
                'sexe' => $data['sexe'] ?? null,
                'occupation' => $data['occupation'] ?? null,
                'nom_pere' => $data['nom_pere'] ?? null,
                'nom_mere' => $data['nom_mere'] ?? null,
                'date_delivrance' => $data['date_delivrance'] ?? null,
                'lieu_delivrance' => $data['lieu_delivrance'] ?? null,
                'date_delivrance_duplicata' => $data['date_delivrance_duplicata'] ?? null,
                'lieu_delivrance_duplicata' => $data['lieu_delivrance_duplicata'] ?? null,
                'domiciliation' => $data['domiciliation'] ?? null,
                'situation_familiale' => $data['situation_familiale'] ?? 'Non spécifiée',
                'regime_matrimoniale' => $data['regime_matrimoniale'] ?? null,
                'nationalite' => $data['nationalite'] ?? 'Malagasy',
                'telephone' => $data['telephone'] ?? null,
                'date_mariage' => $data['date_mariage'] ?? null,
                'lieu_mariage' => $data['lieu_mariage'] ?? null,
                'marie_a' => $data['marie_a'] ?? null,
                'id_user' => $userId
            ]);
            
            // Lier au dossier
            $demandeur->dossiers()->attach($import['dossier_id']);
            
            Log::info("✅ Nouveau demandeur créé", [
                'cin' => $data['cin'],
                'demandeur_id' => $demandeur->id,
                'dossier_id' => $import['dossier_id']
            ]);
            
            return $demandeur;
        }
        
        // Propriété
        Log::info("🔍 Traitement PROPRIÉTÉ", ['lot' => $data['lot']]);
        
        // Vérifier si la propriété existe déjà dans ce dossier
        $existing = Propriete::where('lot', $data['lot'])
            ->where('id_dossier', $import['dossier_id'])
            ->first();
        
        if ($existing) {
            Log::warning("⚠️ Propriété existante dans ce dossier", [
                'lot' => $data['lot'],
                'propriete_id' => $existing->id
            ]);
            
            // Mettre à jour
            $existing->update([
                'contenance' => $data['contenance'] ?? $existing->contenance,
                'situation' => $data['situation'] ?? $existing->situation,
            ]);
            
            return $existing;
        }
        
        $propriete = Propriete::create([
            'lot' => $data['lot'],
            'type_operation' => $data['type_operation'] ?? 'immatriculation',
            'nature' => $data['nature'],
            'vocation' => $data['vocation'] ?? null,
            'proprietaire' => $data['proprietaire'] ?? null,
            'titre' => $data['titre'] ?? null,
            'titre_mere' => $data['titre_mere'] ?? null,
            'propriete_mere' => $data['propriete_mere'] ?? null,
            'contenance' => $data['contenance'] ?? null,
            'situation' => $data['situation'] ?? null,
            'charge' => $data['charge'] ?? null,
            'numero_FN' => $data['numero_FN'] ?? null,
            'numero_requisition' => $data['numero_requisition'] ?? null,
            'date_requisition' => $data['date_requisition'] ?? null,
            'date_depot_1' => $data['date_depot_1'] ?? null,
            'date_depot_2' => $data['date_depot_2'] ?? null,
            'date_approbation_acte' => $data['date_approbation_acte'] ?? null,
            'dep_vol_inscription' => $data['dep_vol_inscription'] ?? null,
            'numero_dep_vol_inscription' => $data['numero_dep_vol_inscription'] ?? null,
            'dep_vol_requisition' => $data['dep_vol_requisition'] ?? null,
            'numero_dep_vol_requisition' => $data['numero_dep_vol_requisition'] ?? null,
            'dep_vol' => $data['dep_vol'] ?? null,
            'numero_dep_vol' => $data['numero_dep_vol'] ?? null,
            'id_dossier' => $import['dossier_id'],
            'id_user' => $userId
        ]);
        
        Log::info("✅ Nouvelle propriété créée", [
            'lot' => $data['lot'],
            'propriete_id' => $propriete->id,
            'dossier_id' => $import['dossier_id']
        ]);
        
        return $propriete;
    }
    
    // ========================================
    // TRANSFERT FICHIERS
    // ========================================
    
    private function transferFiles(array $files, $entity): array
    {
        $transferred = [];
        
        foreach ($files as $fileInfo) {
            try {
                if (!isset($fileInfo['id'])) {
                    Log::warning("⚠️ Fichier sans ID ignoré", ['file_info' => $fileInfo]);
                    continue;
                }
                
                // Télécharger depuis FastAPI
                $fileData = $this->fastApi->downloadFile($fileInfo['id']);
                
                if (!$fileData) {
                    Log::warning("⚠️ Téléchargement échoué", ['file_id' => $fileInfo['id']]);
                    continue;
                }
                
                // Sauvegarder dans GeODOC
                $pieceJointe = $this->saveFile($fileData, $entity);
                $transferred[] = $pieceJointe;
                
                Log::info("✅ Fichier transféré", [
                    'file_name' => $fileData['filename'],
                    'piece_jointe_id' => $pieceJointe->id
                ]);
                
            } catch (Exception $e) {
                Log::error("❌ Erreur transfert fichier", [
                    'file_id' => $fileInfo['id'] ?? 'unknown',
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        return $transferred;
    }
    
    private function saveFile(array $fileData, $entity): PieceJointe
    {
        $timestamp = now()->format('YmdHis');
        $hash = substr(md5($fileData['filename'] . time()), 0, 8);
        $extension = pathinfo($fileData['filename'], PATHINFO_EXTENSION);
        $filename = "{$timestamp}_{$hash}_{$fileData['filename']}";
        
        $entityType = class_basename($entity);
        $entityId = $entity->id;
        
        $path = "pieces_jointes/{$entityType}s/{$entityId}/{$filename}";
        
        // Sauvegarder le fichier
        Storage::disk('public')->put($path, $fileData['content']);
        
        // Récupérer l'ID du dossier
        $dossierId = null;
        if ($entity instanceof Demandeur) {
            $dossierId = $entity->dossiers()->first()?->id;
        } elseif ($entity instanceof Propriete) {
            $dossierId = $entity->id_dossier;
        }
        
        // Créer l'enregistrement
        return PieceJointe::create([
            'attachable_type' => get_class($entity),
            'attachable_id' => $entityId,
            'nom_original' => $fileData['filename'],
            'nom_fichier' => $filename,
            'chemin' => $path,
            'type_mime' => $fileData['mime_type'],
            'taille' => strlen($fileData['content']),
            'extension' => $extension,
            'categorie' => 'import_topo',
            'id_dossier' => $dossierId,
            'id_user' => auth()->id()
        ]);
    }
}