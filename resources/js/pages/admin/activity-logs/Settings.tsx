// resources/js/pages/admin/activity-logs/Settings.tsx
import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
    Settings, Trash2, Download, FileSpreadsheet, 
    AlertTriangle, Calendar, Database, CheckCircle2,
    Info, Clock, HardDrive, Zap, Loader2, Archive,
    Shield, CalendarRange
} from 'lucide-react';

interface LogsSettingsProps {
    settings: {
        auto_delete_enabled: boolean;
        retention_days: number;
        cleanup_frequency: 'daily' | 'weekly' | 'monthly';
        auto_export_before_delete: boolean;
        last_cleanup: string | null;
        last_export: string | null;
        last_auto_check: string | null;
        next_cleanup_date: string | null;
    };
    statistics: {
        active_logs: number;
        logs_to_archive: number;
        total_logs: number;
        oldest_log: string;
        newest_log: string;
        active_period: string;
        archive_period: string;
    };
    exports: Array<{
        filename: string;
        path: string;
        size: number;
        size_formatted: string;
        created_at: number;
        url: string;
        is_auto_export: boolean;
        can_delete: boolean;
        type_label: string;
    }>;
}

export default function LogsSettings({ settings, statistics, exports }: LogsSettingsProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    
    // Dates pour export manuel
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const { data, setData, put, processing } = useForm({
        auto_delete_enabled: settings.auto_delete_enabled,
        retention_days: settings.retention_days,
        cleanup_frequency: settings.cleanup_frequency,
        auto_export_before_delete: settings.auto_export_before_delete,
    });

    const handleSubmit = () => {
        put('/admin/activity-logs/settings', {
            preserveScroll: true,
        });
    };

    const handleManualExport = () => {
        if (isExporting || !dateFrom || !dateTo) return;
        
        setIsExporting(true);
        
        router.post('/admin/activity-logs/export', 
            { date_from: dateFrom, date_to: dateTo }, 
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsExporting(false);
                    // Réinitialiser les dates
                    setDateFrom('');
                    setDateTo('');
                },
                onError: (errors) => {
                    console.error('Erreur export:', errors);
                    setIsExporting(false);
                }
            }
        );
    };

    const handleArchiveOld = () => {
        if (isArchiving) return;
        
        const message = `Archiver ${statistics.logs_to_archive} logs obsolètes ?\n\n` +
                       `• Les logs de ${statistics.archive_period} seront exportés en Excel\n` +
                       `• Ces logs seront supprimés de la BDD\n` +
                       `• Les logs actifs (${statistics.active_period}) restent en BDD\n\n` +
                       `Continuer ?`;
        
        if (!confirm(message)) return;

        setIsArchiving(true);
        
        router.post('/admin/activity-logs/cleanup', {}, {
            preserveScroll: true,
            onFinish: () => {
                setIsArchiving(false);
            },
            onError: (errors) => {
                console.error('Erreur archivage:', errors);
                setIsArchiving(false);
            }
        });
    };

    const handleDownload = (filename: string) => {
        window.location.href = `/admin/activity-logs/download/${filename}`;
    };

    const handleDeleteExport = (filename: string, isAuto: boolean) => {
        if (isAuto) {
            alert('Les exports automatiques sont protégés et ne peuvent pas être supprimés.');
            return;
        }
        
        if (!confirm('Supprimer cet export manuel ?')) return;
        
        router.delete(`/admin/activity-logs/exports/${filename}`, {
            preserveScroll: true,
        });
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString('fr-FR');
    };

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return 'Jamais';
        return new Date(dateStr).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFrequencyLabel = (freq: string) => {
        const labels: Record<string, string> = {
            daily: 'Quotidien',
            weekly: 'Hebdomadaire',
            monthly: 'Mensuel',
        };
        return labels[freq] || freq;
    };

    const autoExports = exports.filter(e => e.is_auto_export);
    const manualExports = exports.filter(e => !e.is_auto_export);

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Logs d\'activité', href: '/admin/activity-logs' },
                { title: 'Paramètres', href: '' },
            ]}
        >
            <Head title="Paramètres des Logs" />

            <div className="container mx-auto p-6 max-w-7xl space-y-6">
                {/* En-tête */}
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Settings className="h-8 w-8 text-slate-600" />
                        Gestion des Logs - Système 3 Niveaux
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Archivage automatique progressif pour performance optimale
                    </p>
                </div>

                {/* Alert Info */}
                <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                    <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>Système professionnel :</strong> Les logs actifs (0-{data.retention_days}j) restent en BDD pour accès rapide. 
                        Les logs plus anciens ({data.retention_days + 1}-{data.retention_days * 2}j) sont archivés automatiquement en Excel puis supprimés.
                    </AlertDescription>
                </Alert>

                {/* Statistiques à 3 niveaux */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-2 border-green-200 dark:border-green-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Niveau 1 : Logs Actifs</CardTitle>
                                <Database className="h-4 w-4 text-green-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">
                                {statistics.active_logs.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {statistics.active_period} • Accès rapide
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-orange-200 dark:border-orange-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Niveau 2 : À Archiver</CardTitle>
                                <Archive className="h-4 w-4 text-orange-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-600">
                                {statistics.logs_to_archive.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {statistics.archive_period} • À exporter
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-blue-200 dark:border-blue-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Niveau 3 : Archives Excel</CardTitle>
                                <Shield className="h-4 w-4 text-blue-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600">
                                {autoExports.length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Fichiers protégés (1 an max)
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Configuration du Système
                        </CardTitle>
                        <CardDescription>
                            Paramètres d'archivage automatique progressif
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-medium">
                                        Archivage automatique
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Exporter et supprimer les logs obsolètes automatiquement
                                    </p>
                                </div>
                                <Switch
                                    checked={data.auto_delete_enabled}
                                    onCheckedChange={(checked) => 
                                        setData('auto_delete_enabled', checked)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="retention_days">
                                    Durée de rétention en BDD (Niveau 1)
                                </Label>
                                <Input
                                    id="retention_days"
                                    type="number"
                                    min="30"
                                    max="365"
                                    value={data.retention_days}
                                    onChange={(e) => 
                                        setData('retention_days', parseInt(e.target.value))
                                    }
                                    className="max-w-xs"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Les logs de 0-{data.retention_days} jours restent en BDD. 
                                    Les logs de {data.retention_days + 1}-{data.retention_days * 2} jours sont archivés.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cleanup_frequency">
                                    Fréquence d'archivage
                                </Label>
                                <Select
                                    value={data.cleanup_frequency}
                                    onValueChange={(value: any) => 
                                        setData('cleanup_frequency', value)
                                    }
                                >
                                    <SelectTrigger className="max-w-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Quotidien</SelectItem>
                                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                        <SelectItem value="monthly">Mensuel (recommandé)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground">
                                    Le système vérifiera et archivera selon cette fréquence
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleSubmit} disabled={processing}>
                                    {processing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Enregistrer
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Export Manuel avec Période */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarRange className="h-5 w-5" />
                            Export Manuel par Période
                        </CardTitle>
                        <CardDescription>
                            Exporter des logs d'une période spécifique (sans suppression de la BDD)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date_from">Date de début</Label>
                                <Input
                                    id="date_from"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    max={dateTo || undefined}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date_to">Date de fin</Label>
                                <Input
                                    id="date_to"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    min={dateFrom || undefined}
                                />
                            </div>
                        </div>

                        <Alert className="border-blue-200 bg-blue-50/50">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-sm text-blue-900">
                                <strong>Export manuel :</strong> Les logs restent en BDD. L'export Excel est supprimable.
                            </AlertDescription>
                        </Alert>

                        <Button
                            onClick={handleManualExport}
                            disabled={isExporting || !dateFrom || !dateTo}
                            variant="outline"
                            className="w-full"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Export en cours...
                                </>
                            ) : (
                                <>
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                    Exporter la période sélectionnée
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Archivage Automatique */}
                {statistics.logs_to_archive > 0 && (
                    <Card className="border-orange-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Archive className="h-5 w-5 text-orange-600" />
                                Archivage des Logs Obsolètes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert className="border-orange-200 bg-orange-50/50">
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                <AlertDescription className="text-sm text-orange-900">
                                    <strong>{statistics.logs_to_archive} logs</strong> peuvent être archivés ({statistics.archive_period}).
                                    Les logs actifs ({statistics.active_period}) seront conservés en BDD.
                                </AlertDescription>
                            </Alert>

                            <Button
                                onClick={handleArchiveOld}
                                disabled={isArchiving}
                                className="bg-orange-600 hover:bg-orange-700"
                            >
                                {isArchiving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Archivage en cours...
                                    </>
                                ) : (
                                    <>
                                        <Archive className="h-4 w-4 mr-2" />
                                        Archiver les logs obsolètes maintenant
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Archives Automatiques (Niveau 3) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-green-600" />
                            Archives Automatiques ({autoExports.length})
                        </CardTitle>
                        <CardDescription>
                            Exports automatiques protégés • Maximum 12 fichiers (1 an)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {autoExports.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-sm text-muted-foreground">
                                    Aucune archive automatique
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {autoExports.map((exp) => (
                                    <div
                                        key={exp.filename}
                                        className="flex items-center justify-between p-4 border rounded-lg bg-green-50/30 dark:bg-green-950/10"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileSpreadsheet className="h-6 w-6 text-green-600" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{exp.filename}</span>
                                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                                        <Shield className="h-3 w-3 mr-1" />
                                                        Protégé
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {formatDate(exp.created_at)} • {exp.size_formatted}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDownload(exp.filename)}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Télécharger
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Exports Manuels */}
                {manualExports.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HardDrive className="h-5 w-5 text-blue-600" />
                                Exports Manuels ({manualExports.length})
                            </CardTitle>
                            <CardDescription>
                                Exports créés manuellement • Supprimables
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {manualExports.map((exp) => (
                                    <div
                                        key={exp.filename}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{exp.filename}</span>
                                                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                                                        Manuel
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {formatDate(exp.created_at)} • {exp.size_formatted}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDownload(exp.filename)}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDeleteExport(exp.filename, exp.is_auto_export)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppSidebarLayout>
    );
}