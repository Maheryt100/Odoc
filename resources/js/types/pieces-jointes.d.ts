// ============================================
// types/pieces-jointes.d.ts
// Types pour le système de gestion des pièces jointes
// ============================================

export type AttachableType = 'Dossier' | 'Demandeur' | 'Propriete';
export type CategorieType = 'global' | 'demandeur' | 'propriete' | 'technique';

/**
 * Structure d'une pièce jointe
 */
export interface PieceJointe {
    id: number;
    nom_original: string;
    nom_fichier: string;
    type_mime: string;
    taille: number;
    extension: string;
    type_document?: string;
    categorie: CategorieType;
    categorie_label: string;
    description?: string;
    
    // Flags
    is_verified: boolean;
    is_image: boolean;
    is_pdf: boolean;
    
    // URLs - IMPORTANT: Clarification des URLs
    url: string;              // URL de téléchargement: /pieces-jointes/{id}/download
    view_url: string;         // URL de visualisation: /pieces-jointes/{id}/view
    download_url?: string;    // Alias de url (pour compatibilité)
    
    // Métadonnées
    icone: string;
    taille_formatee: string;
    created_at: string;
    updated_at: string;
    
    // Relations
    user?: {
        id: number;
        name: string;
    };
    verified_by?: {
        id: number;
        name: string;
    };
    verified_at?: string;
    
    // Entité attachée
    attachable_type: AttachableType;
    attachable_id: number;
    
    // Entité liée (optionnel)
    linked_entity_type?: string;
    linked_entity_id?: number;
}

/**
 * Structure pour les pièces jointes liées
 */
export interface RelatedPieces {
    demandeurs: {
        [id: string]: {
            demandeur: BaseDemandeur;
            pieces: PieceJointe[];
        };
    };
    proprietes: {
        [id: string]: {
            propriete: BasePropriete;
            pieces: PieceJointe[];
        };
    };
}

/**
 * Demandeur simplifié (pour les relations)
 */
export interface BaseDemandeur {
    id: number;
    nom_demandeur: string;
    prenom_demandeur: string | null;
    cin: string;
}

/**
 * Propriété simplifiée (pour les relations)
 */
export interface BasePropriete {
    id: number;
    lot: string;
    titre: string | null;
}

/**
 * Formulaire d'upload
 */
export interface UploadForm {
    files: File[];
    type_document: string;
    categorie: CategorieType;
    description: string;
    linked_entity_type: string;
    linked_entity_id: string;
}

/**
 * Catégories de pièces jointes
 */
export interface Categorie {
    label: string;
    color: string;
    description?: string;
}

/**
 * Props du composant Index
 */
export interface PiecesJointesIndexProps {
    attachableType: AttachableType;
    attachableId: number;
    title?: string;
    canUpload?: boolean;
    canDelete?: boolean;
    canVerify?: boolean;
    initialCount?: number;
    demandeurs?: BaseDemandeur[];
    proprietes?: BasePropriete[];
    showRelated?: boolean;
}

/**
 * Props du modal de preview
 */
export interface PreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string | null;
    fileName?: string;
    downloadUrl?: string;
}

/**
 * Props du dialog d'upload
 */
export interface UploadPieceJointeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attachableType: AttachableType;
    attachableId: number;
    demandeurs?: BaseDemandeur[];
    proprietes?: BasePropriete[];
    onSuccess: () => void;
}

/**
 * Props de l'item de pièce jointe
 */
export interface PieceJointeItemProps {
    piece: PieceJointe;
    canVerify?: boolean;
    canDelete?: boolean;
    onPreview: (url: string, fileName: string, downloadUrl: string) => void;
    onVerify: (id: number) => void;
    onDelete: (id: number) => void;
}

/**
 * Réponse API
 */
export interface PiecesJointesResponse {
    success: boolean;
    message?: string;
    pieces_jointes: PieceJointe[];
    related_pieces?: RelatedPieces;
    errors?: Array<{
        file: string;
        errors: string[];
    }>;
}