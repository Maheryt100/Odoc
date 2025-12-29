// resources/js/pages/TopoFlux/components/ImportCard.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
    FileText, 
    User, 
    MapPin, 
    Calendar,
    CheckCircle,
    XCircle,
    Eye,
    AlertTriangle,
    ChevronRight,
    Paperclip
} from 'lucide-react';
import { ImportCardProps } from '../types';

export default function ImportCard({
    import: imp,
    canValidate,
    onValidate,
    onReject,
    onViewDetails
}: ImportCardProps) {
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = () => {
        switch (imp.status) {
            case 'validated':
                return <Badge className="bg-green-500">Validé</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Rejeté</Badge>;
            default:
                return null;
        }
    };

    const getEntityLabel = () => {
        if (imp.entity_type === 'propriete') {
            return `Lot ${imp.raw_data.lot}`;
        }
        return `${imp.raw_data.nom_demandeur} ${imp.raw_data.prenom_demandeur || ''}`;
    };

    return (
        <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                            {imp.entity_type === 'propriete' ? (
                                <FileText className="h-5 w-5 text-blue-600" />
                            ) : (
                                <User className="h-5 w-5 text-green-600" />
                            )}
                            <h3 className="text-lg font-semibold">
                                {imp.entity_type === 'propriete' ? 'Propriété' : 'Demandeur'} - {getEntityLabel()}
                            </h3>
                            {imp.action_suggested === 'update' && (
                                <Badge variant="secondary">Mise à jour</Badge>
                            )}
                            {getStatusBadge()}
                        </div>
                        
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4" />
                                <span className="font-medium">N°{imp.dossier_numero_ouverture}</span>
                                <ChevronRight className="h-3 w-3" />
                                <span>{imp.dossier_nom}</span>
                                <span className="text-muted-foreground">•</span>
                                <span>{imp.district_nom}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {formatDate(imp.import_date)}
                                <span className="mx-2">•</span>
                                <User className="h-4 w-4" />
                                {imp.topo_user_name}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={onViewDetails}
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            Détails
                        </Button>
                        
                        {canValidate && (
                            <>
                                <Button 
                                    size="sm" 
                                    variant="default"
                                    onClick={onValidate}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Valider
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={onReject}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rejeter
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Match info */}
                {imp.matched_entity_id && (
                    <Alert className="bg-blue-50 border-blue-200">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                        <AlertTitle>Entité existante détectée</AlertTitle>
                        <AlertDescription>
                            {imp.entity_type === 'propriete' 
                                ? `Lot ${imp.matched_entity_details?.lot}` 
                                : `${imp.matched_entity_details?.nom_demandeur}`} | 
                            Confiance: {(imp.match_confidence! * 100).toFixed(0)}% 
                            ({imp.match_method})
                        </AlertDescription>
                    </Alert>
                )}

                {/* Warnings */}
                {imp.has_warnings && imp.warnings && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Avertissements</AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc list-inside mt-1">
                                {imp.warnings.slice(0, 3).map((w, i) => (
                                    <li key={i} className="text-sm">{w}</li>
                                ))}
                                {imp.warnings.length > 3 && (
                                    <li className="text-sm italic">
                                        ... et {imp.warnings.length - 3} autre(s)
                                    </li>
                                )}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Fichiers */}
                {imp.files_count > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Paperclip className="h-4 w-4" />
                        {imp.files_count} fichier(s) joint(s)
                    </div>
                )}

                {/* Motif de rejet */}
                {imp.status === 'rejected' && imp.rejection_reason && (
                    <Alert>
                        <AlertDescription>
                            <strong>Motif de rejet :</strong> {imp.rejection_reason}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}