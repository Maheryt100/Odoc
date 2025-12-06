// components/ProprieteDetailDialog.tsx - VERSION CORRIGÉE
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Home, MapPin, FileText, Hash, Calendar, Users, Archive, 
    AlertCircle, Unlink, Pencil, Landmark, Scale, Flag,
    MapPinned, Ruler, FileCheck, Building2, CreditCard
} from 'lucide-react';

interface Propriete {
    id: number;
    lot: string;
    titre?: string;
    type_operation: string;
    contenance?: number;
    proprietaire?: string;
    propriete_mere?: string;
    titre_mere?: string;
    nature?: string;
    vocation?: string;
    situation?: string;
    charge?: string;
    numero_FN?: string;
    numero_requisition?: string;
    date_requisition?: string;
    date_inscription?: string;
    dep_vol?: string;
    numero_dep_vol?: string;
    dep_vol_complet?: string;
    is_archived?: boolean;
    status_label?: string;
    demandes?: Array<{
        id: number;
        ordre: number;
        status: 'active' | 'archive';
        total_prix: number;
        demandeur?: {
            id: number;
            titre_demandeur: string;
            nom_demandeur: string;
            prenom_demandeur?: string;
            cin: string;
        };
    }>;
}

interface Demandeur {
    id: number;
    titre_demandeur: string;
    nom_demandeur: string;
    prenom_demandeur?: string;
    cin: string;
}

interface ProprieteDetailDialogProps {
    propriete: Propriete | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectDemandeur?: (demandeur: Demandeur) => void;
    dossierClosed?: boolean;
    onDissociate?: (
        demandeurId: number,
        proprieteId: number,
        demandeurNom: string,
        proprieteLot: string,
        type: 'from-demandeur' | 'from-propriete'
    ) => void;
}

