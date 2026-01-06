// resources/js/pages/admin/activity-logs/Settings.tsx - VERSION SIMPLIFIÉE
import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    Settings, Trash2, Download, FileSpreadsheet, 
    AlertTriangle, Database, CheckCircle2,
    Info, HardDrive, Loader2, Archive,
    Shield, CalendarRange, AlertOctagon, X
} from 'lucide-react';

interface OverloadStatus {
    total_logs: number;
    max_logs: number;
    percentage: number;
    is_overloaded: boolean;
    severity: 'normal' | 'warning' | 'critical';
    recommended_action: string | null;
    can_cleanup: boolean;
}

interface LogsSettingsProps {
    settings: {
        auto_delete_enabled: boolean;
        retention_days: number;
        cleanup_frequency: 'daily' | 'weekly' | 'monthly';
        auto_export_before_delete: boolean;
        last_cleanup: string | null;
        last_export: string | null;
    };
    statistics: {
        active_logs: number;
        logs_to_archive: number;
        low_priority_logs: number;
        total_logs: number;
        max_logs: number;
        oldest_log: string;
        newest_log: string;
        retention_days: number;
        by_action: Record<string, number>;
        overload_status: OverloadStatus;
    };
    exports: Array<{
        filename: string;
        size_formatted: string;
        created_at: number;
        is_auto_export: boolean;
        can_delete: boolean;
    }>;
}

