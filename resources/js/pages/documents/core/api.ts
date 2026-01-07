import { DOCUMENT_CONFIG } from '../utils/constants';

export const documentApi = {
  /**
   * Générer un document
   */
  generate: async (
    type: 'adv' | 'csf' | 'requisition',
    data: Record<string, any>
  ) => {
    const routes: Record<string, string> = {
      adv: 'documents.acte-vente.generate',
      csf: 'documents.csf.generate',
      requisition: 'documents.requisition.generate'
    };

    const csrfToken = document.querySelector<HTMLMetaElement>(
      'meta[name="csrf-token"]'
    )?.content || '';

    const response = await fetch(route(routes[type]), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: 'Erreur de génération' 
      }));
      throw new Error(error.message || 'Erreur de génération');
    }

    return response;
  },

  /**
   * Régénérer un document existant
   */
  regenerate: async (
    type: 'adv' | 'csf' | 'requisition',
    documentId: number
  ) => {
    const routes: Record<string, string> = {
      adv: 'documents.acte-vente.regenerate',
      csf: 'documents.csf.regenerate',
      requisition: 'documents.requisition.regenerate'
    };

    const csrfToken = document.querySelector<HTMLMetaElement>(
      'meta[name="csrf-token"]'
    )?.content || '';

    const response = await fetch(route(routes[type], documentId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json'
      },
      credentials: 'same-origin'
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: 'Erreur de régénération' 
      }));
      throw new Error(error.message || 'Erreur de régénération');
    }

    return response;
  }
};