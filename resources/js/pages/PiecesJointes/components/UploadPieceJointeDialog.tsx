// components/UploadPieceJointeDialog.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Upload, Loader2, X, File, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { 
    UploadForm, 
    BaseDemandeur, 
    BasePropriete 
} from '@/pages/PiecesJointes/pieces-jointes';
import { 
    CATEGORIES, 
    TYPES_DOCUMENTS, 
    getCsrfToken,
    formatFileSize 
} from '@/pages/PiecesJointes/pieces-jointes';

interface UploadPieceJointeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attachableType: 'Dossier' | 'Demandeur' | 'Propriete';
    attachableId: number;
    demandeurs?: BaseDemandeur[];
    proprietes?: BasePropriete[];
    onSuccess: () => void;
}

export default function UploadPieceJointeDialog({
    open,
    onOpenChange,
    attachableType,
    attachableId,
    demandeurs = [],
    proprietes = [],
    onSuccess
}: UploadPieceJointeDialogProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState<UploadForm>({
        files: [],
        type_document: '',
        categorie: 'global',
        description: '',
        linked_entity_type: '',
        linked_entity_id: '',
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        
        // Validation de base
        const validFiles = files.filter(file => {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name}: Fichier trop volumineux (max 10 MB)`);
                return false;
            }
            return true;
        });

        setUploadForm(prev => ({ ...prev, files: validFiles }));
    };

    const removeFile = (index: number) => {
        setUploadForm(prev => ({
            ...prev,
            files: prev.files.filter((_, i) => i !== index)
        }));
    };

    const handleUpload = async () => {
        if (uploadForm.files.length === 0) {
            toast.error('Sélectionnez au moins un fichier');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        
        uploadForm.files.forEach(file => formData.append('files[]', file));
        formData.append('attachable_type', attachableType);
        formData.append('attachable_id', String(attachableId));
        
        if (uploadForm.type_document) {
            formData.append('type_document', uploadForm.type_document);
        }
        formData.append('categorie', uploadForm.categorie);
        
        if (uploadForm.description) {
            formData.append('descriptions[0]', uploadForm.description);
        }

        if (uploadForm.linked_entity_type && uploadForm.linked_entity_id) {
            formData.append('linked_entity_type', uploadForm.linked_entity_type);
            formData.append('linked_entity_id', String(uploadForm.linked_entity_id));
        }

        try {
            const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            console.log('CSRF Token:', csrfToken); // Debug
            
            const response = await fetch(route('pieces-jointes.upload'), {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });


            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                onOpenChange(false);
                setUploadForm({
                    files: [],
                    type_document: '',
                    categorie: 'global',
                    description: '',
                    linked_entity_type: '',
                    linked_entity_id: '',
                });
                onSuccess();
            } else {
                toast.error(data.message || 'Erreur lors de l\'upload');
                if (data.errors && data.errors.length > 0) {
                    data.errors.forEach((error: any) => {
                        toast.error(`${error.file}: ${error.errors.join(', ')}`);
                    });
                }
            }
        } catch (error) {
            console.error('Erreur upload:', error);
            toast.error('Erreur de connexion');
        } finally {
            setUploading(false);
        }
    };

    const getFileIcon = (file: File) => {
        const isImage = file.type.startsWith('image/');
        return isImage ? ImageIcon : File;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Ajouter des pièces jointes</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Sélectionnez les fichiers à uploader (PDF, images, documents)
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-3 sm:space-y-4 py-2">
                    {/* File Input */}
                    <div>
                        <Label className="text-sm">Fichiers *</Label>
                        <Input
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                            className="text-sm h-9"
                            disabled={uploading}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Max 10 MB par fichier
                        </p>
                    </div>

                    {/* Selected Files */}
                    {uploadForm.files.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm">
                                Fichiers sélectionnés ({uploadForm.files.length})
                            </Label>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {uploadForm.files.map((file, index) => {
                                    const Icon = getFileIcon(file);
                                    return (
                                        <div 
                                            key={index}
                                            className="flex items-center gap-2 p-2 border rounded text-sm bg-muted/30"
                                        >
                                            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate font-medium text-xs">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 shrink-0"
                                                onClick={() => removeFile(index)}
                                                disabled={uploading}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Type de document */}
                    <div>
                        <Label className="text-sm">Type de document</Label>
                        <Select 
                            value={uploadForm.type_document} 
                            onValueChange={(v) => setUploadForm(p => ({ ...p, type_document: v }))}
                            disabled={uploading}
                        >
                            <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(TYPES_DOCUMENTS).map(([key, label]) => (
                                    <SelectItem key={key} value={key} className="text-sm">
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Catégorie */}
                    <div>
                        <Label className="text-sm">Catégorie *</Label>
                        <Select 
                            value={uploadForm.categorie} 
                            onValueChange={(v) => setUploadForm(p => ({ ...p, categorie: v }))}
                            disabled={uploading}
                        >
                            <SelectTrigger className="h-9 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(CATEGORIES).map(([key, val]) => (
                                    <SelectItem key={key} value={key} className="text-sm">
                                        {val.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Liaison (pour Dossier uniquement) */}
                    {attachableType === 'Dossier' && (demandeurs.length > 0 || proprietes.length > 0) && (
                        <div className="space-y-2 p-2.5 sm:p-3 bg-muted/50 rounded-lg">
                            <Label className="text-xs sm:text-sm font-medium">
                                Lier à une entité (optionnel)
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {demandeurs.length > 0 && (
                                    <Select 
                                        value={uploadForm.linked_entity_type === 'Demandeur' ? String(uploadForm.linked_entity_id) : ''}
                                        onValueChange={(v) => setUploadForm(p => ({ 
                                            ...p, 
                                            linked_entity_type: 'Demandeur',
                                            linked_entity_id: v,
                                            categorie: 'demandeur'
                                        }))}
                                        disabled={uploading}
                                    >
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue placeholder="Demandeur" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {demandeurs.map(d => (
                                                <SelectItem key={d.id} value={String(d.id)} className="text-sm">
                                                    {d.nom_demandeur} {d.prenom_demandeur}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                {proprietes.length > 0 && (
                                    <Select 
                                        value={uploadForm.linked_entity_type === 'Propriete' ? String(uploadForm.linked_entity_id) : ''}
                                        onValueChange={(v) => setUploadForm(p => ({ 
                                            ...p, 
                                            linked_entity_type: 'Propriete',
                                            linked_entity_id: v,
                                            categorie: 'propriete'
                                        }))}
                                        disabled={uploading}
                                    >
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue placeholder="Propriété" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {proprietes.map(p => (
                                                <SelectItem key={p.id} value={String(p.id)} className="text-sm">
                                                    Lot {p.lot}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            {uploadForm.linked_entity_id && (
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => setUploadForm(p => ({ 
                                        ...p, 
                                        linked_entity_type: '',
                                        linked_entity_id: '',
                                        categorie: 'global'
                                    }))}
                                    disabled={uploading}
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Retirer la liaison
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <Label className="text-sm">Description (optionnel)</Label>
                        <Textarea
                            value={uploadForm.description}
                            onChange={(e) => setUploadForm(p => ({ ...p, description: e.target.value }))}
                            placeholder="Description du document..."
                            rows={2}
                            className="text-sm resize-none"
                            disabled={uploading}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button 
                        variant="outline" 
                        onClick={() => onOpenChange(false)}
                        disabled={uploading}
                        className="h-9 text-sm flex-1 sm:flex-none"
                    >
                        Annuler
                    </Button>
                    <Button 
                        onClick={handleUpload} 
                        disabled={uploading || uploadForm.files.length === 0}
                        className="h-9 text-sm flex-1 sm:flex-none"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Upload...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Uploader
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}