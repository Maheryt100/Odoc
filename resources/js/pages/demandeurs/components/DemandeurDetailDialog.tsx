// demandeurs/components/DemandeurDetailDialog.tsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    User, Calendar, MapPin, Phone, FileText, Heart, Briefcase, 
    Users, Home, Pencil, Archive, AlertCircle, Unlink,
    Building2, Flag, MapPinned, CreditCard
} from 'lucide-react';


interface Demandeur {
    id: number;
    titre_demandeur: string;
    nom_demandeur: string;
    prenom_demandeur?: string;
    cin: string;
    date_naissance?: string;
    lieu_naissance?: string;
    sexe?: string;
    occupation?: string;
    nom_pere?: string;
    nom_mere?: string;
    date_delivrance?: string;
    lieu_delivrance?: string;
    date_delivrance_duplicata?: string;
    lieu_delivrance_duplicata?: string;
    domiciliation?: string;
    telephone?: string;
    nationalite?: string;
    situation_familiale?: string;
    regime_matrimoniale?: string;
    date_mariage?: string;
    lieu_mariage?: string;
    marie_a?: string;
}

interface Propriete {
    id: number;
    lot: string;
    titre?: string;
    contenance?: number;
    nature?: string;
    vocation?: string;
    situation?: string;
    is_archived?: boolean;
    demandes?: Array<{
        id: number;
        id_demandeur: number;
        status: 'active' | 'archive';
        ordre: number;
        total_prix?: number;
    }>;
}

interface DemandeurDetailDialogProps {
    demandeur: Demandeur | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    proprietes?: Propriete[];
    onSelectPropriete?: (propriete: Propriete) => void;
    dossierId: number;
    dossierClosed?: boolean;
    onDissociate?: (
        demandeurId: number,
        proprieteId: number,
        demandeurNom: string,
        proprieteLot: string,
        type: 'from-demandeur' | 'from-propriete'
    ) => void;
}

