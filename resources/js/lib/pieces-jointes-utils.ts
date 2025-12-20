// ============================================
// lib/pieces-jointes-utils.ts
// Utilitaires pour le système de pièces jointes
// ============================================

import type { Categorie } from '@/types/pieces-jointes';

/**
 * Catégories de pièces jointes
 */
export const CATEGORIES: Record<string, Categorie> = {
    global: {
        label: 'Global',
        color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        description: 'Documents généraux du dossier',
    },
    demandeur: {
        label: 'Demandeur',
        color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        description: 'Documents liés à un demandeur spécifique',
    },
    propriete: {
        label: 'Propriété',
        color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        description: 'Documents liés à une propriété spécifique',
    },
    technique: {
        label: 'Technique',
        color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
        description: 'Documents techniques et plans',
    },
};

/**
 * Types de documents
 */
export const TYPES_DOCUMENTS: Record<string, string> = {
    // Identité
    cin: 'CIN',
    acte_naissance: 'Acte de naissance',
    certificat_nationalite: 'Certificat de nationalité',
    
    // État civil
    acte_mariage: 'Acte de mariage',
    jugement_divorce: 'Jugement de divorce',
    acte_deces: 'Acte de décès',
    
    // Propriété
    titre_propriete: 'Titre de propriété',
    requisition: 'Réquisition',
    certificat_situation_juridique: 'Certificat de situation juridique',
    plan_cadastral: 'Plan cadastral',
    plan_topographique: 'Plan topographique',
    
    // Transactions
    contrat_vente: 'Contrat de vente',
    acte_donation: 'Acte de donation',
    acte_partage: 'Acte de partage',
    attestation_heritage: 'Attestation d\'héritage',
    
    // Administratif
    certificat_residence: 'Certificat de résidence',
    autorisation: 'Autorisation',
    attestation: 'Attestation',
    procuration: 'Procuration',
    
    // Financier
    quittance: 'Quittance',
    recu_paiement: 'Reçu de paiement',
    
    // Divers
    photo: 'Photo',
    croquis: 'Croquis',
    autre: 'Autre document',
};

/**
 * Extensions de fichiers autorisées
 */
export const ALLOWED_EXTENSIONS = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx',
    'jpg', 'jpeg', 'png', 'gif', 'webp',
    'zip', 'rar', '7z'
];

/**
 * Taille maximale par fichier (en octets)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Récupère le token CSRF
 */
export function getCsrfToken(): string {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (!token) {
        console.error('CSRF token not found');
        return '';
    }
    return token;
}

/**
 * Formate la taille d'un fichier
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 octets';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return bytes + ' octets';
}

/**
 * Formate une date
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

/**
 * Formate une date courte
 */
export function formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(date);
}

/**
 * Vérifie si une extension est autorisée
 */
export function isExtensionAllowed(extension: string): boolean {
    return ALLOWED_EXTENSIONS.includes(extension.toLowerCase());
}

/**
 * Vérifie si un fichier est une image
 */
export function isImageFile(extension: string): boolean {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension.toLowerCase());
}

/**
 * Vérifie si un fichier est un PDF
 */
export function isPdfFile(extension: string): boolean {
    return extension.toLowerCase() === 'pdf';
}

/**
 * Obtient l'extension d'un nom de fichier
 */
export function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Valide un fichier
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `Le fichier est trop volumineux (max ${formatFileSize(MAX_FILE_SIZE)})`
        };
    }

    // Vérifier l'extension
    const ext = getFileExtension(file.name);
    if (!isExtensionAllowed(ext)) {
        return {
            valid: false,
            error: `Type de fichier non autorisé (${ext})`
        };
    }

    return { valid: true };
}

/**
 * Génère une URL de preview selon le type de fichier
 */
export function getPreviewUrl(piece: { view_url: string; url: string; is_image: boolean; is_pdf: boolean }): string {
    // Pour les images et PDF, utiliser view_url qui retourne le fichier brut
    if (piece.is_image || piece.is_pdf) {
        return piece.view_url;
    }
    // Pour les autres, utiliser l'URL de téléchargement
    return piece.url;
}