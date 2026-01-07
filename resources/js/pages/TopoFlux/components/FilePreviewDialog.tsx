// resources/js/pages/TopoFlux/components/FilePreviewDialog.tsx
// ✅ VERSION CORRIGÉE - CLÉS UNIQUES GARANTIES

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Image as ImageIcon,
    File,
    Download,
    CheckSquare,
    Square
} from 'lucide-react';

interface TopoFile {
    id: number;
    name: string;
    size: number;
    mime_type: string;
    category: string;
}

interface FilePreviewDialogProps {
    open: boolean;
    import: any | null;
    selectedFiles: number[];
    onSelectionChange: (fileIds: number[]) => void;
    onClose: () => void;
}

export default function FilePreviewDialog({
    open,
    import: imp,
    selectedFiles,
    onSelectionChange,
    onClose
}: FilePreviewDialogProps) {
    if (!imp || !imp.files || !Array.isArray(imp.files)) return null;
    
    const files: TopoFile[] = imp.files;
    
    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) {
            return <ImageIcon className="h-8 w-8 text-blue-500" />;
        }
        if (mimeType.includes('pdf')) {
            return <FileText className="h-8 w-8 text-red-500" />;
        }
        return <File className="h-8 w-8 text-gray-500" />;
    };
    
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    
    const toggleFile = (fileId: number) => {
        if (selectedFiles.includes(fileId)) {
            onSelectionChange(selectedFiles.filter(id => id !== fileId));
        } else {
            onSelectionChange([...selectedFiles, fileId]);
        }
    };
    
    const toggleAll = () => {
        if (selectedFiles.length === files.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(files.map((f: TopoFile) => f.id));
        }
    };
    
    const getCategoryBadge = (category: string) => {
        const colors: Record<string, string> = {
            'cin': 'bg-blue-100 text-blue-800 border-blue-300',
            'acte': 'bg-green-100 text-green-800 border-green-300',
            'plan': 'bg-purple-100 text-purple-800 border-purple-300',
            'autre': 'bg-gray-100 text-gray-800 border-gray-300'
        };
        
        return (
            <Badge className={colors[category] || colors['autre']} variant="outline">
                {category.toUpperCase()}
            </Badge>
        );
    };
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Fichiers joints ({files.length})
                    </DialogTitle>
                    <DialogDescription>
                        Prévisualisez et gérez les fichiers associés à cet import. 
                        Sélectionnez les fichiers à conserver lors de l'importation.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto">
                    <div className="space-y-4">
                        {/* Sélection globale */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Checkbox
                                checked={selectedFiles.length === files.length && files.length > 0}
                                onCheckedChange={toggleAll}
                            />
                            <div className="flex items-center gap-2">
                                {selectedFiles.length === files.length && files.length > 0 ? (
                                    <>
                                        <CheckSquare className="h-4 w-4 text-green-600" />
                                        <span className="font-medium">Tous sélectionnés</span>
                                    </>
                                ) : (
                                    <>
                                        <Square className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Sélectionner tous</span>
                                    </>
                                )}
                            </div>
                            <Badge variant="outline" className="ml-auto">
                                {selectedFiles.length} / {files.length} sélectionné{selectedFiles.length > 1 ? 's' : ''}
                            </Badge>
                        </div>
                        
                        {/* Liste des fichiers - ✅ CLÉ UNIQUE GARANTIE */}
                        <div className="space-y-2">
                            {files.map((file: TopoFile, index: number) => {
                                // ✅ Clé composite unique : id + index + nom
                                const uniqueKey = `file-${file.id}-${index}-${file.name.replace(/[^a-zA-Z0-9]/g, '')}`;
                                
                                return (
                                    <div
                                        key={uniqueKey}
                                        className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                            selectedFiles.includes(file.id)
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                        onClick={() => toggleFile(file.id)}
                                    >
                                        <Checkbox
                                            checked={selectedFiles.includes(file.id)}
                                            onCheckedChange={() => toggleFile(file.id)}
                                        />
                                        
                                        <div className="flex-shrink-0">
                                            {getFileIcon(file.mime_type)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{file.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatFileSize(file.size)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">•</span>
                                                {getCategoryBadge(file.category)}
                                            </div>
                                        </div>
                                        
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('Télécharger fichier:', file.id);
                                            }}
                                            className="gap-2"
                                        >
                                            <Download className="h-4 w-4" />
                                            Télécharger
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                
                <DialogFooter className="border-t pt-4">
                    <div className="flex items-center justify-between w-full">
                        <p className="text-sm text-muted-foreground">
                            {selectedFiles.length === 0 ? (
                                'Aucun fichier sélectionné'
                            ) : (
                                `${selectedFiles.length} fichier${selectedFiles.length > 1 ? 's' : ''} sélectionné${selectedFiles.length > 1 ? 's' : ''}`
                            )}
                        </p>
                        <Button onClick={onClose}>
                            Fermer
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}