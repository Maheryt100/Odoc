// resources/js/pages/TopoFlux/components/ImportCard.tsx

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Upload,
    XCircle,
    Eye,
    FileText,
    User,
    MapPin,
    Calendar,
    Paperclip,
    AlertCircle,
    Archive,
    ArchiveRestore
} from 'lucide-react';
import type { ImportCardProps } from '../types';

export default function ImportCard({
    import: imp,
    canValidate,
    onImport,
    onReject,
    onArchive,
    onUnarchive,
    onViewDetails,
    onPreviewFiles
}: ImportCardProps) {
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">En attente</Badge>;
            case 'archived':
                return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Archivé</Badge>;
            case 'validated':
                return <Badge className="bg-green-100 text-green-800 border-green-300">Validé</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-800 border-red-300">Rejeté</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };
    
    const getEntityIcon = (type: string) => {
        return type === 'demandeur' 
            ? <User className="h-4 w-4 text-blue-600" /> 
            : <MapPin className="h-4 w-4 text-purple-600" />;
    };
    
    const getMainInfo = () => {
        if (imp.entity_type === 'demandeur') {
            const d = imp.raw_data;
            return (
                <div className="space-y-1">
                    <p className="font-semibold text-base">
                        {d.titre_demandeur} {d.nom_demandeur} {d.prenom_demandeur}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        CIN: {d.cin || 'Non fourni'}
                    </p>
                </div>
            );
        } else {
            const p = imp.raw_data;
            return (
                <div className="space-y-1">
                    <p className="font-semibold text-base">
                        Lot {p.lot} • {p.nature}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {p.vocation} {p.contenance && `• ${p.contenance} m²`}
                    </p>
                </div>
            );
        }
    };
    
    return (
        <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
                
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                            imp.entity_type === 'demandeur' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                            {getEntityIcon(imp.entity_type)}
                        </div>
                        <div>
                            {getMainInfo()}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {getStatusBadge(imp.status)}
                        {imp.is_duplicate && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                                {imp.duplicate_action}
                            </Badge>
                        )}
                    </div>
                </div>
                
                {/* Informations dossier */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Dossier:</span>
                        <span className="font-medium truncate">{imp.dossier_nom}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Opérateur:</span>
                        <span className="font-medium truncate">{imp.topo_user_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">
                            {new Date(imp.import_date).toLocaleDateString('fr-FR')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Fichiers:</span>
                        <span className="font-medium">{imp.files_count}</span>
                    </div>
                </div>
                
                {/* Erreurs */}
                {imp.has_errors && imp.error_summary && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-red-900">
                                Erreurs détectées
                            </p>
                            <p className="text-xs text-red-700 mt-1">
                                {imp.error_summary}
                            </p>
                        </div>
                    </div>
                )}
                
                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onViewDetails}
                        className="gap-2"
                    >
                        <Eye className="h-4 w-4" />
                        Détails
                    </Button>
                    
                    <div className="flex gap-2">
                        {imp.files_count > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onPreviewFiles}
                                className="gap-2"
                            >
                                <Paperclip className="h-4 w-4" />
                                Fichiers
                            </Button>
                        )}
                        
                        {/* Actions selon statut */}
                        {imp.is_archived ? (
                            <Button
                                size="sm"
                                onClick={onUnarchive}
                                variant="outline"
                                className="gap-2"
                            >
                                <ArchiveRestore className="h-4 w-4" />
                                Restaurer
                            </Button>
                        ) : imp.status === 'pending' && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onArchive}
                                    className="gap-2"
                                >
                                    <Archive className="h-4 w-4" />
                                    Archiver
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onReject}
                                    className="gap-2 text-red-600 hover:bg-red-50"
                                >
                                    <XCircle className="h-4 w-4" />
                                    Rejeter
                                </Button>
                                
                                <Button
                                    size="sm"
                                    onClick={onImport}
                                    disabled={!canValidate || imp.has_errors}
                                    className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                                >
                                    <Upload className="h-4 w-4" />
                                    Importer
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}