// resources/js/pages/TopoFlux/Show.tsx
// ✅ VERSION CORRIGÉE - Compatible avec nouvelle structure API

import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    ArrowLeft,
    FileText,
    User,
    MapPin,
    Calendar,
    Paperclip,
    CheckCircle2,
    XCircle,
    AlertTriangle
} from 'lucide-react';
import type { BreadcrumbItem, PageProps } from '@/types';

interface Import {
    id: number;
    entity_type: 'demandeur' | 'propriete';
    batch_id: string;
    status: 'pending' | 'validated' | 'rejected';
    dossier_id: number;
    dossier_nom: string;
    dossier_numero_ouverture: number;
    district_id: number;
    district_nom: string;
    topo_user_name: string;
    import_date: string;
    raw_data: Record<string, any>;  // ✅ CHANGÉ : raw_data au lieu de payload
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
}

export default function Show({ import: imp, files }: Props) {
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    const handleReject = () => {
        if (rejectReason.length < 10) {
            alert('Le motif doit contenir au moins 10 caractères');
            return;
        }

        router.post(route('topo-flux.reject', imp.id), {
            rejection_reason: rejectReason
        });
    };

    const handleValidate = () => {
        router.post(route('topo-flux.approve', imp.id));
    };

    const renderField = (label: string, value: any) => {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        return (
            <div className="py-3 border-b">
                <dt className="text-sm font-medium text-gray-500">{label}</dt>
                <dd className="mt-1 text-sm text-gray-900">{value}</dd>
            </div>
        );
    };

    const renderPayload = () => {
        // ✅ CORRECTION : Utiliser raw_data au lieu de payload
        const data = imp.raw_data;
        
        if (!data) {
            return (
                <div className="text-center py-8 text-muted-foreground">
                    Aucune donnée disponible
                </div>
            );
        }
        
        if (imp.entity_type === 'demandeur') {
            return (
                <dl className="divide-y divide-gray-200">
                    {renderField('CIN', data.cin)}
                    {renderField('Titre', data.titre_demandeur)}
                    {renderField('Nom', data.nom_demandeur)}
                    {renderField('Prénom', data.prenom_demandeur)}
                    {renderField('Date de naissance', data.date_naissance)}
                    {renderField('Lieu de naissance', data.lieu_naissance)}
                    {renderField('Sexe', data.sexe)}
                    {renderField('Occupation', data.occupation)}
                    {renderField('Nom père', data.nom_pere)}
                    {renderField('Nom mère', data.nom_mere)}
                    {renderField('Date délivrance CIN', data.date_delivrance)}
                    {renderField('Lieu délivrance CIN', data.lieu_delivrance)}
                    {renderField('Domiciliation', data.domiciliation)}
                    {renderField('Téléphone', data.telephone)}
                    {renderField('Nationalité', data.nationalite)}
                    {renderField('Situation familiale', data.situation_familiale)}
                    {renderField('Régime matrimonial', data.regime_matrimoniale)}
                    {renderField('Date mariage', data.date_mariage)}
                    {renderField('Lieu mariage', data.lieu_mariage)}
                    {renderField('Marié(e) à', data.marie_a)}
                </dl>
            );
        } else {
            return (
                <dl className="divide-y divide-gray-200">
                    {renderField('Lot', data.lot)}
                    {renderField('Nature', data.nature)}
                    {renderField('Type opération', data.type_operation)}
                    {renderField('Propriété mère', data.propriete_mere)}
                    {renderField('Titre mère', data.titre_mere)}
                    {renderField('Titre', data.titre)}
                    {renderField('Propriétaire', data.proprietaire)}
                    {renderField('Contenance (m²)', data.contenance)}
                    {renderField('Charge', data.charge)}
                    {renderField('Situation', data.situation)}
                    {renderField('Vocation', data.vocation)}
                    {renderField('Numéro FN', data.numero_FN)}
                    {renderField('Numéro réquisition', data.numero_requisition)}
                    {renderField('Date réquisition', data.date_requisition)}
                    {renderField('Dépôt/Vol réquisition', data.dep_vol_requisition)}
                    {renderField('Date dépôt 1', data.date_depot_1)}
                    {renderField('Date dépôt 2', data.date_depot_2)}
                    {renderField('Date approbation acte', data.date_approbation_acte)}
                    {renderField('Dépôt/Vol inscription', data.dep_vol_inscription)}
                </dl>
            );
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
            case 'validated':
                return <Badge className="bg-green-100 text-green-800">Validé</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
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
                        <div>
                            <span className="font-medium">Batch ID:</span>
                            <p className="text-muted-foreground font-mono mt-1">{imp.batch_id}</p>
                        </div>
                        <div>
                            <span className="font-medium">Type:</span>
                            <p className="text-muted-foreground mt-1">
                                {imp.entity_type === 'demandeur' ? 'Demandeur' : 'Propriété'}
                            </p>
                        </div>
                        <div>
                            <span className="font-medium">Dossier:</span>
                            <p className="text-muted-foreground mt-1">
                                {imp.dossier_nom} (#{imp.dossier_numero_ouverture})
                            </p>
                        </div>
                        <div>
                            <span className="font-medium">District:</span>
                            <p className="text-muted-foreground mt-1">{imp.district_nom}</p>
                        </div>
                        <div>
                            <span className="font-medium">Opérateur terrain:</span>
                            <p className="text-muted-foreground mt-1">{imp.topo_user_name}</p>
                        </div>
                        <div>
                            <span className="font-medium">Date import:</span>
                            <p className="text-muted-foreground mt-1">
                                {new Date(imp.import_date).toLocaleString('fr-FR')}
                            </p>
                        </div>
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
                            {files.map(file => (
                                <li key={file.id} className="py-3 flex justify-between items-center">
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
                {imp.status === 'pending' && (
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Actions</h3>
                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowRejectModal(true)}
                                className="gap-2 text-red-600 hover:bg-red-50"
                            >
                                <XCircle className="h-4 w-4" />
                                Rejeter
                            </Button>
                            <Button
                                onClick={handleValidate}
                                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Valider
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
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="max-w-md w-full m-4 p-6">
                        <h3 className="text-lg font-semibold mb-4">Rejeter l'import</h3>
                        <Textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Indiquez le motif du rejet (min 10 caractères)"
                            rows={4}
                            className="mb-4"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowRejectModal(false)}
                            >
                                Annuler
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={rejectReason.length < 10}
                            >
                                Confirmer le rejet
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </AppLayout>
    );
}