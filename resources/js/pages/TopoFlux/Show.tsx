// resources/js/pages/TopoFlux/Show.tsx
// ✅ VERSION CORRIGÉE - CLÉS UNIQUES ET STRUCTURE AMÉLIORÉE

import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    ArrowLeft,
    FileText,
    User,
    MapPin,
    Calendar,
    Paperclip,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Upload,
    Loader2
} from 'lucide-react';
import type { BreadcrumbItem, PageProps } from '@/types';
import { toast } from 'sonner';

interface Import {
    id: number;
    entity_type: 'demandeur' | 'propriete';
    batch_id: string;
    status: 'pending' | 'archived' | 'validated' | 'rejected';
    numero_ouverture: string;
    dossier_id?: number;
    dossier_nom: string;
    dossier_numero_ouverture?: number;
    district_id: number;
    district_nom: string;
    topo_user_name: string;
    import_date: string;
    raw_data: Record<string, any>;
    rejection_reason?: string;
    processed_at?: string;
}

interface File {
    id: number;
    name: string;
    size: number;
    mime_type: string;
    category: string;
}

interface Props extends PageProps {
    import: Import;
    files: File[];
    canValidate: boolean;
}

export default function Show({ import: imp, files, canValidate }: Props) {
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleReject = () => {
        if (rejectReason.length < 10) {
            toast.error('Le motif doit contenir au moins 10 caractères');
            return;
        }

        setProcessing(true);
        router.post(
            route('topo-flux.reject', imp.id),
            { rejection_reason: rejectReason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Import rejeté avec succès');
                    setShowRejectModal(false);
                    setRejectReason('');
                },
                onError: (errors) => {
                    toast.error('Erreur', {
                        description: Object.values(errors).join(', ')
                    });
                },
                onFinish: () => setProcessing(false)
            }
        );
    };

    const handleImport = () => {
        setProcessing(true);
        router.post(
            route('topo-flux.import', imp.id),
            {},
            {
                preserveScroll: true,
                onError: (errors) => {
                    toast.error('Erreur', {
                        description: Object.values(errors).join(', ')
                    });
                },
                onFinish: () => setProcessing(false)
            }
        );
    };

    // ✅ Fonction de rendu des champs avec clés uniques
    const renderField = (fieldKey: string, label: string, value: any) => {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        // ✅ Clé unique basée sur le champ
        return (
            <div key={`field-${fieldKey}-${imp.id}`} className="py-3 border-b last:border-b-0">
                <dt className="text-sm font-medium text-gray-500">{label}</dt>
                <dd className="mt-1 text-sm text-gray-900">{value}</dd>
            </div>
        );
    };

    const renderPayload = () => {
        const data = imp.raw_data;
        
        if (!data) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    Aucune donnée disponible
                </div>
            );
        }
        
        if (imp.entity_type === 'demandeur') {
            // ✅ Utilisation de renderField avec clés uniques
            const demandeurFields = [
                { key: 'cin', label: 'CIN', value: data.cin },
                { key: 'titre', label: 'Titre', value: data.titre_demandeur },
                { key: 'nom', label: 'Nom', value: data.nom_demandeur },
                { key: 'prenom', label: 'Prénom', value: data.prenom_demandeur },
                { key: 'date_naissance', label: 'Date de naissance', value: data.date_naissance },
                { key: 'lieu_naissance', label: 'Lieu de naissance', value: data.lieu_naissance },
                { key: 'sexe', label: 'Sexe', value: data.sexe },
                { key: 'occupation', label: 'Occupation', value: data.occupation },
                { key: 'nom_pere', label: 'Nom père', value: data.nom_pere },
                { key: 'nom_mere', label: 'Nom mère', value: data.nom_mere },
                { key: 'date_delivrance', label: 'Date délivrance CIN', value: data.date_delivrance },
                { key: 'lieu_delivrance', label: 'Lieu délivrance CIN', value: data.lieu_delivrance },
                { key: 'domiciliation', label: 'Domiciliation', value: data.domiciliation },
                { key: 'telephone', label: 'Téléphone', value: data.telephone },
                { key: 'nationalite', label: 'Nationalité', value: data.nationalite },
                { key: 'situation_familiale', label: 'Situation familiale', value: data.situation_familiale },
                { key: 'regime_matrimoniale', label: 'Régime matrimonial', value: data.regime_matrimoniale },
                { key: 'date_mariage', label: 'Date mariage', value: data.date_mariage },
                { key: 'lieu_mariage', label: 'Lieu mariage', value: data.lieu_mariage },
                { key: 'marie_a', label: 'Marié(e) à', value: data.marie_a }
            ];

            return (
                <dl className="divide-y divide-gray-200">
                    {demandeurFields.map(field => renderField(field.key, field.label, field.value))}
                </dl>
            );
        } else {
            const proprieteFields = [
                { key: 'lot', label: 'Lot', value: data.lot },
                { key: 'nature', label: 'Nature', value: data.nature },
                { key: 'type_operation', label: 'Type opération', value: data.type_operation },
                { key: 'propriete_mere', label: 'Propriété mère', value: data.propriete_mere },
                { key: 'titre_mere', label: 'Titre mère', value: data.titre_mere },
                { key: 'titre', label: 'Titre', value: data.titre },
                { key: 'proprietaire', label: 'Propriétaire', value: data.proprietaire },
                { key: 'contenance', label: 'Contenance (m²)', value: data.contenance },
                { key: 'charge', label: 'Charge', value: data.charge },
                { key: 'situation', label: 'Situation', value: data.situation },
                { key: 'vocation', label: 'Vocation', value: data.vocation },
                { key: 'numero_FN', label: 'Numéro FN', value: data.numero_FN },
                { key: 'numero_requisition', label: 'Numéro réquisition', value: data.numero_requisition },
                { key: 'date_requisition', label: 'Date réquisition', value: data.date_requisition },
                { key: 'dep_vol_requisition', label: 'Dépôt/Vol réquisition', value: data.dep_vol_requisition },
                { key: 'date_depot_1', label: 'Date dépôt 1', value: data.date_depot_1 },
                { key: 'date_depot_2', label: 'Date dépôt 2', value: data.date_depot_2 },
                { key: 'date_approbation_acte', label: 'Date approbation acte', value: data.date_approbation_acte },
                { key: 'dep_vol_inscription', label: 'Dépôt/Vol inscription', value: data.dep_vol_inscription }
            ];

            return (
                <dl className="divide-y divide-gray-200">
                    {proprieteFields.map(field => renderField(field.key, field.label, field.value))}
                </dl>
            );
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">En attente</Badge>,
            validated: <Badge className="bg-green-100 text-green-800 border-green-300">Validé</Badge>,
            rejected: <Badge className="bg-red-100 text-red-800 border-red-300">Rejeté</Badge>,
            archived: <Badge className="bg-gray-100 text-gray-800 border-gray-300">Archivé</Badge>,
        };
        return badges[status as keyof typeof badges] || <Badge variant="outline">{status}</Badge>;
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'TopoFlux', href: route('topo-flux.index') },
        { title: 'Détails import', href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Import ${imp.entity_type} #${imp.id}`} />

            <div className="container mx-auto p-6 max-w-6xl space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.visit(route('topo-flux.index'))}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">
                                Import {imp.entity_type === 'demandeur' ? 'Demandeur' : 'Propriété'}
                            </h1>
                            <p className="text-sm text-muted-foreground">#{imp.id}</p>
                        </div>
                    </div>
                    
                    {getStatusBadge(imp.status)}
                </div>
                
                {/* Métadonnées */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Informations import
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        {[
                            { label: 'Batch ID', value: imp.batch_id, mono: true },
                            { label: 'Type', value: imp.entity_type === 'demandeur' ? 'Demandeur' : 'Propriété' },
                            { label: 'Dossier', value: `${imp.dossier_nom} (#${imp.dossier_numero_ouverture})` },
                            { label: 'District', value: imp.district_nom },
                            { label: 'Opérateur terrain', value: imp.topo_user_name },
                            { label: 'Date import', value: new Date(imp.import_date).toLocaleString('fr-FR') }
                        ].map((item, index) => (
                            <div key={`meta-${index}-${item.label.replace(/\s/g, '-')}`}>
                                <span className="font-medium">{item.label}:</span>
                                <p className={`text-muted-foreground mt-1 ${item.mono ? 'font-mono' : ''}`}>
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Données */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        {imp.entity_type === 'demandeur' ? (
                            <User className="h-5 w-5" />
                        ) : (
                            <MapPin className="h-5 w-5" />
                        )}
                        Données reçues
                    </h3>
                    {renderPayload()}
                </Card>

                {/* Fichiers */}
                {files && files.length > 0 && (
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Paperclip className="h-5 w-5" />
                            Fichiers joints ({files.length})
                        </h3>
                        <ul className="divide-y">
                            {files.map((file) => (
                                // ✅ Clé unique pour chaque fichier
                                <li 
                                    key={`file-${file.id}-${imp.id}`} 
                                    className="py-3 flex justify-between items-center"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(file.size / 1024).toFixed(2)} KB • {file.category}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        Télécharger
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}

                {/* Actions */}
                {imp.status === 'pending' && canValidate && (
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Actions</h3>
                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowRejectModal(true)}
                                disabled={processing}
                                className="gap-2 text-red-600 hover:bg-red-50"
                            >
                                <XCircle className="h-4 w-4" />
                                Rejeter
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={processing}
                                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Traitement...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" />
                                        Importer
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Motif rejet */}
                {imp.status === 'rejected' && imp.rejection_reason && (
                    <Card className="p-6 bg-red-50 border-red-200">
                        <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Motif de rejet
                        </h4>
                        <p className="text-red-700">{imp.rejection_reason}</p>
                    </Card>
                )}
            </div>

            {/* Modal rejet */}
            <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            Rejeter l'import
                        </DialogTitle>
                        <DialogDescription>
                            Cette action est irréversible. L'import sera définitivement marqué comme rejeté.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="reason">Motif du rejet *</Label>
                            <Textarea
                                id="reason"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Expliquez pourquoi cet import est rejeté (minimum 10 caractères)..."
                                rows={4}
                                className="mt-2"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                {rejectReason.length}/10 caractères minimum
                            </p>
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowRejectModal(false)}
                            disabled={processing}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={rejectReason.length < 10 || processing}
                            className="gap-2"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Rejet...
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-4 w-4" />
                                    Confirmer le rejet
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}