export default function DemandeurDetailDialog({
    demandeur,
    open,
    onOpenChange,
    proprietes = [],
    onSelectPropriete,
    dossierId,
    dossierClosed = false,
    onDissociate
}: DemandeurDetailDialogProps) {
    if (!demandeur) return null;

    const proprietesAssociees = proprietes.filter(prop => {
        if (!prop.demandes?.length) return false;
        return prop.demandes.some(d => {
            const dId = typeof d.id_demandeur === 'number' 
                ? d.id_demandeur 
                : parseInt(d.id_demandeur as any);
            const curId = typeof demandeur.id === 'number' 
                ? demandeur.id 
                : parseInt(demandeur.id as any);
            return dId === curId;
        });
    });

    const proprietesActives = proprietesAssociees.filter(p => {
        return p.demandes?.some(d => {
            const dId = typeof d.id_demandeur === 'number' ? d.id_demandeur : parseInt(d.id_demandeur as any);
            const curId = typeof demandeur.id === 'number' ? demandeur.id : parseInt(demandeur.id as any);
            return dId === curId && d.status === 'active';
        });
    });

    const proprietesAcquises = proprietesAssociees.filter(p => {
        return p.demandes?.some(d => {
            const dId = typeof d.id_demandeur === 'number' ? d.id_demandeur : parseInt(d.id_demandeur as any);
            const curId = typeof demandeur.id === 'number' ? demandeur.id : parseInt(demandeur.id as any);
            return dId === curId && d.status === 'archive';
        });
    });

    const formatNomComplet = (): string => {
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

    const calculateAge = (birthDate?: string) => {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const formatPrix = (prix?: number) => {
        if (!prix) return '-';
        return new Intl.NumberFormat('fr-FR').format(prix) + ' Ar';
    };

    const handleDissociate = (propriete: Propriete, e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (!onDissociate || dossierClosed || !canDissociate(propriete)) {
            return;
        }
        
        onOpenChange(false);
        
        setTimeout(() => {
            onDissociate(
                demandeur.id,
                propriete.id,
                formatNomComplet(),
                propriete.lot,
                'from-demandeur'
            );
        }, 100);
    };

    const canDissociate = (propriete: Propriete): boolean => {
        if (dossierClosed || propriete.is_archived) return false;
        
        const demande = propriete.demandes?.find(d => {
            const dId = typeof d.id_demandeur === 'number' ? d.id_demandeur : parseInt(d.id_demandeur as any);
            const curId = typeof demandeur.id === 'number' ? demandeur.id : parseInt(demandeur.id as any);
            return dId === curId;
        });
        
        return demande?.status === 'active';
    };

    const handleSelectPropriete = (propriete: Propriete) => {
        if (onSelectPropriete) {
            onOpenChange(false);
            setTimeout(() => onSelectPropriete(propriete), 100);
        }
    };

    const handleEdit = () => {
        onOpenChange(false);
        setTimeout(() => {
            window.location.href = `/demandeurs/${dossierId}/${demandeur.id}/edit`;
        }, 100);
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

    const age = calculateAge(demandeur.date_naissance);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-4 border-b">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <DialogTitle className="text-3xl flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                    <User className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span>{formatNomComplet()}</span>
                            </DialogTitle>
                            
                            <div className="flex flex-wrap items-center gap-2 ml-14">
                                <Badge variant="outline" className="font-mono text-sm">
                                    <FileText className="mr-1 h-3 w-3" />
                                    {demandeur.cin}
                                </Badge>
                                {age && (
                                    <Badge variant="outline" className="text-sm">
                                        {age} ans
                                    </Badge>
                                )}
                                {demandeur.sexe && (
                                    <Badge variant="outline" className="text-sm">
                                        {demandeur.sexe}
                                    </Badge>
                                )}
                                {proprietesActives.length > 0 && (
                                    <Badge variant="default" className="text-sm">
                                        <Building2 className="mr-1 h-3 w-3" />
                                        {proprietesActives.length} active{proprietesActives.length > 1 ? 's' : ''}
                                    </Badge>
                                )}
                                {proprietesAcquises.length > 0 && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-sm">
                                        <Archive className="mr-1 h-3 w-3" />
                                        {proprietesAcquises.length} acquise{proprietesAcquises.length > 1 ? 's' : ''}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-1">
                    <Tabs defaultValue="identite" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="identite">
                                <User className="mr-2 h-4 w-4" />
                                Identité
                            </TabsTrigger>
                            <TabsTrigger value="cin">
                                <FileText className="mr-2 h-4 w-4" />
                                CIN
                            </TabsTrigger>
                            <TabsTrigger value="contact">
                                <Home className="mr-2 h-4 w-4" />
                                Contact
                            </TabsTrigger>
                            <TabsTrigger value="proprietes">
                                <Building2 className="mr-2 h-4 w-4" />
                                Propriétés ({proprietesAssociees.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* IDENTITÉ */}
                        <TabsContent value="identite" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <User className="h-5 w-5" />
                                        Informations Personnelles
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-3">
                                    <InfoItem 
                                        icon={User} 
                                        label="Nom Complet" 
                                        value={formatNomComplet()}
                                        valueClass="text-lg font-bold text-primary"
                                    />
                                    <InfoItem 
                                        icon={User} 
                                        label="Sexe" 
                                        value={demandeur.sexe}
                                    />
                                    <InfoItem 
                                        icon={Calendar} 
                                        label="Date de Naissance" 
                                        value={`${formatDate(demandeur.date_naissance)}${age ? ` (${age} ans)` : ''}`}
                                    />
                                    <InfoItem 
                                        icon={MapPin} 
                                        label="Lieu de Naissance" 
                                        value={demandeur.lieu_naissance}
                                    />
                                    <InfoItem 
                                        icon={Flag} 
                                        label="Nationalité" 
                                        value={demandeur.nationalite || 'Malagasy'}
                                    />
                                    <InfoItem 
                                        icon={Briefcase} 
                                        label="Profession" 
                                        value={demandeur.occupation}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* CIN */}
                        <TabsContent value="cin" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <FileText className="h-5 w-5" />
                                        Informations CIN
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-3">
                                    <InfoItem 
                                        icon={FileText} 
                                        label="Numéro CIN" 
                                        value={demandeur.cin}
                                        valueClass="font-mono text-lg font-bold text-primary"
                                    />
                                    <InfoItem 
                                        icon={Calendar} 
                                        label="Date de Délivrance" 
                                        value={formatDate(demandeur.date_delivrance)}
                                    />
                                    <InfoItem 
                                        icon={MapPin} 
                                        label="Lieu de Délivrance" 
                                        value={demandeur.lieu_delivrance}
                                    />
                                    <InfoItem 
                                        icon={User} 
                                        label="Nom" 
                                        value={demandeur.nom_demandeur}
                                        valueClass="font-semibold"
                                    />
                                    <InfoItem 
                                        icon={User} 
                                        label="Prénom(s)" 
                                        value={demandeur.prenom_demandeur}
                                        valueClass="font-semibold"
                                    />
                                    <InfoItem 
                                        icon={Calendar} 
                                        label="Date de Naissance" 
                                        value={formatDate(demandeur.date_naissance)}
                                    />
                                    <InfoItem 
                                        icon={MapPin} 
                                        label="Lieu de Naissance" 
                                        value={demandeur.lieu_naissance}
                                    />
                                    <InfoItem 
                                        icon={MapPinned} 
                                        label="Domiciliation" 
                                        value={demandeur.domiciliation}
                                    />
                                    <InfoItem 
                                        icon={Briefcase} 
                                        label="Profession" 
                                        value={demandeur.occupation}
                                    />
                                    <InfoItem 
                                        icon={Users} 
                                        label="Nom du Père" 
                                        value={demandeur.nom_pere}
                                    />
                                    <InfoItem 
                                        icon={Users} 
                                        label="Nom de la Mère" 
                                        value={demandeur.nom_mere}
                                    />
                                </CardContent>
                            </Card>

                            {(demandeur.date_delivrance_duplicata || demandeur.lieu_delivrance_duplicata) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg text-orange-600">
                                            <FileText className="h-5 w-5" />
                                            Duplicata CIN
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid md:grid-cols-2 gap-3">
                                        <InfoItem 
                                            icon={Calendar} 
                                            label="Date de Délivrance" 
                                            value={formatDate(demandeur.date_delivrance_duplicata)}
                                        />
                                        <InfoItem 
                                            icon={MapPin} 
                                            label="Lieu de Délivrance" 
                                            value={demandeur.lieu_delivrance_duplicata}
                                        />
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* CONTACT */}
                        <TabsContent value="contact" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Home className="h-5 w-5" />
                                        Domicile
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <InfoItem 
                                        icon={MapPinned} 
                                        label="Adresse" 
                                        value={demandeur.domiciliation}
                                        valueClass="text-base"
                                    />
                                    <InfoItem 
                                        icon={Phone} 
                                        label="Téléphone" 
                                        value={demandeur.telephone}
                                        valueClass="font-mono text-lg"
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Heart className="h-5 w-5" />
                                        Situation Familiale
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-3">
                                    <InfoItem 
                                        icon={Heart} 
                                        label="Situation" 
                                        value={demandeur.situation_familiale || 'Non spécifiée'}
                                    />
                                    <InfoItem 
                                        icon={FileText} 
                                        label="Régime" 
                                        value={demandeur.regime_matrimoniale || 'Non spécifié'}
                                    />
                                </CardContent>
                            </Card>

                            {demandeur.situation_familiale === 'Marié(e)' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg text-pink-600">
                                            <Users className="h-5 w-5" />
                                            Mariage
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid md:grid-cols-2 gap-3">
                                        <InfoItem 
                                            icon={Users} 
                                            label="Marié(e) à" 
                                            value={demandeur.marie_a}
                                            valueClass="font-semibold"
                                        />
                                        <InfoItem 
                                            icon={Calendar} 
                                            label="Date" 
                                            value={formatDate(demandeur.date_mariage)}
                                        />
                                        <InfoItem 
                                            icon={MapPin} 
                                            label="Lieu" 
                                            value={demandeur.lieu_mariage}
                                        />
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* PROPRIÉTÉS */}
                        <TabsContent value="proprietes" className="space-y-6">
                            {proprietesActives.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Building2 className="h-5 w-5 text-blue-600" />
                                            Actives ({proprietesActives.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {proprietesActives.map((prop) => {
                                            const demande = prop.demandes?.find(d => {
                                                const dId = typeof d.id_demandeur === 'number' ? d.id_demandeur : parseInt(d.id_demandeur as any);
                                                const curId = typeof demandeur.id === 'number' ? demandeur.id : parseInt(demandeur.id as any);
                                                return dId === curId;
                                            });
                                            
                                            return (
                                                <div key={prop.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-all hover:shadow-sm">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <button onClick={() => handleSelectPropriete(prop)} className="flex-1 text-left group">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge variant={demande?.ordre === 1 ? 'default' : 'secondary'}>
                                                                    {demande?.ordre === 1 ? '👑' : `#${demande?.ordre}`}
                                                                </Badge>
                                                            </div>
                                                            <p className="font-semibold text-lg group-hover:text-primary transition-colors mb-1">
                                                                Lot {prop.lot}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {prop.titre && `TNº${prop.titre} • `}
                                                                {prop.nature} • {prop.vocation}
                                                                {prop.contenance && ` • ${new Intl.NumberFormat('fr-FR').format(prop.contenance)} m²`}
                                                            </p>
                                                            {demande?.total_prix && demande.total_prix > 0 && (
                                                                <div className="flex items-center gap-2 text-sm font-medium text-green-600 mt-2">
                                                                    <CreditCard className="h-4 w-4" />
                                                                    {formatPrix(demande.total_prix)}
                                                                </div>
                                                            )}
                                                        </button>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <Badge variant="default" className="text-xs">Actif</Badge>
                                                            {canDissociate(prop) && onDissociate && (
                                                                <Button variant="outline" size="sm" onClick={(e) => handleDissociate(prop, e)} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                                                                    <Unlink className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            )}

                            {proprietesAcquises.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Archive className="h-5 w-5 text-green-600" />
                                            Acquises ({proprietesAcquises.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {proprietesAcquises.map((prop) => {
                                            const demande = prop.demandes?.find(d => {
                                                const dId = typeof d.id_demandeur === 'number' ? d.id_demandeur : parseInt(d.id_demandeur as any);
                                                const curId = typeof demandeur.id === 'number' ? demandeur.id : parseInt(demandeur.id as any);
                                                return dId === curId;
                                            });
                                            
                                            return (
                                                <button key={prop.id} onClick={() => handleSelectPropriete(prop)} className="w-full p-4 border rounded-lg hover:bg-muted/50 transition-all text-left bg-green-50/50 dark:bg-green-950/20">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge variant={demande?.ordre === 1 ? 'default' : 'secondary'}>
                                                                    {demande?.ordre === 1 ? '👑' : `#${demande?.ordre}`}
                                                                </Badge>
                                                            </div>
                                                            <p className="font-semibold text-lg mb-1">Lot {prop.lot}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {prop.titre && `TNº${prop.titre} • `}
                                                                {prop.nature} • {prop.vocation}
                                                                {prop.contenance && ` • ${new Intl.NumberFormat('fr-FR').format(prop.contenance)} m²`}
                                                            </p>
                                                        </div>
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                                            <Archive className="mr-1 h-3 w-3" />
                                                            Acquise
                                                        </Badge>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            )}

                            {proprietesAssociees.length === 0 && (
                                <Card>
                                    <CardContent className="text-center py-12">
                                        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                                        <p className="text-lg font-medium text-muted-foreground">Aucune propriété</p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* {!dossierClosed && (
                    <DialogFooter className="pt-4 border-t">
                        <Button onClick={handleEdit} size="default">
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier ce demandeur
                        </Button>
                    </DialogFooter>
                )} */}
            </DialogContent>
        </Dialog>
    );
}