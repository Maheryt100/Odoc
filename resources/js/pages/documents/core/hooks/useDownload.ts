import { useState } from 'react';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';

export function useDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = async (url: string, filename: string) => {
    setIsDownloading(true);
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          
          if (data.error === 'file_missing') {
            throw new Error('Fichier introuvable ou endommagé');
          }
          
          throw new Error(data.message || 'Erreur de téléchargement');
        }
        
        throw new Error('Erreur de téléchargement');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Téléchargement réussi');
      
      router.reload({ only: ['proprietes', 'demandeurs'], preserveUrl: true });
    } catch (error: any) {
      throw error;
    } finally {
      setIsDownloading(false);
    }
  };

  return { download, isDownloading };
}