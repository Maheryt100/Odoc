// associations/LinkDemandeurDialog.tsx - ✅ AVEC DATE_DEMANDE
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, User, Link2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DatePickerDemande from '@/components/DatePickerDemande';
import type { Demandeur, Propriete } from '@/types';

interface LinkDemandeurDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    propriete: Propriete;
    demandeursDossier: Demandeur[];
    dossierId: number;
}

export function LinkDemandeurDialog({
    open,
    onOpenChange,
    propriete,
    demandeursDossier,
    dossierId
}: LinkDemandeurDialogProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDemandeur, setSelectedDemandeur] = useState<Demandeur | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // ✅ NOUVEAU : État pour date_demande
    const today = new Date().toISOString().split('T')[0];
    const [dateDemande, setDateDemande] = useState<string>(today);
    const [dateDemandeError, setDateDemandeError] = useState<string>('');

    // Réinitialiser l'état à la fermeture
    useEffect(() => {
        if (!open) {
            setSearchTerm('');
            setSelectedDemandeur(null);
            setIsSubmitting(false);
            setDateDemande(today);
            setDateDemandeError('');
        }
    }, [open, today]);

    // Filtrer les demandeurs disponibles
    const demandeursDisponibles = demandeursDossier.filter(dem => {
        const dejaLie = propriete.demandeurs?.some(d => d.id === dem.id);
        return !dejaLie;
    });

    // Recherche
    const demandeursFiltres = demandeursDisponibles.filter(dem => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            dem.nom_demandeur.toLowerCase().includes(search) ||
            dem.prenom_demandeur?.toLowerCase().includes(search) ||
            dem.cin.includes(search)
        );
    });

    // ✅ NOUVEAU : Validation date_demande avec cohérence date_requisition
    const handleDateDemandeChange = (newDate: string) => {
        setDateDemande(newDate);
        
        if (new Date(newDate) > new Date()) {
            setDateDemandeError('La date ne peut pas être dans le futur');
            return;
        }
        
        if (new Date(newDate) < new Date('2020-01-01')) {
            setDateDemandeError('La date ne peut pas être antérieure au 01/01/2020');
            return;
        }
        
        // ✅ Vérifier cohérence avec date_requisition
        if (propriete.date_requisition) {
            const dateRequisition = new Date(propriete.date_requisition);
            if (new Date(newDate) < dateRequisition) {
                setDateDemandeError('La date de demande ne peut pas être antérieure à la date de réquisition');
                return;
            }
        }
        
        setDateDemandeError('');
    };

    // ✅ MISE À JOUR : Soumission avec date_demande
    const handleSubmit = () => {
        if (!selectedDemandeur) {
            toast.error('Veuillez sélectionner un demandeur');
            return;
        }

        if (dateDemandeError) {
            toast.error('Erreur de date', { description: dateDemandeError });
            return;
        }

        setIsSubmitting(true);

        router.post(route('association.link'), {
            id_demandeur: selectedDemandeur.id,
            id_propriete: propriete.id,
            id_dossier: dossierId,
            date_demande: dateDemande, // ✅ NOUVEAU
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Demandeur lié avec succès');
                onOpenChange(false);
            },
            onError: (errors) => {
                toast.error('Erreur', {
                    description: Object.values(errors).join('\n')
                });
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleCancel = () => {
        if (!isSubmitting) {
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className="max-w-3xl max-h-[80vh] flex flex-col"
                onInteractOutside={(e) => {
                    if (isSubmitting) {
                        e.preventDefault();
                    }
                }}
                onEscapeKeyDown={(e) => {
                    if (isSubmitting) {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle>Lier un demandeur existant</DialogTitle>
                    <DialogDescription>
                        Propriété : Lot {propriete.lot} {propriete.titre ? `- TNº${propriete.titre}` : ''}
                        {propriete.date_requisition && (
                            <span className="block text-xs mt-1">
                                Date réquisition : {new Date(propriete.date_requisition).toLocaleDateString('fr-FR')}
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* ✅ NOUVEAU : Section Date de demande */}
                    <div className="sticky top-0 bg-background pb-4 border-b z-10">
                        <DatePickerDemande
                            value={dateDemande}
                            onChange={handleDateDemandeChange}
                            error={dateDemandeError}
                            required
                            label="Date de la demande"
                            description="Date à laquelle le demandeur fait sa demande"
                            minDate={propriete.date_requisition || '2020-01-01'}
                        />
                    </div>

                    {/* Barre de recherche */}
                    <div>
                        <Label>Rechercher par nom ou CIN</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Nom, prénom ou CIN..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {/* Liste des demandeurs */}
                    {demandeursDisponibles.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Aucun demandeur disponible dans ce dossier ou tous sont déjà liés à cette propriété.
                            </AlertDescription>
                        </Alert>
                    ) : demandeursFiltres.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Aucun résultat pour "{searchTerm}"
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-2">
                            {demandeursFiltres.map((dem) => (
                                <div
                                    key={dem.id}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                                        selectedDemandeur?.id === dem.id
                                            ? 'border-primary bg-primary/5 shadow-sm'
                                            : 'border-border'
                                    } ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
                                    onClick={() => !isSubmitting && setSelectedDemandeur(dem)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <p className="font-semibold">
                                                    {dem.titre_demandeur} {dem.nom_demandeur} {dem.prenom_demandeur}
                                                </p>
                                                {selectedDemandeur?.id === dem.id && (
                                                    <Badge variant="default">Sélectionné</Badge>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                                <p><strong>CIN:</strong> {dem.cin}</p>
                                                <p><strong>Tél:</strong> {dem.telephone || '-'}</p>
                                                <p><strong>Domicile:</strong> {dem.domiciliation || '-'}</p>
                                                <p><strong>Occupation:</strong> {dem.occupation || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer avec actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                        {demandeursFiltres.length} demandeur(s) disponible(s)
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!selectedDemandeur || isSubmitting || !!dateDemandeError}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Liaison...
                                </>
                            ) : (
                                <>
                                    <Link2 className="mr-2 h-4 w-4" />
                                    Lier le demandeur
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}