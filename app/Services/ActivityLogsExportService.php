<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\SystemSettings;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Carbon\Carbon;

class ActivityLogsExportService
{
    private const EXPORT_PATH = 'pieces_jointes/logs';
    private const MAX_AUTO_ARCHIVES = 12; // Garder 1 an d'archives automatiques

    /**
     * Exporter les logs vers Excel avec TOUTES les informations
     * 
     * @param bool $isAutoExport Export automatique ou manuel
     * @param Carbon|null $dateFrom Date de début (pour export manuel)
     * @param Carbon|null $dateTo Date de fin (pour export manuel)
     */
    public function export(
        bool $isAutoExport = false,
        ?Carbon $dateFrom = null,
        ?Carbon $dateTo = null,
        ?\Illuminate\Database\Eloquent\Collection $logs = null
    ): array {
        try {
            // Déterminer les logs à exporter
            if ($logs === null) {
                if ($isAutoExport) {
                    // Export automatique : logs de 91j à 180j (ou 2x rétention)
                    $logs = $this->getLogsForAutoExport();
                } elseif ($dateFrom && $dateTo) {
                    // Export manuel : période spécifiée
                    $logs = $this->getLogsForPeriod($dateFrom, $dateTo);
                } else {
                    // Fallback : tous les logs
                    $logs = ActivityLog::with(['user', 'district'])
                        ->orderBy('created_at', 'desc')
                        ->get();
                }
            }

            if ($logs->isEmpty()) {
                return [
                    'success' => false,
                    'error' => 'Aucun log à exporter pour cette période.',
                ];
            }

            // Générer le nom de fichier avec marqueur auto/manuel
            $filename = $this->generateFilename($isAutoExport, $dateFrom, $dateTo);

            // Créer le spreadsheet avec TOUTES les données
            $spreadsheet = $this->createDetailedSpreadsheet($logs, $isAutoExport);

            // Sauvegarder dans storage
            $path = $this->saveSpreadsheet($spreadsheet, $filename);

            // Mettre à jour la date d'export
            SystemSettings::updateLastExport();

            Log::info('Export des logs réussi', [
                'filename' => $filename,
                'count' => $logs->count(),
                'is_auto_export' => $isAutoExport,
                'size' => Storage::size($path),
                'period' => $dateFrom && $dateTo 
                    ? $dateFrom->format('Y-m-d') . ' to ' . $dateTo->format('Y-m-d')
                    : 'all',
            ]);

            return [
                'success' => true,
                'path' => $path,
                'filename' => $filename,
                'count' => $logs->count(),
                'size' => Storage::size($path),
                'url' => Storage::url($path),
                'is_auto_export' => $isAutoExport,
                'logs_ids' => $logs->pluck('id')->toArray(),
            ];

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'export des logs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'is_auto_export' => $isAutoExport,
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Obtenir les logs pour l'export automatique (91j à 180j dans le passé)
     */
    private function getLogsForAutoExport()
    {
        $retentionDays = SystemSettings::getRetentionDays();
        
        // De 91 jours à (rétention × 2) jours dans le passé
        $dateFrom = now()->subDays($retentionDays * 2);
        $dateTo = now()->subDays($retentionDays + 1);

        return ActivityLog::with(['user', 'district'])
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Obtenir les logs pour une période spécifique (export manuel)
     */
    private function getLogsForPeriod(Carbon $dateFrom, Carbon $dateTo)
    {
        return ActivityLog::with(['user', 'district'])
            ->whereBetween('created_at', [
                $dateFrom->startOfDay(),
                $dateTo->endOfDay()
            ])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Générer le nom de fichier avec marqueur auto/manuel
     */
    private function generateFilename(bool $isAutoExport, ?Carbon $dateFrom = null, ?Carbon $dateTo = null): string
    {
        $type = $isAutoExport ? 'auto' : 'manual';
        $date = now()->format('Y-m-d_His');
        
        if (!$isAutoExport && $dateFrom && $dateTo) {
            // Format : activity_logs_manual_2024-01-01_to_2024-01-31_20250115_140530.xlsx
            $period = $dateFrom->format('Y-m-d') . '_to_' . $dateTo->format('Y-m-d');
            return "activity_logs_{$type}_{$period}_{$date}.xlsx";
        }
        
        // Format : activity_logs_auto_20250115_140530.xlsx
        return "activity_logs_{$type}_{$date}.xlsx";
    }

    /**
     * Créer le spreadsheet avec TOUTES les informations détaillées
     */
    private function createDetailedSpreadsheet($logs, bool $isAutoExport): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Activity Logs');

        // En-têtes DÉTAILLÉS (20 colonnes)
        $headers = [
            'ID',
            'Date/Heure',
            'Utilisateur',
            'Email',
            'Rôle',
            'Action',
            'Action Label',
            'Type d\'entité',
            'Entité Label',
            'ID Entité',
            'Type Document',
            'District',
            'Détails Complets',
            'Métadonnées JSON',
            'IP',
            'Navigateur',
            'Créé le',
            'Mis à jour le',
            'User Agent Complet',
            'Metadata Formatées'
        ];

        // Style des en-têtes
        $sheet->fromArray($headers, null, 'A1');
        $headerRange = 'A1:T1';
        
        $headerColor = $isAutoExport ? '059669' : '4F46E5'; // Vert pour auto, Bleu pour manuel
        
        $sheet->getStyle($headerRange)->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $headerColor],
            ],
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 11,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000'],
                ],
            ],
        ]);

        // Hauteur de l'en-tête
        $sheet->getRowDimension(1)->setRowHeight(30);

        // Données COMPLÈTES
        $row = 2;
        foreach ($logs as $log) {
            $metadataFormatted = $this->formatMetadataForExcel($log->metadata);
            
            $sheet->fromArray([
                $log->id,
                $log->created_at->format('d/m/Y H:i:s'),
                $log->user->name ?? 'N/A',
                $log->user->email ?? 'N/A',
                $this->getRoleName($log->user->role ?? 'N/A'),
                $log->action,
                $log->action_label,
                $log->entity_type,
                $log->entity_label,
                $log->entity_id ?? 'N/A',
                $log->document_type ?? 'N/A',
                $log->district->nom_district ?? 'N/A',
                $log->details,
                json_encode($log->metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
                $log->ip_address ?? 'N/A',
                $this->formatUserAgent($log->user_agent),
                $log->created_at->format('d/m/Y H:i:s'),
                $log->updated_at->format('d/m/Y H:i:s'),
                $log->user_agent ?? 'N/A',
                $metadataFormatted,
            ], null, "A{$row}");

            // Style des lignes alternées
            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:T{$row}")->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'F9FAFB'],
                    ],
                ]);
            }

            // Wrap text pour les colonnes de texte long
            $sheet->getStyle("M{$row}")->getAlignment()->setWrapText(true);
            $sheet->getStyle("N{$row}")->getAlignment()->setWrapText(true);
            $sheet->getStyle("T{$row}")->getAlignment()->setWrapText(true);

            $row++;
        }

        // Auto-size des colonnes
        foreach (range('A', 'T') as $col) {
            if (in_array($col, ['M', 'N', 'T'])) {
                $sheet->getColumnDimension($col)->setWidth(50);
            } else {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
        }

        // Ajouter les feuilles supplémentaires
        $this->addStatsSheet($spreadsheet, $logs, $isAutoExport);
        $this->addMetadataDetailsSheet($spreadsheet, $logs);

        return $spreadsheet;
    }

    /**
     * Formater les métadonnées pour affichage lisible dans Excel
     */
    private function formatMetadataForExcel(?array $metadata): string
    {
        if (!$metadata || empty($metadata)) {
            return 'Aucune métadonnée';
        }

        $formatted = [];
        foreach ($metadata as $key => $value) {
            if (in_array($key, ['logged_at', 'logged_by'])) {
                continue;
            }
            
            $label = $this->formatMetadataKey($key);
            $val = $this->formatMetadataValue($value);
            $formatted[] = "{$label}: {$val}";
        }

        return !empty($formatted) ? implode("\n", $formatted) : 'Aucune métadonnée';
    }

    /**
     * Formater une clé de métadonnée
     */
    private function formatMetadataKey(string $key): string
    {
        $labels = [
            'lot' => 'Lot', 'titre' => 'Titre', 'numero_recu' => 'N° Reçu',
            'montant' => 'Montant', 'total_prix' => 'Prix Total',
            'document_type' => 'Type Document', 'has_consorts' => 'Consorts',
            'nb_demandeurs' => 'Nb Demandeurs', 'nom_dossier' => 'Nom Dossier',
            'numero_ouverture' => 'N° Ouverture', 'commune' => 'Commune',
            'type_commune' => 'Type Commune', 'circonscription' => 'Circonscription',
            'fokontany' => 'Fokontany', 'motif_fermeture' => 'Motif Fermeture',
            'date_fermeture' => 'Date Fermeture', 'contenance' => 'Superficie',
            'nature' => 'Nature', 'vocation' => 'Vocation',
            'proprietaire' => 'Propriétaire', 'situation' => 'Situation',
            'nom' => 'Nom', 'prenom' => 'Prénom', 'cin' => 'CIN',
            'domiciliation' => 'Domiciliation', 'user_name' => 'Nom Utilisateur',
            'user_email' => 'Email', 'user_role' => 'Rôle',
            'old_status' => 'Ancien Statut', 'new_status' => 'Nouveau Statut',
            'nom_fichier' => 'Fichier', 'taille' => 'Taille',
            'taille_formatee' => 'Taille', 'type_document' => 'Type',
            'attachable_type' => 'Attaché à',
        ];
        
        return $labels[$key] ?? ucwords(str_replace('_', ' ', $key));
    }

    /**
     * Formater une valeur de métadonnée
     */
    private function formatMetadataValue($value): string
    {
        if ($value === null || $value === '') return 'N/A';
        if (is_bool($value)) return $value ? 'Oui' : 'Non';
        if (is_numeric($value) && $value > 100) return number_format($value, 0, ',', ' ');
        if (is_array($value)) return json_encode($value, JSON_UNESCAPED_UNICODE);
        return (string) $value;
    }

    /**
     * Obtenir le nom du rôle
     */
    private function getRoleName(string $role): string
    {
        return match($role) {
            'super_admin' => 'Super Admin',
            'central_user' => 'Utilisateur Central',
            'admin_district' => 'Admin District',
            'user_district' => 'Utilisateur District',
            default => $role,
        };
    }

    /**
     * Ajouter une feuille de statistiques
     */
    private function addStatsSheet(Spreadsheet $spreadsheet, $logs, bool $isAutoExport): void
    {
        $statsSheet = $spreadsheet->createSheet();
        $statsSheet->setTitle('Statistiques');

        // Titre avec couleur selon type
        $title = $isAutoExport ? 'Statistiques - Archive Automatique' : 'Statistiques - Export Manuel';
        $statsSheet->setCellValue('A1', $title);
        $statsSheet->mergeCells('A1:B1');
        
        $titleColor = $isAutoExport ? '059669' : '4F46E5';
        $statsSheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => $titleColor]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $row = 3;

        // Statistiques générales
        $statsSheet->setCellValue("A{$row}", 'Type d\'export:');
        $statsSheet->setCellValue("B{$row}", $isAutoExport ? 'Automatique' : 'Manuel');
        $row++;

        $statsSheet->setCellValue("A{$row}", 'Total des actions:');
        $statsSheet->setCellValue("B{$row}", $logs->count());
        $row++;

        $statsSheet->setCellValue("A{$row}", 'Période:');
        $statsSheet->setCellValue("B{$row}", 
            ($logs->last()->created_at ?? now())->format('d/m/Y H:i') . ' - ' . 
            ($logs->first()->created_at ?? now())->format('d/m/Y H:i')
        );
        $row += 2;

        // Actions par type
        $statsSheet->setCellValue("A{$row}", 'Actions par type:');
        $statsSheet->getStyle("A{$row}")->getFont()->setBold(true);
        $row++;
        
        $actionCounts = $logs->groupBy('action')->map->count()->sortDesc();
        foreach ($actionCounts as $action => $count) {
            $statsSheet->setCellValue("A{$row}", $action);
            $statsSheet->setCellValue("B{$row}", $count);
            $row++;
        }

        $row += 2;

        // Top utilisateurs
        $statsSheet->setCellValue("A{$row}", 'Top 10 Utilisateurs:');
        $statsSheet->getStyle("A{$row}")->getFont()->setBold(true);
        $row++;
        
        $userCounts = $logs->groupBy('user.name')->map->count()->sortDesc()->take(10);
        foreach ($userCounts as $userName => $count) {
            $statsSheet->setCellValue("A{$row}", $userName ?? 'N/A');
            $statsSheet->setCellValue("B{$row}", $count);
            $row++;
        }

        $statsSheet->getColumnDimension('A')->setAutoSize(true);
        $statsSheet->getColumnDimension('B')->setAutoSize(true);
    }

    /**
     * Ajouter une feuille de détails des métadonnées
     */
    private function addMetadataDetailsSheet(Spreadsheet $spreadsheet, $logs): void
    {
        $metaSheet = $spreadsheet->createSheet();
        $metaSheet->setTitle('Détails Métadonnées');

        $metaSheet->fromArray(['ID Log', 'Date', 'Action', 'Clé', 'Valeur'], null, 'A1');
        
        $metaSheet->getStyle('A1:E1')->applyFromArray([
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '059669']],
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
        ]);

        $row = 2;
        foreach ($logs as $log) {
            if ($log->metadata && is_array($log->metadata)) {
                foreach ($log->metadata as $key => $value) {
                    if (!in_array($key, ['logged_at', 'logged_by'])) {
                        $metaSheet->fromArray([
                            $log->id,
                            $log->created_at->format('d/m/Y H:i'),
                            $log->action_label,
                            $this->formatMetadataKey($key),
                            $this->formatMetadataValue($value),
                        ], null, "A{$row}");
                        $row++;
                    }
                }
            }
        }

        foreach (range('A', 'E') as $col) {
            $metaSheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /**
     * Sauvegarder le spreadsheet
     */
    private function saveSpreadsheet(Spreadsheet $spreadsheet, string $filename): string
    {
        Storage::makeDirectory(self::EXPORT_PATH);
        $fullPath = self::EXPORT_PATH . '/' . $filename;
        $absolutePath = Storage::path($fullPath);
        
        $writer = new Xlsx($spreadsheet);
        $writer->save($absolutePath);
        
        return $fullPath;
    }

    /**
     * Formater le user agent
     */
    private function formatUserAgent(?string $userAgent): string
    {
        if (!$userAgent) return 'N/A';
        if (preg_match('/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/', $userAgent, $matches)) {
            return $matches[0];
        }
        return substr($userAgent, 0, 50);
    }

    /**
     * Obtenir la liste des exports disponibles avec marqueur auto/manuel
     */
    public function getAvailableExports(): array
    {
        $files = Storage::files(self::EXPORT_PATH);
        
        return collect($files)->map(function ($file) {
            $filename = basename($file);
            $isAutoExport = strpos($filename, '_auto_') !== false;
            
            return [
                'filename' => $filename,
                'path' => $file,
                'size' => Storage::size($file),
                'size_formatted' => $this->formatBytes(Storage::size($file)),
                'created_at' => Storage::lastModified($file),
                'url' => Storage::url($file),
                'is_auto_export' => $isAutoExport,
                'can_delete' => !$isAutoExport, // Seuls les exports manuels sont supprimables
                'type_label' => $isAutoExport ? 'Automatique' : 'Manuel',
            ];
        })->sortByDesc('created_at')->values()->toArray();
    }

    /**
     * Supprimer un export (seulement si manuel)
     */
    public function deleteExport(string $filename): bool
    {
        // Vérifier si c'est un export automatique
        if (strpos($filename, '_auto_') !== false) {
            Log::warning('Tentative de suppression d\'export automatique bloquée', [
                'filename' => $filename
            ]);
            return false;
        }

        // Supprimer l'export manuel
        $path = self::EXPORT_PATH . '/' . $filename;
        if (Storage::exists($path)) {
            Storage::delete($path);
            Log::info('Export manuel supprimé', ['filename' => $filename]);
            return true;
        }

        return false;
    }

    /**
     * Nettoyer les anciens exports automatiques (garder les 12 derniers = 1 an)
     */
    public function cleanOldAutoExports(): int
    {
        $exports = collect($this->getAvailableExports())
            ->filter(fn($exp) => $exp['is_auto_export'])
            ->sortByDesc('created_at')
            ->values();
        
        if ($exports->count() <= self::MAX_AUTO_ARCHIVES) {
            return 0;
        }

        $toDelete = $exports->slice(self::MAX_AUTO_ARCHIVES);
        $deleted = 0;

        foreach ($toDelete as $export) {
            $path = self::EXPORT_PATH . '/' . $export['filename'];
            if (Storage::exists($path)) {
                Storage::delete($path);
                $deleted++;
            }
        }

        if ($deleted > 0) {
            Log::info("Nettoyage automatique des exports", [
                'deleted' => $deleted,
                'kept' => self::MAX_AUTO_ARCHIVES
            ]);
        }

        return $deleted;
    }

    /**
     * Formater la taille de fichier
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['o', 'Ko', 'Mo', 'Go'];
        $i = 0;
        
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}