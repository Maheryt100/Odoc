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

class ActivityLogsExportService
{
    private const EXPORT_PATH = 'pieces_jointes/logs';

    /**
     * Exporter les logs vers Excel
     */
    public function export(
        ?\Illuminate\Database\Eloquent\Collection $logs = null,
        ?string $filename = null,
        bool $autoExport = false
    ): array {
        try {
            // Si aucun logs fourni, exporter tous les logs
            if ($logs === null) {
                $logs = ActivityLog::with(['user', 'district'])
                    ->orderBy('created_at', 'desc')
                    ->get();
            }

            // Générer le nom de fichier
            if (!$filename) {
                $date = now()->format('Y-m-d_His');
                $type = $autoExport ? 'auto' : 'manual';
                $filename = "activity_logs_{$type}_{$date}.xlsx";
            }

            // Créer le spreadsheet
            $spreadsheet = $this->createSpreadsheet($logs);

            // Sauvegarder dans storage
            $path = $this->saveSpreadsheet($spreadsheet, $filename);

            // Mettre à jour la date d'export
            SystemSettings::updateLastExport();

            Log::info('Export des logs réussi', [
                'filename' => $filename,
                'count' => $logs->count(),
                'auto_export' => $autoExport,
            ]);

            return [
                'success' => true,
                'path' => $path,
                'filename' => $filename,
                'count' => $logs->count(),
                'size' => Storage::size($path),
                'url' => Storage::url($path),
            ];

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'export des logs', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Créer le spreadsheet avec les données
     */
    private function createSpreadsheet($logs): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Activity Logs');

        // En-têtes
        $headers = [
            'ID', 'Date/Heure', 'Utilisateur', 'Email', 'Rôle',
            'Action', 'Type d\'entité', 'ID Entité', 'Type Document',
            'District', 'Détails', 'IP', 'Navigateur'
        ];

        // Style des en-têtes
        $sheet->fromArray($headers, null, 'A1');
        $headerRange = 'A1:M1';
        
        $sheet->getStyle($headerRange)->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4F46E5'],
            ],
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 12,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000'],
                ],
            ],
        ]);

        // Données
        $row = 2;
        foreach ($logs as $log) {
            $sheet->fromArray([
                $log->id,
                $log->created_at->format('d/m/Y H:i:s'),
                $log->user->name ?? 'N/A',
                $log->user->email ?? 'N/A',
                $log->user->role_name ?? 'N/A',
                $log->action_label,
                $log->entity_label,
                $log->entity_id ?? 'N/A',
                $log->document_type ?? 'N/A',
                $log->district->nom_district ?? 'N/A',
                $this->formatDetails($log),
                $log->ip_address ?? 'N/A',
                $this->formatUserAgent($log->user_agent),
            ], null, "A{$row}");

            // Style des lignes (alternance de couleurs)
            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:M{$row}")->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'F9FAFB'],
                    ],
                ]);
            }

            $row++;
        }

        // Auto-size des colonnes
        foreach (range('A', 'M') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Ajouter une feuille de statistiques
        $this->addStatsSheet($spreadsheet, $logs);

        return $spreadsheet;
    }

    /**
     * Ajouter une feuille de statistiques
     */
    private function addStatsSheet(Spreadsheet $spreadsheet, $logs): void
    {
        $statsSheet = $spreadsheet->createSheet();
        $statsSheet->setTitle('Statistiques');

        // Titre
        $statsSheet->setCellValue('A1', 'Statistiques des Logs d\'Activité');
        $statsSheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16],
        ]);

        $row = 3;

        // Statistiques générales
        $statsSheet->setCellValue("A{$row}", 'Total des actions:');
        $statsSheet->setCellValue("B{$row}", $logs->count());
        $row++;

        $statsSheet->setCellValue("A{$row}", 'Période:');
        $statsSheet->setCellValue("B{$row}", 
            ($logs->first()->created_at ?? now())->format('d/m/Y') . ' - ' . 
            ($logs->last()->created_at ?? now())->format('d/m/Y')
        );
        $row += 2;

        // Actions par type
        $statsSheet->setCellValue("A{$row}", 'Actions par type:');
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
        $row++;
        
        $userCounts = $logs->groupBy('user.name')
            ->map->count()
            ->sortDesc()
            ->take(10);
        
        foreach ($userCounts as $userName => $count) {
            $statsSheet->setCellValue("A{$row}", $userName ?? 'N/A');
            $statsSheet->setCellValue("B{$row}", $count);
            $row++;
        }

        // Auto-size
        $statsSheet->getColumnDimension('A')->setAutoSize(true);
        $statsSheet->getColumnDimension('B')->setAutoSize(true);
    }

    /**
     * Sauvegarder le spreadsheet
     */
    private function saveSpreadsheet(Spreadsheet $spreadsheet, string $filename): string
    {
        // S'assurer que le dossier existe
        Storage::makeDirectory(self::EXPORT_PATH);

        $fullPath = self::EXPORT_PATH . '/' . $filename;
        $absolutePath = Storage::path($fullPath);

        // Créer le writer et sauvegarder
        $writer = new Xlsx($spreadsheet);
        $writer->save($absolutePath);

        return $fullPath;
    }

    /**
     * Formater les détails pour l'export
     */
    private function formatDetails(ActivityLog $log): string
    {
        $details = $log->details;
        
        if ($log->metadata && is_array($log->metadata)) {
            $meta = [];
            foreach ($log->metadata as $key => $value) {
                if (!in_array($key, ['logged_at', 'logged_by'])) {
                    $meta[] = "$key: $value";
                }
            }
            if (!empty($meta)) {
                $details .= ' | ' . implode(', ', $meta);
            }
        }

        return $details;
    }

    /**
     * Formater le user agent
     */
    private function formatUserAgent(?string $userAgent): string
    {
        if (!$userAgent) {
            return 'N/A';
        }

        // Extraire le navigateur principal
        if (preg_match('/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/', $userAgent, $matches)) {
            return $matches[0];
        }

        return substr($userAgent, 0, 50);
    }

    /**
     * Obtenir la liste des exports disponibles
     */
    public function getAvailableExports(): array
    {
        $files = Storage::files(self::EXPORT_PATH);
        
        return collect($files)->map(function ($file) {
            return [
                'filename' => basename($file),
                'path' => $file,
                'size' => Storage::size($file),
                'size_formatted' => $this->formatBytes(Storage::size($file)),
                'created_at' => Storage::lastModified($file),
                'url' => Storage::url($file),
            ];
        })->sortByDesc('created_at')->values()->toArray();
    }

    /**
     * Supprimer un export
     */
    public function deleteExport(string $filename): bool
    {
        $path = self::EXPORT_PATH . '/' . $filename;
        
        if (Storage::exists($path)) {
            return Storage::delete($path);
        }

        return false;
    }

    /**
     * Nettoyer les anciens exports (garder les 10 derniers)
     */
    public function cleanOldExports(int $keep = 10): int
    {
        $exports = $this->getAvailableExports();
        
        if (count($exports) <= $keep) {
            return 0;
        }

        $toDelete = array_slice($exports, $keep);
        $deleted = 0;

        foreach ($toDelete as $export) {
            if ($this->deleteExport($export['filename'])) {
                $deleted++;
            }
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