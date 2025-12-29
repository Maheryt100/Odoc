// resources/js/pages/TopoFlux/components/ImportDetailsDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileImage, FileType } from 'lucide-react';
import { ImportDetailsDialogProps } from '../types';

export default function ImportDetailsDialog({
    import: imp,
    open,
    onOpenChange
}: ImportDetailsDialogProps) {
    if (!imp) return null;

    const getFileIcon = (extension: string) => {
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension.toLowerCase())) {
            return <FileImage className="h-4 w-4" />;
        }
        return <FileType className="h-4 w-4" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return bytes + ' octets';
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Détails de l'import</DialogTitle>
                </DialogHeader>
                
                {imp && (
                    <Tabs defaultValue="data" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="data">Données</TabsTrigger>
                            <TabsTrigger value="files">Fichiers ({imp.files_count})</TabsTrigger>
                            <TabsTrigger value="matched">Entité matchée</TabsTrigger>
                        </TabsList>

                        {/* Onglet Données */}
                        <TabsContent value="data" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Informations générales</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Type</p>
                                            <Badge>{imp.entity_type}</Badge>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Action</p>
                                            <Badge variant="outline">{imp.action_suggested}</Badge>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Dossier</p>
                                            <p className="text-sm">N°{imp.dossier_numero_ouverture} - {imp.dossier_nom}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">District</p>
                                            <p className="text-sm">{imp.district_nom}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Données brutes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded text-xs overflow-x-auto">
                                        {JSON.stringify(imp.raw_data, null, 2)}
                                    </pre>
                                </CardContent>
                            </Card>

                            {imp.warnings && imp.warnings.length > 0 && (
                                <Card className="border-amber-200">
                                    <CardHeader>
                                        <CardTitle className="text-base text-amber-600">
                                            Avertissements
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="list-disc list-inside space-y-1">
                                            {imp.warnings.map((warning, idx) => (
                                                <li key={idx} className="text-sm">{warning}</li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* Onglet Fichiers */}
                        <TabsContent value="files" className="space-y-4">
                            {imp.files.length === 0 ? (
                                <Card>
                                    <CardContent className="text-center py-8 text-muted-foreground">
                                        Aucun fichier joint
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-2">
                                    {imp.files.map((file, idx) => (
                                        <Card key={idx}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {getFileIcon(file.extension)}
                                                        <div>
                                                            <p className="text-sm font-medium">{file.name}</p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {file.category}
                                                                </Badge>
                                                                <span>{formatFileSize(file.size)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Onglet Entité matchée */}
                        <TabsContent value="matched" className="space-y-4">
                            {!imp.matched_entity_id ? (
                                <Card>
                                    <CardContent className="text-center py-8 text-muted-foreground">
                                        Aucune entité existante détectée
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center justify-between">
                                            <span>Entité existante détectée</span>
                                            <Badge variant="secondary">
                                                Confiance: {(imp.match_confidence! * 100).toFixed(0)}%
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-2">
                                                Méthode de détection: {imp.match_method}
                                            </p>
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded">
                                            <p className="text-sm font-medium mb-2">Données de l'entité existante:</p>
                                            <pre className="text-xs overflow-x-auto">
                                                {JSON.stringify(imp.matched_entity_details, null, 2)}
                                            </pre>
                                        </div>

                                        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded border border-amber-200">
                                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                                ⚠️ Action suggérée: {imp.action_suggested === 'update' ? 'Mise à jour' : 'Création'}
                                            </p>
                                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                                En validant cet import, vous serez redirigé vers le formulaire approprié 
                                                {imp.action_suggested === 'update' 
                                                    ? ' pré-rempli avec les données existantes.' 
                                                    : ' de création.'}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}