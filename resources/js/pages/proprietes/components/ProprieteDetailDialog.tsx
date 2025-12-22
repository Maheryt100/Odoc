// proprietes/components/ProprieteDetailDialog.tsx
// ✅ VERSION FINALE OPTIMISÉE AVEC NOUVELLES DATES

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Home, MapPin, FileText, Hash, Calendar, Users, Archive, 
    AlertCircle, Unlink, Landmark, Scale, Flag,
    MapPinned, Ruler, FileCheck, Building2, CreditCard, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Demandeur, Propriete } from '@/types';


// interface Propriete {
//     id: number;
//     lot: string;
//     titre?: string;
//     titre_complet?: string;
//     type_operation: string;
//     contenance?: number;
//     proprietaire?: string;
//     propriete_mere?: string;
//     titre_mere?: string;
//     nature?: string;
//     vocation?: string;
//     situation?: string;
//     charge?: string;
//     numero_FN?: string;
//     numero_requisition?: string;
    
//     // ✅ DATES CORRIGÉES
//     date_requisition?: string;
//     date_depot_1?: string;              // ✅ Ancien date_inscription
//     date_depot_2?: string;              // ✅ NOUVEAU
//     date_approbation_acte?: string;     // ✅ NOUVEAU
    
//     // Dep/Vol
//     dep_vol_inscription?: string;
//     numero_dep_vol_inscription?: string;
//     dep_vol_inscription_complet?: string;
//     dep_vol_requisition?: string;
//     numero_dep_vol_requisition?: string;
//     dep_vol_requisition_complet?: string;
    
//     // Status
//     is_archived?: boolean;
//     status_label?: string;
//     can_generate_document?: boolean;
//     document_block_reason?: string;
    
//     // Relations
//     demandes?: Array<{
//         id: number;
//         ordre: number;
//         status: 'active' | 'archive';
//         total_prix: number;
//         demandeur?: {
//             id: number;
//             titre_demandeur: string;
//             nom_demandeur: string;
//             prenom_demandeur?: string;
//             cin: string;
//         };
//     }>;
// }

// interface Demandeur {
//     id: number;
//     titre_demandeur: string;
//     nom_demandeur: string;
//     prenom_demandeur?: string;
//     cin: string;
// }

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

    const formatDate = (date?: string | null) => {  // ✅ Accepte null
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatContenance = (contenance?: number | null) => {  // ✅ Accepte null
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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
                                {propriete.titre_complet && (
                                    <Badge variant="outline" className="font-mono text-sm">
                                        {propriete.titre_complet}
                                    </Badge>
                                )}
                                {!propriete.titre_complet && propriete.titre && (
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
                                
                                {/* Badge statut document */}
                                {/* {propriete.can_generate_document ? (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                        Prêt pour document
                                    </Badge>
                                ) : propriete.document_block_reason && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                                        <AlertCircle className="mr-1 h-3 w-3" />
                                        Date approbation manquante
                                    </Badge>
                                )} */}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-1">
                    <Tabs defaultValue="informations" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="informations">
                                <FileText className="mr-2 h-4 w-4" />
                                Informations
                            </TabsTrigger>
                            <TabsTrigger value="dates">
                                <Calendar className="mr-2 h-4 w-4" />
                                Dates & Références
                            </TabsTrigger>
                            <TabsTrigger value="demandeurs">
                                <Users className="mr-2 h-4 w-4" />
                                Demandeurs ({demandeursActifs.length + demandeursAcquis.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* TAB INFORMATIONS */}
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
                                        value={propriete.titre_complet || (propriete.titre ? `TNº${propriete.titre}` : '-')}
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

                            {propriete.type_operation === 'morcellement' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <FileCheck className="h-5 w-5" />
                                            Origine (Morcellement)
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
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Users className="h-5 w-5" />
                                        Localisation & Propriété
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

                        {/* ✅ TAB DATES & RÉFÉRENCES - NOUVELLE STRUCTURE */}
                        <TabsContent value="dates" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Landmark className="h-5 w-5" />
                                        Références Administratives
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-3">
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

                            {/* ✅ DATES DE DÉPÔT */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Calendar className="h-5 w-5" />
                                        Dates de Dépôt
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Dépôt 1 - Inscription */}
                                    <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                Dépôt 1
                                            </Badge>
                                            <h6 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                                Inscription
                                            </h6>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-3">
                                            <InfoItem 
                                                icon={Calendar} 
                                                label="Date dépôt 1" 
                                                value={formatDate(propriete.date_depot_1)}
                                            />
                                            <InfoItem 
                                                icon={FileText} 
                                                label="Dépôt/Volume" 
                                                value={propriete.dep_vol_inscription_complet || propriete.dep_vol_inscription}
                                                valueClass="font-mono"
                                            />
                                        </div>
                                    </div>

                                    {/* Dépôt 2 - Réquisition */}
                                    <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                                Dépôt 2
                                            </Badge>
                                            <h6 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                                                Réquisition
                                            </h6>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-3">
                                            <InfoItem 
                                                icon={Calendar} 
                                                label="Date dépôt 2" 
                                                value={formatDate(propriete.date_depot_2)}
                                            />
                                            <InfoItem 
                                                icon={FileText} 
                                                label="Dépôt/Volume" 
                                                value={propriete.dep_vol_requisition_complet || propriete.dep_vol_requisition}
                                                valueClass="font-mono"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* ✅ DATES ADMINISTRATIVES */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <FileCheck className="h-5 w-5" />
                                        Dates Administratives
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-lg border">
                                        <div className="grid md:grid-cols-2 gap-3">
                                            <InfoItem 
                                                icon={Calendar} 
                                                label="Date réquisition" 
                                                value={formatDate(propriete.date_requisition)}
                                            />
                                            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg mt-0.5">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-muted-foreground mb-0.5">
                                                        Date approbation acte
                                                        {/* <Badge variant="destructive" className="text-[9px] px-1 py-0 ml-2">
                                                            Obligatoire
                                                        </Badge> */}
                                                    </p>
                                                    <p className={`text-sm font-medium ${propriete.date_approbation_acte ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                                        {formatDate(propriete.date_approbation_acte)}
                                                    </p>
                                                    {!propriete.date_approbation_acte && (
                                                        <p className="text-xs text-red-500 mt-1">
                                                            Requis pour générer le document
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB DEMANDEURS */}
                        <TabsContent value="demandeurs" className="space-y-6">
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
                                                                {demande.ordre === 1 ? 'Principal' : `Consort #${demande.ordre}`}
                                                            </Badge>
                                                        </div>
                                                        <p className="font-semibold text-lg group-hover:text-primary transition-colors mb-1">
                                                            {demande.demandeur ? formatNomComplet(demande.demandeur) : 'Inconnu'}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground font-mono mb-2">
                                                            CIN: {demande.demandeur?.cin || 'N/A'}
                                                        </p>
                                                        {/* {demande.total_prix > 0 && (
                                                            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                                                                <CreditCard className="h-4 w-4" />
                                                                {formatPrix(demande.total_prix)}
                                                            </div>
                                                        )} */}
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