export default function ProprieteDetailDialog({
    propriete,
    open,
    onOpenChange,
    onSelectDemandeur,
    dossierClosed = false,
    onDissociate
}: ProprieteDetailDialogProps) {
    if (!propriete) return null;

    // ✅ Utiliser UNIQUEMENT propriete.demandes
    const demandeursActifs = propriete.demandes?.filter(d => d.status === 'active')
        .sort((a, b) => a.ordre - b.ordre) || [];
    
    const demandeursAcquis = propriete.demandes?.filter(d => d.status === 'archive')
        .sort((a, b) => a.ordre - b.ordre) || [];

    const formatNomComplet = (demandeur: Demandeur): string => {
        return [
            demandeur.titre_demandeur,
            demandeur.nom_demandeur,
            demandeur.prenom_demandeur
        ].filter(Boolean).join(' ');
    };

    const formatDate = (date?: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatContenance = (contenance?: number) => {
        if (!contenance) return '-';
        return new Intl.NumberFormat('fr-FR', { 
            minimumFractionDigits: 0,
            maximumFractionDigits: 2 
        }).format(contenance) + ' m²';
    };

    const formatPrix = (prix?: number) => {
        if (!prix) return '-';
        return new Intl.NumberFormat('fr-FR').format(prix) + ' Ar';
    };

    const handleDissociate = (demande: any, e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (!onDissociate || dossierClosed || propriete.is_archived) {
            return;
        }
        
        onOpenChange(false);
        
        setTimeout(() => {
            const demandeur = demande.demandeur;
            if (demandeur) {
                onDissociate(
                    demandeur.id,
                    propriete.id,
                    formatNomComplet(demandeur),
                    propriete.lot,
                    'from-propriete'
                );
            }
        }, 100);
    };

    const canDissociate = (demande: any): boolean => {
        return !dossierClosed && 
               !propriete.is_archived && 
               demande.status === 'active';
    };

    const InfoItem = ({ icon: Icon, label, value, valueClass = '' }: any) => {
        if (!value || value === '-') return null;
        return (
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
                    <p className={`text-sm font-medium break-words ${valueClass}`}>{value}</p>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header Fixe */}
                <DialogHeader className="pb-4 border-b">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <DialogTitle className="text-3xl flex items-center gap-3 mb-2">
                                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                                    <Home className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                                </div>
                                <span>Lot {propriete.lot}</span>
                            </DialogTitle>
                            
                            <div className="flex flex-wrap items-center gap-2 ml-14">
                                {propriete.titre && (
                                    <Badge variant="outline" className="font-mono text-sm">
                                        TNº{propriete.titre}
                                    </Badge>
                                )}
                                <Badge variant="outline" className="text-sm capitalize">
                                    {propriete.type_operation}
                                </Badge>
                                {propriete.is_archived ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-400">
                                        <Archive className="mr-1 h-3 w-3" />
                                        Acquise
                                    </Badge>
                                ) : demandeursActifs.length > 0 ? (
                                    <Badge variant="default" className="text-sm">
                                        <Users className="mr-1 h-3 w-3" />
                                        {demandeursActifs.length} demandeur{demandeursActifs.length > 1 ? 's' : ''}
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="text-sm">
                                        Sans demandeur
                                    </Badge>
                                )}
                            </div>
                        </div>
                        
                        {!dossierClosed && !propriete.is_archived && (
                            <Button 
                                onClick={() => {
                                    onOpenChange(false);
                                    setTimeout(() => {
                                        window.location.href = `/proprietes/${propriete.id}/edit`;
                                    }, 100);
                                }}
                                size="sm"
                                className="shrink-0"
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Modifier
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                {/* Contenu Scrollable */}
                <div className="flex-1 overflow-y-auto px-1">
                    <Tabs defaultValue="informations" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="informations">
                                <FileText className="mr-2 h-4 w-4" />
                                Informations
                            </TabsTrigger>
                            <TabsTrigger value="cadastre">
                                <Landmark className="mr-2 h-4 w-4" />
                                Cadastre
                            </TabsTrigger>
                            <TabsTrigger value="demandeurs">
                                <Users className="mr-2 h-4 w-4" />
                                Demandeurs ({demandeursActifs.length + demandeursAcquis.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* ONGLET 1: INFORMATIONS GÉNÉRALES */}
                        <TabsContent value="informations" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Building2 className="h-5 w-5" />
                                        Identification
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-3">
                                    <InfoItem 
                                        icon={Hash} 
                                        label="Numéro de Lot" 
                                        value={propriete.lot}
                                        valueClass="text-lg font-bold text-primary"
                                    />
                                    <InfoItem 
                                        icon={FileText} 
                                        label="Titre Foncier" 
                                        value={propriete.titre ? `TNº${propriete.titre}` : '-'}
                                        valueClass="font-mono"
                                    />
                                    <InfoItem 
                                        icon={Flag} 
                                        label="Type d'Opération" 
                                        value={propriete.type_operation}
                                        valueClass="capitalize"
                                    />
                                    <InfoItem 
                                        icon={MapPin} 
                                        label="Nature" 
                                        value={propriete.nature}
                                    />
                                    <InfoItem 
                                        icon={Landmark} 
                                        label="Vocation" 
                                        value={propriete.vocation}
                                    />
                                    <InfoItem 
                                        icon={Ruler} 
                                        label="Contenance" 
                                        value={formatContenance(propriete.contenance)}
                                        valueClass="text-lg font-semibold text-blue-600"
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Users className="h-5 w-5" />
                                        Localisation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <InfoItem 
                                        icon={Users} 
                                        label="Propriétaire" 
                                        value={propriete.proprietaire}
                                        valueClass="font-semibold"
                                    />
                                    <InfoItem 
                                        icon={MapPinned} 
                                        label="Situation" 
                                        value={propriete.situation}
                                    />
                                    <InfoItem 
                                        icon={Scale} 
                                        label="Charges" 
                                        value={propriete.charge}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ONGLET 2: RÉFÉRENCES CADASTRALES */}
                        <TabsContent value="cadastre" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <FileCheck className="h-5 w-5" />
                                        Origine
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-3">
                                    <InfoItem 
                                        icon={FileText} 
                                        label="Propriété Mère" 
                                        value={propriete.propriete_mere}
                                    />
                                    <InfoItem 
                                        icon={FileText} 
                                        label="Titre Mère" 
                                        value={propriete.titre_mere}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Landmark className="h-5 w-5" />
                                        Références
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-3">
                                    <InfoItem 
                                        icon={FileText} 
                                        label="Dépôt/Volume" 
                                        value={propriete.dep_vol_complet || propriete.dep_vol}
                                        valueClass="font-mono"
                                    />
                                    <InfoItem 
                                        icon={Hash} 
                                        label="Numéro FN" 
                                        value={propriete.numero_FN}
                                        valueClass="font-mono"
                                    />
                                    <InfoItem 
                                        icon={Hash} 
                                        label="Numéro Réquisition" 
                                        value={propriete.numero_requisition}
                                        valueClass="font-mono"
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Calendar className="h-5 w-5" />
                                        Dates
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-3">
                                    <InfoItem 
                                        icon={Calendar} 
                                        label="Réquisition" 
                                        value={formatDate(propriete.date_requisition)}
                                    />
                                    <InfoItem 
                                        icon={Calendar} 
                                        label="Inscription" 
                                        value={formatDate(propriete.date_inscription)}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ONGLET 3: DEMANDEURS */}
                        <TabsContent value="demandeurs" className="space-y-6">
                            {/* Actifs */}
                            {demandeursActifs.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Users className="h-5 w-5 text-blue-600" />
                                            Actifs ({demandeursActifs.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {demandeursActifs.map((demande) => (
                                            <div
                                                key={demande.id}
                                                className="p-4 border rounded-lg hover:bg-muted/50 transition-all hover:shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <button
                                                        onClick={() => {
                                                            if (onSelectDemandeur && demande.demandeur) {
                                                                onOpenChange(false);
                                                                setTimeout(() => {
                                                                    onSelectDemandeur(demande.demandeur!);
                                                                }, 100);
                                                            }
                                                        }}
                                                        className="flex-1 text-left group"
                                                    >
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge variant={demande.ordre === 1 ? 'default' : 'secondary'}>
                                                                {demande.ordre === 1 ? '👑 Principal' : `Consort #${demande.ordre}`}
                                                            </Badge>
                                                        </div>
                                                        <p className="font-semibold text-lg group-hover:text-primary transition-colors mb-1">
                                                            {demande.demandeur ? formatNomComplet(demande.demandeur) : 'Inconnu'}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground font-mono mb-2">
                                                            CIN: {demande.demandeur?.cin || 'N/A'}
                                                        </p>
                                                        {demande.total_prix > 0 && (
                                                            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                                                                <CreditCard className="h-4 w-4" />
                                                                {formatPrix(demande.total_prix)}
                                                            </div>
                                                        )}
                                                    </button>
                                                    
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Badge variant="default" className="text-xs">
                                                            Actif
                                                        </Badge>
                                                        {canDissociate(demande) && onDissociate && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={(e) => handleDissociate(demande, e)}
                                                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                            >
                                                                <Unlink className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Acquis */}
                            {demandeursAcquis.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Archive className="h-5 w-5 text-green-600" />
                                            Acquis ({demandeursAcquis.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {demandeursAcquis.map((demande) => (
                                            <button
                                                key={demande.id}
                                                onClick={() => {
                                                    if (onSelectDemandeur && demande.demandeur) {
                                                        onOpenChange(false);
                                                        setTimeout(() => {
                                                            onSelectDemandeur(demande.demandeur!);
                                                        }, 100);
                                                    }
                                                }}
                                                className="w-full p-4 border rounded-lg hover:bg-muted/50 transition-all text-left bg-green-50/50 dark:bg-green-950/20"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge variant={demande.ordre === 1 ? 'default' : 'secondary'}>
                                                                {demande.ordre === 1 ? '👑' : `#${demande.ordre}`}
                                                            </Badge>
                                                        </div>
                                                        <p className="font-semibold text-lg mb-1">
                                                            {demande.demandeur ? formatNomComplet(demande.demandeur) : 'Inconnu'}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground font-mono">
                                                            {demande.demandeur?.cin || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                                        <Archive className="mr-1 h-3 w-3" />
                                                        Acquise
                                                    </Badge>
                                                </div>
                                            </button>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Vide */}
                            {demandeursActifs.length === 0 && demandeursAcquis.length === 0 && (
                                <Card>
                                    <CardContent className="text-center py-12">
                                        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                                        <p className="text-lg font-medium text-muted-foreground">Aucun demandeur</p>
                                        <p className="text-sm text-muted-foreground/70 mt-2">
                                            Propriété non attribuée
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}