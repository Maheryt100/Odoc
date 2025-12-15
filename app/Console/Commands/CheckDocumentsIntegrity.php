<?php

namespace App\Console\Commands;

use App\Models\DocumentGenere;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckDocumentsIntegrity extends Command
{
    protected $signature = 'documents:check-integrity 
                          {--fix : Marquer les documents manquants pour régénération}
                          {--type= : Type de document (RECU, ADV, CSF, REQ)}';

    protected $description = 'Vérifier l\'intégrité des fichiers de documents générés';

    public function handle()
    {
        $this->info('🔍 Vérification de l\'intégrité des documents...');

        $query = DocumentGenere::where('status', DocumentGenere::STATUS_ACTIVE);

        if ($type = $this->option('type')) {
            $query->where('type_document', strtoupper($type));
        }

        $documents = $query->get();
        $this->info("📊 Total de documents à vérifier : {$documents->count()}");

        $missing = [];
        $corrupted = [];
        $valid = 0;

        $bar = $this->output->createProgressBar($documents->count());
        $bar->start();

        foreach ($documents as $document) {
            $status = $document->checkFileStatus();
            
            if (!$status['exists']) {
                $missing[] = [
                    'id' => $document->id,
                    'type' => $document->type_document,
                    'path' => $document->file_path,
                    'error' => $status['error'],
                ];
            } elseif (!$status['valid']) {
                $corrupted[] = [
                    'id' => $document->id,
                    'type' => $document->type_document,
                    'path' => $document->file_path,
                    'error' => $status['error'],
                ];
            } else {
                $valid++;
            }
            
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Afficher les résultats
        $this->table(
            ['Statut', 'Nombre', 'Pourcentage'],
            [
                [
                    '✅ Valides', 
                    $valid, 
                    round(($valid / $documents->count()) * 100, 2) . '%'
                ],
                [
                    '❌ Manquants', 
                    count($missing), 
                    round((count($missing) / $documents->count()) * 100, 2) . '%'
                ],
                [
                    '⚠️  Corrompus', 
                    count($corrupted), 
                    round((count($corrupted) / $documents->count()) * 100, 2) . '%'
                ],
            ]
        );

        // Détails des problèmes
        if (count($missing) > 0) {
            $this->warn("\n📁 Documents manquants :");
            foreach (array_slice($missing, 0, 10) as $doc) {
                $this->line("  • ID {$doc['id']} ({$doc['type']}): {$doc['error']}");
            }
            if (count($missing) > 10) {
                $this->line("  ... et " . (count($missing) - 10) . " autres");
            }
        }

        if (count($corrupted) > 0) {
            $this->warn("\n⚠️  Documents corrompus :");
            foreach (array_slice($corrupted, 0, 10) as $doc) {
                $this->line("  • ID {$doc['id']} ({$doc['type']}): {$doc['error']}");
            }
            if (count($corrupted) > 10) {
                $this->line("  ... et " . (count($corrupted) - 10) . " autres");
            }
        }

        // Option --fix
        if ($this->option('fix') && (count($missing) > 0 || count($corrupted) > 0)) {
            $this->newLine();
            if ($this->confirm('Marquer ces documents pour régénération ?')) {
                $marked = 0;
                
                foreach ([...$missing, ...$corrupted] as $docInfo) {
                    $document = DocumentGenere::find($docInfo['id']);
                    if ($document) {
                        $document->markForRegeneration($docInfo['error']);
                        $marked++;
                    }
                }
                
                $this->info("✅ {$marked} documents marqués pour régénération");
            }
        }

        return 0;
    }
}