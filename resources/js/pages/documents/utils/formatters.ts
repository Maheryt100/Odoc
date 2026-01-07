// documents/utils/formatters.ts
export const formatters = {
  montant: (value: number | undefined): string => {
    return `${(value ?? 0).toLocaleString('fr-FR')} Ar`;
  },

  contenance: (ca: number | undefined): string => {
    const total = ca ?? 0;
    if (total === 0) return '-';
    
    const ha = Math.floor(total / 10000);
    const a = Math.floor((total % 10000) / 100);
    const reste = total % 100;
    
    const parts = [];
    if (ha > 0) parts.push(`${ha}Ha`);
    if (a > 0) parts.push(`${a}A`);
    parts.push(`${reste}Ca`);
    
    return parts.join(' ');
  },

  date: (date: string | Date | undefined): string => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR');
  },

  numeroRecu: (input: string): string => {
    const digits = input.replace(/\D/g, '').slice(0, 5);
    return digits.length <= 3 ? digits : `${digits.slice(0, 3)}/${digits.slice(3)}`;
  }
};

export const validators = {
  numeroRecu: (value: string): boolean => /^\d{3}\/\d{2}$/.test(value.trim()),
  
  isComplete: (obj: any, requiredFields: string[]): boolean => {
    return requiredFields.every(field => {
      const val = obj?.[field];
      return val !== null && val !== undefined && val !== '';
    });
  }
};