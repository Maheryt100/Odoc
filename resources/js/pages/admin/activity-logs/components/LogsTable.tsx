// admin/activity-logs/components/LogsTable.tsx - VERSION FINALE CORRIGÉE

import { Badge } from '@/components/ui/badge';
import { User, MapPin, AlertCircle } from 'lucide-react';
import { ActivityLog } from '../types';
import { ACTION_BADGE_CONFIG } from '../config';
import { formatDate } from '../helpers';
import { EmptyState } from './EmptyState';
import React from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface LogsTableProps {
    logs: ActivityLog[];
    actions: Record<string, string>;
}

/**
 * Formate une clé de métadonnée pour un affichage lisible
 */
const formatMetadataKey = (key: string): string => {
    const labels: Record<string, string> = {
        // Documents
        lot: 'Lot',
        titre: 'Titre',
        numero_recu: 'N° Reçu',
        montant: 'Montant',
        total_prix: 'Prix Total',
        document_type: 'Type Document',
        has_consorts: 'Consorts',
        nb_demandeurs: 'Nb Demandeurs',
        
        // Dossiers
        nom_dossier: 'Nom Dossier',
        numero_ouverture: 'N° Ouverture',
        commune: 'Commune',
        type_commune: 'Type Commune',
        circonscription: 'Circonscription',
        fokontany: 'Fokontany',
        motif_fermeture: 'Motif Fermeture',
        date_fermeture: 'Date Fermeture',
        
        // Propriétés
        contenance: 'Superficie',
        nature: 'Nature',
        vocation: 'Vocation',
        proprietaire: 'Propriétaire',
        situation: 'Situation',
        
        // Demandeurs
        nom: 'Nom',
        prenom: 'Prénom',
        cin: 'CIN',
        domiciliation: 'Domiciliation',
        
        // Utilisateurs
        user_name: 'Nom Utilisateur',
        user_email: 'Email',
        user_role: 'Rôle',
        old_status: 'Ancien Statut',
        new_status: 'Nouveau Statut',
        
        // Pièces jointes
        nom_fichier: 'Fichier',
        taille: 'Taille',
        taille_formatee: 'Taille',
        type_document: 'Type',
        attachable_type: 'Attaché à',
        
        // Autres
        dossier_id: 'ID Dossier',
        dossier_nom: 'Nom Dossier',
        id_district: 'ID District',
        action_type: 'Type Action',
        created_count: 'Créés',
        updated_count: 'Mis à jour',
        count: 'Nombre',
    };
    
    return labels[key] || key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Formate une valeur de métadonnée pour un affichage lisible
 */
const formatMetadataValue = (value: any): string => {
    if (value === null || value === undefined) {
        return 'N/A';
    }
    
    if (typeof value === 'boolean') {
        return value ? 'Oui' : 'Non';
    }
    
    if (typeof value === 'number') {
        // Si c'est un montant (plus de 100), formater avec espaces
        if (value > 100) {
            return value.toLocaleString('fr-FR');
        }
        return value.toString();
    }
    
    if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
    }
    
    // Limiter la longueur des chaînes très longues
    const strValue = String(value);
    if (strValue.length > 100) {
        return strValue.substring(0, 100) + '...';
    }
    
    return strValue;
};

export const LogsTable = ({ logs, actions }: LogsTableProps) => {
    if (logs.length === 0) {
        return (
            <EmptyState
                icon={User}
                title="Aucune activité trouvée"
                description="Essayez d'ajuster vos filtres de recherche"
            />
        );
    }

    return (
        <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                    <tr>
                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                            Date/Heure
                        </th>
                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                            Utilisateur
                        </th>
                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                            Action
                        </th>
                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                            Entité
                        </th>
                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                            Détails
                        </th>
                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                            District
                        </th>
                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider">
                            IP
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {logs.map((log) => {
                        const config = ACTION_BADGE_CONFIG[log.action] || {};
                        
                        // ✅ Vérifier si les données essentielles existent
                        const actionLabel = log.action_label || log.action || 'Action inconnue';
                        const entityLabel = log.entity_label || log.entity_type || 'Entité inconnue';
                        const details = log.details || 'Aucun détail disponible';
                        
                        return (
                            <tr 
                                key={log.id} 
                                className="hover:bg-muted/30 transition-colors"
                            >
                                {/* Date/Heure */}
                                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDate(log.created_at)}
                                </td>
                                
                                {/* Utilisateur */}
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                                            {log.user?.name?.substring(0, 2).toUpperCase() || '??'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium text-sm truncate">
                                                {log.user?.name || 'Utilisateur inconnu'}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {log.user?.email || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                
                                {/* Action */}
                                <td className="p-3">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Badge className={config.className || 'bg-gray-500'}>
                                                    {actionLabel}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">Type d'action: {actionLabel}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </td>
                                
                                {/* Entité */}
                                <td className="p-3">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted">
                                        {entityLabel}
                                    </span>
                                </td>
                                
                                {/* Détails */}
                                <td className="p-3">
                                    <div className="text-sm max-w-md">
                                        {details === 'Aucun détail disponible' ? (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                <span className="text-xs italic">{details}</span>
                                            </div>
                                        ) : (
                                            <TooltipProvider delayDuration={200}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div 
                                                            className="text-foreground line-clamp-2 cursor-help hover:text-primary transition-colors"
                                                        >
                                                            {details}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent 
                                                        side="left" 
                                                        className="max-w-2xl p-4 bg-card border-2 shadow-xl"
                                                        sideOffset={10}
                                                    >
                                                        {/* En-tête */}
                                                        <div className="mb-3 pb-3 border-b">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                                <span className="font-semibold text-sm text-foreground">
                                                                    Détails de l'action
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                                                {details}
                                                            </p>
                                                        </div>
                                                        
                                                        {/* Métadonnées */}
                                                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                    <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                                                                        Informations Complémentaires
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    {Object.entries(log.metadata).map(([key, value]) => (
                                                                        <div 
                                                                            key={key} 
                                                                            className="flex items-start gap-3 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                                                                        >
                                                                            <span className="text-xs font-medium text-primary min-w-[120px] pt-0.5">
                                                                                {formatMetadataKey(key)}:
                                                                            </span>
                                                                            <span className="text-xs text-foreground flex-1 font-mono">
                                                                                {formatMetadataValue(value)}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Footer avec timestamp */}
                                                        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                                                            <span>Action effectuée le {formatDate(log.created_at)}</span>
                                                            {log.ip_address && (
                                                                <span className="font-mono">IP: {log.ip_address}</span>
                                                            )}
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </td>
                                
                                {/* District */}
                                <td className="p-3">
                                    {log.district ? (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <MapPin className="h-3.5 w-3.5" />
                                            <span>{log.district.nom_district}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">N/A</span>
                                    )}
                                </td>
                                
                                {/* IP */}
                                <td className="p-3">
                                    <code className="text-xs px-2 py-1 bg-muted rounded">
                                        {log.ip_address || 'N/A'}
                                    </code>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};