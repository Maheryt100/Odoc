// resources/js/pages/TopoFlux/Show.tsx
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { useState } from 'react';

interface Import {
    id: number;
    entity_type: 'demandeur' | 'propriete';
    batch_id: string;
    status: string;
    target_dossier_id: number;
    target_district_id: number;
    topo_user_name: string;
    created_at: string;
    payload: any;
    error_reason: string | null;
}

interface File {
    id: number;
    original_name: string;
    file_size: number;
    mime_type: string;
}

interface Props {
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

        router.post(route('topo-flux.reject', [imp.entity_type, imp.id]), {
            error_reason: rejectReason
        });
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
        const p = imp.payload;
        
        if (imp.entity_type === 'demandeur') {
            return (
                <dl className="divide-y divide-gray-200">
                    {renderField('CIN', p.cin)}
                    {renderField('Titre', p.titre_demandeur)}
                    {renderField('Nom', p.nom_demandeur)}
                    {renderField('Prénom', p.prenom_demandeur)}
                    {renderField('Date de naissance', p.date_naissance)}
                    {renderField('Lieu de naissance', p.lieu_naissance)}
                    {renderField('Sexe', p.sexe)}
                    {renderField('Occupation', p.occupation)}
                    {renderField('Nom père', p.nom_pere)}
                    {renderField('Nom mère', p.nom_mere)}
                    {renderField('Date délivrance CIN', p.date_delivrance)}
                    {renderField('Lieu délivrance CIN', p.lieu_delivrance)}
                    {renderField('Domiciliation', p.domiciliation)}
                    {renderField('Téléphone', p.telephone)}
                    {renderField('Nationalité', p.nationalite)}
                    {renderField('Situation familiale', p.situation_familiale)}
                    {renderField('Régime matrimonial', p.regime_matrimoniale)}
                    {renderField('Date mariage', p.date_mariage)}
                    {renderField('Lieu mariage', p.lieu_mariage)}
                    {renderField('Marié(e) à', p.marie_a)}
                </dl>
            );
        } else {
            return (
                <dl className="divide-y divide-gray-200">
                    {renderField('Lot', p.lot)}
                    {renderField('Nature', p.nature)}
                    {renderField('Type opération', p.type_operation)}
                    {renderField('Propriété mère', p.propriete_mere)}
                    {renderField('Titre mère', p.titre_mere)}
                    {renderField('Titre', p.titre)}
                    {renderField('Propriétaire', p.proprietaire)}
                    {renderField('Contenance (m²)', p.contenance)}
                    {renderField('Charge', p.charge)}
                    {renderField('Situation', p.situation)}
                    {renderField('Vocation', p.vocation)}
                    {renderField('Numéro FN', p.numero_FN)}
                    {renderField('Numéro réquisition', p.numero_requisition)}
                    {renderField('Date réquisition', p.date_requisition)}
                    {renderField('Dépôt/Vol réquisition', p.dep_vol_requisition)}
                    {renderField('Date dépôt 1', p.date_depot_1)}
                    {renderField('Date dépôt 2', p.date_depot_2)}
                    {renderField('Date approbation acte', p.date_approbation_acte)}
                    {renderField('Dépôt/Vol inscription', p.dep_vol_inscription)}
                </dl>
            );
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        Détail Import - {imp.entity_type === 'demandeur' ? 'Demandeur' : 'Propriété'}
                    </h2>
                    <Link
                        href={route('topo-flux.index')}
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        Retour à la liste
                    </Link>
                </div>
            }
        >
            <Head title={`Import ${imp.entity_type} #${imp.id}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Métadonnées */}
                    <div className="mb-6 bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium mb-4">Informations import</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">Batch ID:</span> {imp.batch_id}
                            </div>
                            <div>
                                <span className="font-medium">Statut:</span> {imp.status}
                            </div>
                            <div>
                                <span className="font-medium">Opérateur terrain:</span> {imp.topo_user_name}
                            </div>
                            <div>
                                <span className="font-medium">Date import:</span> {new Date(imp.created_at).toLocaleString('fr-FR')}
                            </div>
                            <div>
                                <span className="font-medium">Dossier cible:</span> #{imp.target_dossier_id}
                            </div>
                            <div>
                                <span className="font-medium">District:</span> #{imp.target_district_id}
                            </div>
                        </div>
                    </div>

                    {/* Données */}
                    <div className="mb-6 bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium mb-4">Données reçues</h3>
                        {renderPayload()}
                    </div>

                    {/* Fichiers */}
                    {files.length > 0 && (
                        <div className="mb-6 bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium mb-4">Fichiers joints ({files.length})</h3>
                            <ul className="divide-y">
                                {files.map(file => (
                                    <li key={file.id} className="py-2 flex justify-between items-center">
                                        <span>{file.original_name}</span>
                                        <span className="text-sm text-gray-500">
                                            {(file.file_size / 1024).toFixed(2)} KB
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Actions */}
                    {imp.status === 'PENDING' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium mb-4">Actions</h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Rejeter
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Motif rejet */}
                    {imp.status === 'REJECTED' && imp.error_reason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="font-medium text-red-800 mb-2">Motif de rejet</h4>
                            <p className="text-red-700">{imp.error_reason}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal rejet */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">Rejeter l'import</h3>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Indiquez le motif du rejet (min 10 caractères)"
                            className="w-full border rounded p-2 mb-4"
                            rows={4}
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 border rounded hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleReject}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Confirmer le rejet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}