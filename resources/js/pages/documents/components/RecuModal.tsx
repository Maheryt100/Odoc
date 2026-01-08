import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Receipt, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { formatters, validators } from '../utils/formatters';

interface RecuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (numeroRecu: string, dateRecu: string, notes?: string) => void;
  dossierId: number;
  isGenerating?: boolean;
  mode?: 'generate' | 'regenerate';
  existingData?: {
    numeroRecu: string;
    dateRecu: string;
  };
}

export function RecuModal({
  isOpen,
  onClose,
  onConfirm,
  dossierId,
  isGenerating,
  mode = 'generate',
  existingData
}: RecuModalProps) {
  const [numeroRecu, setNumeroRecu] = useState('');
  const [dateRecu, setDateRecu] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'regenerate' && existingData) {
        setNumeroRecu(existingData.numeroRecu);
        setDateRecu(existingData.dateRecu);
      } else {
        setNumeroRecu('');
        setDateRecu(new Date().toISOString().split('T')[0]);
      }
      setNotes('');
      setError(null);
    }
  }, [isOpen, mode, existingData]);

  const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatters.numeroRecu(e.target.value);
    setNumeroRecu(formatted);
    setError(null);
  };

  const handleConfirm = () => {
    if (!numeroRecu.trim()) {
      setError('Numéro requis');
      return;
    }

    if (!validators.numeroRecu(numeroRecu)) {
      setError('Format invalide (XXX/XX)');
      return;
    }

    if (!dateRecu) {
      setError('Date requise');
      return;
    }

    onConfirm(numeroRecu.trim(), dateRecu, notes.trim() || undefined);
  };

  const isValid = 
    numeroRecu.length === 6 && 
    validators.numeroRecu(numeroRecu) &&
    dateRecu.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-green-600" />
            {mode === 'regenerate' ? 'Modifier les Informations du Reçu' : 'Informations du Reçu'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mode === 'regenerate' && (
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20">
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                Vous pouvez modifier le numéro et la date du reçu pour ce document.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="numero_recu">
              Numéro de Reçu <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Input
                id="numero_recu"
                value={numeroRecu}
                onChange={handleNumeroChange}
                placeholder="001/25"
                className="text-center text-lg font-mono pr-10"
                maxLength={6}
                disabled={isGenerating}
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isValid && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Format: XXX/XX (ex: 001/25)
            </p>
          </div>

          <div>
            <Label htmlFor="date_recu">
              Date du Reçu <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="date_recu"
                type="date"
                value={dateRecu}
                onChange={(e) => setDateRecu(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="pl-10"
                disabled={isGenerating}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Date d'émission du reçu
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations complémentaires..."
              className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md mt-1"
              disabled={isGenerating}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {notes.length}/500
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isGenerating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mode === 'regenerate' ? 'Régénération...' : 'Génération...'}
              </>
            ) : (
              mode === 'regenerate' ? 'Régénérer' : 'Générer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}