export default function LogsSettings({ settings, statistics, exports }: LogsSettingsProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [showManualDelete, setShowManualDelete] = useState(false);
    
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    
    // États pour suppression manuelle
    const [deleteFilters, setDeleteFilters] = useState({
        date_from: '',
        date_to: '',
        actions: [] as string[],
        export_before_delete: true,
    });

    const { data, setData, put, processing } = useForm({
        auto_delete_enabled: settings.auto_delete_enabled,
        retention_days: settings.retention_days,
        cleanup_frequency: settings.cleanup_frequency,
        auto_export_before_delete: settings.auto_export_before_delete,
        max_logs: statistics.max_logs,
    });

    const overload = statistics.overload_status;
    const autoExports = exports.filter(e => e.is_auto_export);
    const manualExports = exports.filter(e => !e.is_auto_export);

    const getProgressColor = () => {
        if (overload.severity === 'critical') return 'bg-red-500';
        if (overload.severity === 'warning') return 'bg-orange-500';
        return 'bg-green-500';
    };

    const handleSubmit = () => {
        put('/admin/activity-logs/settings', { preserveScroll: true });
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
                    setDateFrom('');
                    setDateTo('');
                }
            }
        );
    };

    const handleArchiveOld = () => {
        if (isArchiving) return;
        
        const message = overload.severity === 'critical'
            ? `⚠️ SYSTÈME SURCHARGÉ ⚠️\n\n${statistics.total_logs.toLocaleString()} logs (${overload.percentage}% du seuil)\n\nNettoyage prioritaire :\n• Login/Logout (${statistics.low_priority_logs.toLocaleString()})\n• Logs anciens (> ${data.retention_days}j)\n\nContinuer ?`
            : `Archiver ${statistics.logs_to_archive.toLocaleString()} logs de plus de ${data.retention_days} jours ?\n\nIls seront exportés en Excel puis supprimés de la BDD.`;
        
        if (!confirm(message)) return;

        setIsArchiving(true);
        router.post('/admin/activity-logs/cleanup', {}, {
            preserveScroll: true,
            onFinish: () => setIsArchiving(false)
        });
    };

    const handleManualDelete = () => {
        if (!deleteFilters.date_from || !deleteFilters.date_to) {
            alert('Veuillez sélectionner une période.');
            return;
        }

        const message = `Supprimer les logs de cette période ?\n\nDu ${deleteFilters.date_from} au ${deleteFilters.date_to}\n${deleteFilters.actions.length > 0 ? `Actions : ${deleteFilters.actions.join(', ')}\n` : ''}${deleteFilters.export_before_delete ? 'Les logs seront exportés avant suppression.\n' : '⚠️ ATTENTION : Suppression sans export !\n'}\nContinuer ?`;
        
        if (!confirm(message)) return;

        router.post('/admin/activity-logs/delete-by-filters', deleteFilters, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteFilters({
                    date_from: '',
                    date_to: '',
                    actions: [],
                    export_before_delete: true,
                });
                setShowManualDelete(false);
            }
        });
    };

    const handleDownload = (filename: string) => {
        window.location.href = `/admin/activity-logs/download/${filename}`;
    };

    const handleDeleteExport = (filename: string, isAuto: boolean) => {
        if (isAuto) {
            alert('Les exports automatiques sont protégés.');
            return;
        }
        if (!confirm('Supprimer cet export manuel ?')) return;
        router.delete(`/admin/activity-logs/exports/${filename}`, { preserveScroll: true });
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString('fr-FR');
    };

    const toggleAction = (action: string) => {
        setDeleteFilters(prev => ({
            ...prev,
            actions: prev.actions.includes(action)
                ? prev.actions.filter(a => a !== action)
                : [...prev.actions, action]
        }));
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
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Settings className="h-8 w-8 text-slate-600" />
                        Gestion des Logs - Système Simplifié
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Rétention à {data.retention_days} jours • Seuil max : {data.max_logs.toLocaleString()} logs
                    </p>
                </div>

                {/* Alerte de surcharge */}
                {overload.severity === 'critical' && (
                    <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
                        <AlertOctagon className="h-5 w-5 text-red-600" />
                        <AlertTitle className="text-red-900 dark:text-red-100">
                            ⚠️ SYSTÈME SURCHARGÉ
                        </AlertTitle>
                        <AlertDescription className="text-red-800 dark:text-red-200">
                            <strong>{statistics.total_logs.toLocaleString()} logs</strong> ({overload.percentage}% du seuil). 
                            Nettoyage d'urgence recommandé !
                            <Button
                                onClick={handleArchiveOld}
                                disabled={isArchiving}
                                className="bg-red-600 hover:bg-red-700 mt-2"
                                size="sm"
                            >
                                {isArchiving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                Lancer le nettoyage
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {overload.severity === 'warning' && (
                    <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <AlertTitle className="text-orange-900">Avertissement</AlertTitle>
                        <AlertDescription className="text-orange-800">
                            <strong>{statistics.total_logs.toLocaleString()} logs</strong> ({overload.percentage}% du seuil). 
                            Nettoyage recommandé prochainement.
                        </AlertDescription>
                    </Alert>
                )}

                {/* État du système */}
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            État du Système
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm font-medium">Logs en base de données</Label>
                                <Badge variant={overload.severity === 'critical' ? 'destructive' : overload.severity === 'warning' ? 'secondary' : 'outline'}>
                                    {statistics.total_logs.toLocaleString()} / {data.max_logs.toLocaleString()}
                                </Badge>
                            </div>
                            <Progress 
                                value={overload.percentage} 
                                className={`h-2 [&>div]:${getProgressColor()}`}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                {overload.percentage}% du seuil configuré
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {statistics.active_logs.toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">Logs actifs (0-{data.retention_days}j)</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                    {statistics.logs_to_archive.toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">À archiver (&gt; {data.retention_days}j)</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {autoExports.length}
                                </div>
                                <p className="text-xs text-muted-foreground">Archives protégées</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>Paramètres d'archivage automatique</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                                <div>
                                    <Label className="text-base font-medium">Archivage automatique</Label>
                                    <p className="text-sm text-muted-foreground">Exporter et supprimer automatiquement</p>
                                </div>
                                <Switch
                                    checked={data.auto_delete_enabled}
                                    onCheckedChange={(checked) => setData('auto_delete_enabled', checked)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="retention_days">Rétention en BDD (jours)</Label>
                                    <Input
                                        id="retention_days"
                                        type="number"
                                        min="30"
                                        max="365"
                                        value={data.retention_days}
                                        onChange={(e) => setData('retention_days', parseInt(e.target.value))}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Logs conservés : 0-{data.retention_days} jours
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="max_logs">Seuil max de logs</Label>
                                    <Input
                                        id="max_logs"
                                        type="number"
                                        min="100000"
                                        max="2000000"
                                        step="50000"
                                        value={data.max_logs}
                                        onChange={(e) => setData('max_logs', parseInt(e.target.value))}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Actuellement : {overload.percentage}% utilisé
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cleanup_frequency">Fréquence d'archivage</Label>
                                <Select
                                    value={data.cleanup_frequency}
                                    onValueChange={(value: any) => setData('cleanup_frequency', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Quotidien</SelectItem>
                                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                        <SelectItem value="monthly">Mensuel (recommandé)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={handleSubmit} disabled={processing}>
                                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                Enregistrer
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Export Manuel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarRange className="h-5 w-5" />
                            Export Manuel
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date début</Label>
                                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} max={dateTo || undefined} />
                            </div>
                            <div className="space-y-2">
                                <Label>Date fin</Label>
                                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} min={dateFrom || undefined} />
                            </div>
                        </div>
                        <Button onClick={handleManualExport} disabled={isExporting || !dateFrom || !dateTo} variant="outline" className="w-full">
                            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                            Exporter
                        </Button>
                    </CardContent>
                </Card>

                {/* Suppression Manuelle */}
                <Card className="border-red-200">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    <Trash2 className="h-5 w-5" />
                                    Suppression Manuelle
                                </CardTitle>
                                <CardDescription>Supprimer des logs spécifiques (avec export optionnel)</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setShowManualDelete(!showManualDelete)}>
                                {showManualDelete ? <X className="h-4 w-4" /> : 'Afficher'}
                            </Button>
                        </div>
                    </CardHeader>
                    {showManualDelete && (
                        <CardContent className="space-y-4 border-t pt-4">
                            <Alert className="border-red-200 bg-red-50/50">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-sm text-red-900">
                                    <strong>Attention :</strong> Cette action est définitive. Max 10 000 logs par suppression.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date début</Label>
                                    <Input type="date" value={deleteFilters.date_from} onChange={(e) => setDeleteFilters(prev => ({ ...prev, date_from: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date fin</Label>
                                    <Input type="date" value={deleteFilters.date_to} onChange={(e) => setDeleteFilters(prev => ({ ...prev, date_to: e.target.value }))} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Filtrer par actions (optionnel)</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.keys(statistics.by_action).map(action => (
                                        <div key={action} className="flex items-center space-x-2">
                                            <Checkbox
                                                checked={deleteFilters.actions.includes(action)}
                                                onCheckedChange={() => toggleAction(action)}
                                            />
                                            <label className="text-sm">{action} ({statistics.by_action[action]})</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                                <Checkbox
                                    checked={deleteFilters.export_before_delete}
                                    onCheckedChange={(checked) => setDeleteFilters(prev => ({ ...prev, export_before_delete: !!checked }))}
                                />
                                <Label className="font-medium">Exporter avant de supprimer (recommandé)</Label>
                            </div>

                            <Button onClick={handleManualDelete} variant="destructive" className="w-full">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer les logs sélectionnés
                            </Button>
                        </CardContent>
                    )}
                </Card>

                {/* Archivage */}
                {statistics.logs_to_archive > 0 && (
                    <Card className="border-orange-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Archive className="h-5 w-5 text-orange-600" />
                                Archivage Automatique
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert className="border-orange-200 bg-orange-50/50">
                                <Info className="h-4 w-4 text-orange-600" />
                                <AlertDescription className="text-sm text-orange-900">
                                    <strong>{statistics.logs_to_archive.toLocaleString()} logs</strong> de plus de {data.retention_days} jours peuvent être archivés.
                                </AlertDescription>
                            </Alert>
                            <Button onClick={handleArchiveOld} disabled={isArchiving} className="bg-orange-600 hover:bg-orange-700">
                                {isArchiving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Archive className="h-4 w-4 mr-2" />}
                                Archiver maintenant
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Archives */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-green-600" />
                            Archives Automatiques ({autoExports.length}/12)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {autoExports.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-sm text-muted-foreground">Aucune archive automatique</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {autoExports.map((exp) => (
                                    <div key={exp.filename} className="flex items-center justify-between p-4 border rounded-lg bg-green-50/30">
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
                                                <div className="text-xs text-muted-foreground">{formatDate(exp.created_at)} • {exp.size_formatted}</div>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => handleDownload(exp.filename)}>
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
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {manualExports.map((exp) => (
                                    <div key={exp.filename} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                                            <div>
                                                <span className="font-medium text-sm">{exp.filename}</span>
                                                <div className="text-xs text-muted-foreground">{formatDate(exp.created_at)} • {exp.size_formatted}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleDownload(exp.filename)}>
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleDeleteExport(exp.filename, exp.is_auto_export)}>
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