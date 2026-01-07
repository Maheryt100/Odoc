<?php

namespace App\Console\Commands;

use App\Models\DocumentGenere;
use App\Models\RecuPaiement;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Carbon\Carbon;

class OrganizeDocumentsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'documents:organize
                            {--dry-run : Afficher ce qui serait fait sans effectuer les modifications}
                            {--type= : Type de document à organiser (RECU,ADV,CSF,REQ)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Organise les documents existants par district et date';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $isDryRun = $this->option('dry-run');
        $filterType = $this->option('type');

        $this->info('Démarrage de l\'organisation des documents...');
        
        if ($isDryRun) {
            $this->warn('MODE DRY-RUN : Aucune modification ne sera effectuée');
        }

        if ($filterType) {
            $this->info("Filtrage par type : {$filterType}");
        }

        // Organiser les documents_generes
        $this->organizeDocumentsGeneres($isDryRun, $filterType);

        // Optionnel : Organiser les anciens reçus
        if (!$filterType || $filterType === 'RECU') {
            $this->organizeLegacyRecus($isDryRun);
        }

        $this->info('Organisation terminée !');
    }

    /**
     * Organiser les documents de la table documents_generes
     */
    private function organizeDocumentsGeneres(bool $isDryRun, ?string $filterType)
    {
        $this->info("\nOrganisation des documents générés...");

        $query = DocumentGenere::with(['propriete.dossier.district']);

        if ($filterType) {
            $query->where('type_document', $filterType);
        }

        $documents = $query->get();
        $this->info("{$documents->count()} documents à traiter");

        $bar = $this->output->createProgressBar($documents->count());
        $bar->start();

        $movedCount = 0;
        $errorCount = 0;

        foreach ($documents as $document) {
            try {
                $oldPath = $document->file_path;

                // Vérifier que le fichier existe
                if (!Storage::disk('public')->exists($oldPath)) {
                    $this->newLine();
                    $this->warn("Fichier introuvable : {$oldPath}");
                    $errorCount++;
                    $bar->advance();
                    continue;
                }

                // Vérifier que la propriété et le district existent
                if (!$document->propriete || !$document->propriete->dossier || !$document->propriete->dossier->district) {
                    $this->newLine();
                    $this->warn("Données incomplètes pour le document ID {$document->id}");
                    $errorCount++;
                    $bar->advance();
                    continue;
                }

                // Construire le nouveau chemin
                $newPath = $this->buildNewPath($document);

                // Si le chemin est déjà correct, passer
                if ($oldPath === $newPath) {
                    $bar->advance();
                    continue;
                }

                if (!$isDryRun) {
                    // Créer le répertoire de destination
                    $directory = dirname($newPath);
                    Storage::disk('public')->makeDirectory($directory);

                    // Déplacer le fichier
                    Storage::disk('public')->move($oldPath, $newPath);

                    // Mettre à jour la base de données
                    $document->update([
                        'file_path' => $newPath,
                        'nom_fichier' => basename($newPath)
                    ]);

                    $movedCount++;
                } else {
                    $this->newLine();
                    $this->line("{$oldPath} → {$newPath}");
                    $movedCount++;
                }

            } catch (\Exception $e) {
                $this->newLine();
                $this->error("Erreur pour le document ID {$document->id} : {$e->getMessage()}");
                $errorCount++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("{$movedCount} fichiers " . ($isDryRun ? 'seraient déplacés' : 'déplacés'));
        if ($errorCount > 0) {
            $this->warn("{$errorCount} erreurs rencontrées");
        }
    }

    /**
     * Organiser les anciens reçus de la table recu_paiements
     */
    private function organizeLegacyRecus(bool $isDryRun)
    {
        $this->info("\nOrganisation des anciens reçus...");

        $recus = RecuPaiement::with(['propriete.dossier.district', 'demandeur'])
            ->whereNotNull('file_path')
            ->get();

        $this->info("{$recus->count()} anciens reçus à traiter");

        if ($recus->isEmpty()) {
            $this->info("Aucun ancien reçu à organiser");
            return;
        }

        $bar = $this->output->createProgressBar($recus->count());
        $bar->start();

        $movedCount = 0;
        $errorCount = 0;

        foreach ($recus as $recu) {
            try {
                $oldPath = $recu->file_path;

                if (!Storage::disk('public')->exists($oldPath)) {
                    $bar->advance();
                    continue;
                }

                if (!$recu->propriete || !$recu->propriete->dossier || !$recu->propriete->dossier->district) {
                    $errorCount++;
                    $bar->advance();
                    continue;
                }

                $district = $recu->propriete->dossier->district;
                $districtSlug = Str::slug($district->nom_district);
                $dateRecu = Carbon::parse($recu->date_recu);
                $date = $dateRecu->format('Y/m');
                $timestamp = $dateRecu->format('Ymd_His');
                
                $nomDemandeur = $recu->demandeur ? Str::slug($recu->demandeur->nom_demandeur) : 'DEMANDEUR';
                $baseName = "{$timestamp}_RECU_{$nomDemandeur}_LOT{$recu->propriete->lot}.docx";
                
                $newPath = "pieces_jointes/documents/RECU/{$districtSlug}/{$date}/{$baseName}";

                if ($oldPath === $newPath) {
                    $bar->advance();
                    continue;
                }

                if (!$isDryRun) {
                    $directory = dirname($newPath);
                    Storage::disk('public')->makeDirectory($directory);
                    Storage::disk('public')->move($oldPath, $newPath);
                    $recu->update(['file_path' => $newPath]);
                    $movedCount++;
                }

            } catch (\Exception $e) {
                $errorCount++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("{$movedCount} anciens reçus " . ($isDryRun ? 'seraient déplacés' : 'déplacés'));
        if ($errorCount > 0) {
            $this->warn("{$errorCount} erreurs rencontrées");
        }
    }

    /**
     * Construire le nouveau chemin pour un document
     */
    private function buildNewPath(DocumentGenere $document): string
    {
        $propriete = $document->propriete;
        $district = $propriete->dossier->district;
        $districtSlug = Str::slug($district->nom_district);
        
        $date = $document->generated_at->format('Y/m');
        $timestamp = $document->generated_at->format('Ymd_His');
        
        $baseName = '';
        
        switch ($document->type_document) {
            case 'RECU':
                $nomDemandeur = $document->demandeur ? Str::slug($document->demandeur->nom_demandeur) : 'DEMANDEUR';
                $baseName = "{$timestamp}_RECU_{$nomDemandeur}_LOT{$propriete->lot}.docx";
                break;
                
            case 'ADV':
                $nomDemandeur = $document->demandeur ? Str::slug($document->demandeur->nom_demandeur) : 'CONSORTS';
                $baseName = "{$timestamp}_ADV_{$nomDemandeur}_LOT{$propriete->lot}.docx";
                break;
                
            case 'CSF':
                $nomDemandeur = $document->demandeur ? Str::slug($document->demandeur->nom_demandeur) : 'DEMANDEUR';
                $baseName = "{$timestamp}_CSF_{$nomDemandeur}_LOT{$propriete->lot}.docx";
                break;
                
            case 'REQ':
                $baseName = "{$timestamp}_REQ_LOT{$propriete->lot}_TN{$propriete->titre}.docx";
                break;
        }
        
        return "pieces_jointes/documents/{$document->type_document}/{$districtSlug}/{$date}/{$baseName}";
    }
}