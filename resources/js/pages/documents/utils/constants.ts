// documents/utils/constants.ts
export const DOCUMENT_CONFIG = {
  adv: {
    label: 'Acte de Vente',
    color: 'violet',
    icon: 'FileText',
    requiresRecu: true
  },
  csf: {
    label: 'CSF',
    color: 'emerald',
    icon: 'FileCheck',
    requiresRecu: false
  },
  requisition: {
    label: 'Réquisition',
    color: 'blue',
    icon: 'FileOutput',
    requiresRecu: false
  }
} as const;

export const BREAKPOINTS = {
  mobile: 768
} as const;

export const DOCUMENT_ROUTES = {
  adv: {
    generate: 'documents.acte-vente.generate',
    download: 'documents.acte-vente.download',
    regenerate: 'documents.acte-vente.regenerate'
  },
  csf: {
    generate: 'documents.csf.generate',
    download: 'documents.csf.download',
    regenerate: 'documents.csf.regenerate'
  },
  requisition: {
    generate: 'documents.requisition.generate',
    download: 'documents.requisition.download',
    regenerate: 'documents.requisition.regenerate'
  }
} as const;