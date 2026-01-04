// resources/js/pages/TopoFlux/Index.tsx
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
    files_count: number;
    payload: any;
}

interface Props {
    imports: Import[];
    stats: {
        total: number;
        pending: number;
    };
    filters: {
        status: string;
        entity_type: string | null;
    };
}

export default function Index({ imports, stats, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status);
    const [typeFilter, setTypeFilter] = useState(filters.entity_type || '');

    const applyFilters = () => {
        router.get(route('topo-flux.index'), {
            status: statusFilter,
            entity_type: typeFilter || undefined
        }, {
            preserveState: true
        });
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'APPROVED': 'bg-green-100 text-green-800',
            'REJECTED': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getEntityBadge = (type: string) => {
        return type === 'demandeur' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-purple-100 text-purple-800';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getMainInfo = (imp: Import) => {
        if (imp.entity_type === 'demandeur') {
            const p = imp.payload;
            return `${p.nom_demandeur || '(sans nom)'} ${p.prenom_demandeur || ''} - CIN: ${p.cin || 'N/A'}`;
        } else {
            const p = imp.payload;
            return `Lot ${p.lot || '?'} - ${p.nature || 'N/A'} (${p.type_operation || 'N/A'})`;
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">TopoFlux - Imports Terrain</h2>
                    <div className="flex gap-4 text-sm">
                        <div className="px-3 py-1 bg-yellow-100 rounded">
                            En attente: {stats.pending}
                        </div>
                        <div className="px-3 py-1 bg-gray-100 rounded">
                            Total: {stats.total}
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="TopoFlux" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Filtres */}
                    <div className="mb-6 bg-white rounded-lg shadow p-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Statut</label>
                                <select 
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full rounded border-gray-300"
                                >
                                    <option value="PENDING">En attente</option>
                                    <option value="APPROVED">Approuvé</option>
                                    <option value="REJECTED">Rejeté</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <select 
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="w-full rounded border-gray-300"
                                >
                                    <option value="">Tous</option>
                                    <option value="demandeur">Demandeurs</option>
                                    <option value="propriete">Propriétés</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={applyFilters}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Appliquer
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Liste */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {imports.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                Aucun import trouvé
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Informations</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opérateur</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fichiers</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {imports.map((imp) => (
                                        <tr key={`${imp.entity_type}-${imp.id}`} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded ${getEntityBadge(imp.entity_type)}`}>
                                                    {imp.entity_type === 'demandeur' ? 'Demandeur' : 'Propriété'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {getMainInfo(imp)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Dossier #{imp.target_dossier_id}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {imp.topo_user_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(imp.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {imp.files_count} fichier(s)
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(imp.status)}`}>
                                                    {imp.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Link
                                                    href={route('topo-flux.show', [imp.entity_type, imp.id])}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    Voir détails
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}