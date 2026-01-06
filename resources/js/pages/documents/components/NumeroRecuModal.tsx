import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
    Receipt, 
    AlertCircle, 
    CheckCircle2, 
    Info,
    Loader2,
    FileText,
    Users,
    Coins,
    Calendar,
    Building,
    XCircle
} from 'lucide-react';

interface NumeroRecuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (numeroRecu: string, notes?: string) => void;
    propriete: any;
    validation: any;
    isGenerating?: boolean;
}

export default function NumeroRecuModal({
    isOpen,
    onClose,
    onConfirm,
    propriete,
    validation,
    isGenerating = false,
}: NumeroRecuModalProps) {
    
    const [numeroRecu, setNumeroRecu] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
    const [duplicateInfo, setDuplicateInfo] = useState<{
        exists: boolean;
        proprietaire?: string;
    } | null>(null);
    
    const principal = propriete?.demandeurs_lies?.find((d: any) => d.ordre === 1);
    const consorts = propriete?.demandeurs_lies?.filter((d: any) => d.ordre > 1) || [];
    const prixTotal = principal?.total_prix || 0;

    // Reset au changement
    useEffect(() => {
        if (isOpen) {
            setNumeroRecu('');
            setNotes('');
            setError(null);
            setDuplicateInfo(null);
        }
    }, [isOpen, propriete?.id]);

    // Formater automatiquement la saisie XXX/XX
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const digits = input.replace(/\D/g, '');
        const limited = digits.slice(0, 5);
        
        let formatted = '';
        if (limited.length <= 3) {
            formatted = limited;
        } else {
            formatted = `${limited.slice(0, 3)}/${limited.slice(3)}`;
        }
        
        setNumeroRecu(formatted);
        setError(null);
        setDuplicateInfo(null);
        
        // Validation en temps réel
        if (formatted.length === 6 && !/^\d{3}\/\d{2}$/.test(formatted)) {
            setError('Format invalide. Utilisez XXX/XX (ex: 001/25)');
        }
    };

    // Vérifier l'unicité quand le format est complet
    useEffect(() => {
        const checkDuplicate = async () => {
            if (numeroRecu.length === 6 && /^\d{3}\/\d{2}$/.test(numeroRecu)) {
                setIsCheckingDuplicate(true);
                
                try {
                    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
                    
                    const response = await fetch('/documents/check-recu-numero', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrfToken,
                        },
                        body: JSON.stringify({
                            numero_recu: numeroRecu,
                            id_dossier: propriete?.dossier?.id,
                        }),
                    });
                    
                    const data = await response.json();
                    setDuplicateInfo(data);
                    
                    if (data.exists) {
                        setError(`Ce numéro existe déjà (propriétaire: ${data.proprietaire})`);
                    }
                } catch (err) {
                    console.error('Erreur vérification:', err);
                } finally {
                    setIsCheckingDuplicate(false);
                }
            }
        };

        const debounce = setTimeout(checkDuplicate, 500);
        return () => clearTimeout(debounce);
    }, [numeroRecu, propriete?.dossier?.id]);

    const handleConfirm = () => {
        const trimmed = numeroRecu.trim();
        
        if (!trimmed) {
            setError('Le numéro de reçu est obligatoire');
            return;
        }
        
        if (!/^\d{3}\/\d{2}$/.test(trimmed)) {
            setError('Le numéro doit être au format XXX/XX (ex: 001/25)');
            return;
        }
        
        if (duplicateInfo?.exists) {
            setError('Ce numéro de reçu existe déjà dans ce dossier');
            return;
        }
        
        onConfirm(trimmed, notes.trim() || undefined);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && isValid && !error) {
            handleConfirm();
        }
    };

    const isValid = numeroRecu.length === 6 && 
                    /^\d{3}\/\d{2}$/.test(numeroRecu) && 
                    !duplicateInfo?.exists;

    const formatMontant = (montant: number): string => {
        return `${montant.toLocaleString('fr-FR')} Ar`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg">
                            <Receipt className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                Référence de Reçu Externe
                            </span>
                            <p className="text-xs font-normal text-muted-foreground mt-0.5">
                                Document généré hors du système
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Validation Status */}
                    {!validation.isValid && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                                <div className="font-semibold mb-2">
                                    ⚠️ Données incomplètes détectées
                                </div>
                                <div className="space-y-1 text-xs">
                                    {validation.missingFields.propriete.length > 0 && (
                                        <div>
                                            <strong>Propriété:</strong> {validation.missingFields.propriete.join(', ')}
                                        </div>
                                    )}
                                    {validation.missingFields.demandeur.length > 0 && (
                                        <div>
                                            <strong>Demandeur:</strong> {validation.missingFields.demandeur.join(', ')}
                                        </div>
                                    )}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Info Propriété */}
                    {propriete && validation.isValid && (
                        <div className="bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 rounded-xl border-2 border-violet-200 dark:border-violet-800 p-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-violet-900 dark:text-violet-100">
                                <FileText className="h-4 w-4" />
                                <span>Récapitulatif du document</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                        <Building className="h-3 w-3" />
                                        <span>Propriété</span>
                                    </div>
                                    <div className="font-semibold">
                                        Lot {propriete.lot} - TN°{propriete.titre}
                                    </div>
                                </div>
                                <div className="p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg">
                                    <span className="text-xs text-muted-foreground block mb-1">Nature</span>
                                    <div className="font-semibold capitalize">{propriete.nature}</div>
                                </div>
                            </div>

                            {principal && (
                                <div className="pt-3 border-t border-violet-200 dark:border-violet-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-violet-600" />
                                            <span className="font-medium text-sm">
                                                {principal.nom} {principal.prenom}
                                            </span>
                                            {consorts.length > 0 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    +{consorts.length} consort{consorts.length > 1 ? 's' : ''}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 rounded-lg">
                                        <Coins className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        <div className="flex-1">
                                            <span className="text-xs text-muted-foreground">Montant total</span>
                                            <div className="font-bold text-lg text-green-700 dark:text-green-400">
                                                {formatMontant(prixTotal)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Input Numéro de Reçu */}
                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="numero_recu" className="text-sm font-semibold flex items-center gap-2">
                                <Receipt className="h-4 w-4" />
                                Numéro de Reçu 
                                <span className="text-red-500">*</span>
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Entrez le numéro du reçu de paiement généré manuellement
                            </p>
                        </div>
                        
                        <div className="relative">
                            <Input
                                id="numero_recu"
                                value={numeroRecu}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                placeholder="001/25"
                                className="text-center text-lg font-mono tracking-wider pr-10 h-12"
                                maxLength={6}
                                disabled={isGenerating || !validation.isValid}
                                autoFocus
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {isCheckingDuplicate ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                ) : isValid ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : duplicateInfo?.exists ? (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                ) : null}
                            </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                            <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                                <div className="font-medium">Format requis : XXX/XX</div>
                                <div>• 3 chiffres + slash + 2 chiffres</div>
                                <div>• Exemple : 001/25, 042/24, 123/23</div>
                                <div className="pt-1 text-blue-700 dark:text-blue-300">
                                    ✓ La vérification d'unicité est automatique
                                </div>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="py-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Notes optionnelles */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
                            <Info className="h-3.5 w-3.5" />
                            Notes 
                            <span className="text-muted-foreground font-normal">(optionnel)</span>
                        </Label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Informations complémentaires sur ce reçu..."
                            className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                            disabled={isGenerating}
                            maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {notes.length}/500 caractères
                        </p>
                    </div>

                    {/* Info importante */}
                    <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                        <Calendar className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                            <div className="font-semibold mb-1">📌 Important</div>
                            <ul className="space-y-1 list-disc list-inside">
                                <li>Ce numéro doit être unique dans le dossier</li>
                                <li>Il sera utilisé dans l'acte de vente généré</li>
                                <li>Assurez-vous qu'il correspond au reçu physique</li>
                            </ul>
                        </AlertDescription>
                    </Alert>
                </div>

                <DialogFooter className="gap-2">
                    <Button 
                        variant="outline" 
                        onClick={onClose}
                        disabled={isGenerating}
                    >
                        Annuler
                    </Button>
                    <Button 
                        onClick={handleConfirm}
                        disabled={!isValid || isGenerating || !validation.isValid || isCheckingDuplicate}
                        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Génération...
                            </>
                        ) : (
                            <>
                                <FileText className="h-4 w-4 mr-2" />
                                Générer l'Acte de Vente
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}