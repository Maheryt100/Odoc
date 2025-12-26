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
import { 
    Settings, Trash2, Download, FileSpreadsheet, 
    AlertTriangle, Calendar, Database, CheckCircle2,
    Info, Clock, HardDrive, Zap, Loader2
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
        total_logs: number;
        logs_to_delete: number;
        oldest_log: string;
        newest_log: string;
    };
    exports: Array<{
        filename: string;
        path: string;
        size: number;
        size_formatted: string;
        created_at: number;
        url: string;
    }>;
}

export default function LogsSettings({ settings, statistics, exports }: LogsSettingsProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [isCleaningUp, setIsCleaningUp] = useState(false);

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
        if (isExporting) return;
        
        setIsExporting(true);
        
        // Utiliser router.post pour déclencher le téléchargement
        router.post('/admin/activity-logs/export', {}, {
            preserveScroll: true,
            onFinish: () => {
                setIsExporting(false);
            },
            onError: (errors) => {
                console.error('Erreur export:', errors);
                setIsExporting(false);
            }
        });
    };

    const handleCleanup = (exportBefore: boolean) => {
        if (isCleaningUp) return;
        
        if (!confirm(`Confirmer la suppression de ${statistics.logs_to_delete} logs ?`)) {
            return;
        }

        setIsCleaningUp(true);
        
        router.post('/admin/activity-logs/cleanup', 
            { export_before: exportBefore }, 
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsCleaningUp(false);
                },
                onError: (errors) => {
                    console.error('Erreur cleanup:', errors);
                    setIsCleaningUp(false);
                }
            }
        );
    };

    const handleDownload = (filename: string) => {
        // Téléchargement direct via lien
        window.location.href = `/admin/activity-logs/download/${filename}`;
    };

    const handleDeleteExport = (filename: string) => {
        if (!confirm('Supprimer cet export ?')) return;
        
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Settings className="h-8 w-8 text-slate-600" />
                            Paramètres des Logs
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Configuration de la rétention et suppression automatique
                        </p>
                    </div>
                </div>

                {/* Alert Info */}
                <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                    <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>Système automatique :</strong> Le nettoyage s'exécute automatiquement en arrière-plan 
                        selon la fréquence choisie. Les logs sont exportés en Excel avant suppression.
                    </AlertDescription>
                </Alert>

                {/* Statistiques */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                                <Database className="h-4 w-4 text-blue-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_logs.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Depuis {statistics.oldest_log}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">À supprimer</CardTitle>
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {statistics.logs_to_delete.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Plus de {data.retention_days} jours
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Dernier nettoyage</CardTitle>
                                <Clock className="h-4 w-4 text-orange-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm font-medium">
                                {formatDateTime(settings.last_cleanup)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {getFrequencyLabel(data.cleanup_frequency)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">Prochain nettoyage</CardTitle>
                                <Calendar className="h-4 w-4 text-green-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm font-medium">
                                {data.auto_delete_enabled 
                                    ? formatDateTime(settings.next_cleanup_date)
                                    : 'Désactivé'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {data.auto_delete_enabled ? 'Automatique' : 'Manuel uniquement'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Configuration
                        </CardTitle>
                        <CardDescription>
                            Paramètres de rétention et suppression automatique
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Suppression automatique */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-medium">
                                        Suppression automatique
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Activer le nettoyage automatique en arrière-plan
                                    </p>
                                </div>
                                <Switch
                                    checked={data.auto_delete_enabled}
                                    onCheckedChange={(checked) => 
                                        setData('auto_delete_enabled', checked)
                                    }
                                />
                            </div>

                            {/* Durée de rétention */}
                            <div className="space-y-2">
                                <Label htmlFor="retention_days">
                                    Durée de rétention (jours)
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
                                    Minimum 30 jours. Les logs de plus de {data.retention_days} jours seront supprimés
                                </p>
                            </div>

                            {/* Fréquence de nettoyage */}
                            <div className="space-y-2">
                                <Label htmlFor="cleanup_frequency">
                                    Fréquence de nettoyage
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
                                    Le système vérifiera automatiquement selon cette fréquence
                                </p>
                            </div>

                            {/* Export automatique */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-medium">
                                        Export automatique avant suppression
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Créer automatiquement un fichier Excel avant chaque suppression
                                    </p>
                                </div>
                                <Switch
                                    checked={data.auto_export_before_delete}
                                    onCheckedChange={(checked) => 
                                        setData('auto_export_before_delete', checked)
                                    }
                                />
                            </div>

                            {/* Boutons */}
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

                {/* Actions manuelles */}
                <Card>
                    <CardHeader>
                        <CardTitle>Actions manuelles</CardTitle>
                        <CardDescription>
                            Exporter ou nettoyer les logs manuellement
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {statistics.logs_to_delete > 0 && (
                            <Alert className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
                                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                <AlertDescription className="text-sm text-orange-900 dark:text-orange-100">
                                    <strong>{statistics.logs_to_delete} logs</strong> peuvent être supprimés 
                                    selon la politique de rétention actuelle
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                onClick={handleManualExport}
                                disabled={isExporting}
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Export en cours...
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                                        Exporter tous les logs
                                    </>
                                )}
                            </Button>

                            {statistics.logs_to_delete > 0 && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleCleanup(true)}
                                        disabled={isCleaningUp}
                                        className="text-orange-600 hover:text-orange-700 dark:text-orange-400"
                                    >
                                        {isCleaningUp ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Traitement...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="h-4 w-4 mr-2" />
                                                Exporter et supprimer
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        onClick={() => handleCleanup(false)}
                                        disabled={isCleaningUp}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Supprimer sans exporter
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Exports disponibles */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5" />
                            Exports disponibles ({exports.length})
                        </CardTitle>
                        <CardDescription>
                            Fichiers Excel dans storage/app/public/pieces_jointes/logs
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {exports.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Aucun export disponible
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {exports.map((exp) => (
                                    <div
                                        key={exp.filename}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                            <div>
                                                <div className="font-medium text-sm">{exp.filename}</div>
                                                <div className="text-xs text-muted-foreground">
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
                                                onClick={() => handleDeleteExport(exp.filename)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppSidebarLayout>
    );
}