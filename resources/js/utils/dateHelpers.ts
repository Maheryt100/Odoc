// ============================================
// 📅 utils/dateHelpers.ts - HELPER DATES
// ============================================

/**
 * Convertir une date du backend vers le format input HTML
 * Gère plusieurs formats : DD/MM/YYYY, YYYY-MM-DD, ISO 8601
 */
export function formatDateForInput(dateString: string | null | undefined): string {
    if (!dateString) return '';
    
    try {
        // Essayer de parser la date
        let date: Date;
        
        // Format DD/MM/YYYY (Laravel souvent)
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            const [day, month, year] = dateString.split('/');
            date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        // Format ISO ou YYYY-MM-DD
        else {
            date = new Date(dateString);
        }
        
        // Vérifier si la date est valide
        if (isNaN(date.getTime())) {
            console.warn('Date invalide:', dateString);
            return '';
        }
        
        // Convertir au format YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Erreur parsing date:', error, dateString);
        return '';
    }
}

/**
 * Convertir une date du format input vers le format backend
 */
export function formatDateForBackend(dateString: string): string {
    if (!dateString) return '';
    // Le format YYYY-MM-DD est déjà accepté par Laravel
    return dateString;
}

/**
 * Formater une date pour l'affichage (DD/MM/YYYY)
 */
export function formatDateForDisplay(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch {
        return '-';
    }
}