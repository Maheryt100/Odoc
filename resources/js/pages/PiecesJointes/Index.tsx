// pages/PiecesJointes/Index.tsx 
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Upload, 
    FolderOpen, 
    Search, 
    Loader2, 
    FileText, 
    User, 
    Home,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

import PieceJointeItem from '@/pages/PiecesJointes/components/PieceJointeItem';
import UploadPieceJointeDialog from '@/pages/PiecesJointes/components/UploadPieceJointeDialog';
import PreviewModal from '@/components/PreviewModal';
import type { 
    PieceJointe, 
    RelatedPieces, 
    PiecesJointesIndexProps 
} from '@/pages/PiecesJointes/pieces-jointes';
import { getCsrfToken } from '@/pages/PiecesJointes/pieces-jointes';

export default function PiecesJointesIndex({
    attachableType,
    attachableId,
    title = 'Pièces jointes',
    canUpload = true,
    canDelete = true,
    canVerify = false,
    initialCount = 0,
    demandeurs = [],
    proprietes = [],
    showRelated = true,
}: PiecesJointesIndexProps) {
    const [pieces, setPieces] = useState<PieceJointe[]>([]);
    const [relatedPieces, setRelatedPieces] = useState<RelatedPieces>({ 
        demandeurs: {}, 
        proprietes: {} 
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    
    // État pour le preview - simplifié
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewFileName, setPreviewFileName] = useState<string>('');
    const [previewDownloadUrl, setPreviewDownloadUrl] = useState<string>('');
    
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchPieces = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                attachable_type: attachableType,
                attachable_id: String(attachableId),
                include_related: showRelated && attachableType === 'Dossier' ? 'true' : 'false',
            });

            const response = await fetch(route('pieces-jointes.index') + `?${params}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setPieces(data.pieces_jointes || []);
                if (data.related_pieces) {
                    setRelatedPieces(data.related_pieces);
                }
            } else {
                setError(data.message || 'Erreur lors du chargement');
                toast.error(data.message || 'Erreur lors du chargement');
            }
        } catch (error) {
            console.error('Erreur chargement:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erreur de chargement';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [attachableType, attachableId, showRelated]);

    useEffect(() => {
        fetchPieces();
    }, [fetchPieces]);

    const handleDelete = async (id: number) => {
        if (!confirm('Supprimer ce fichier ? Cette action est irréversible.')) return;

        try {
            const response = await fetch(route('pieces-jointes.destroy', id), {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const data = await response.json();
            
            if (data.success) {
                toast.success('Fichier supprimé');
                fetchPieces();
            } else {
                toast.error(data.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleVerify = async (id: number) => {
        try {
            const response = await fetch(route('pieces-jointes.verify', id), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const data = await response.json();
            
            if (data.success) {
                toast.success('Document vérifié');
                fetchPieces();
            } else {
                toast.error(data.message || 'Erreur');
            }
        } catch (error) {
            console.error('Erreur vérification:', error);
            toast.error('Erreur lors de la vérification');
        }
    };

    // Fonction de preview corrigée
    const handlePreview = (url: string, fileName: string, downloadUrl: string) => {
        console.log('Opening preview:', { url, fileName, downloadUrl });
        
        // Définir l'état AVANT d'ouvrir
        setPreviewUrl(url);
        setPreviewFileName(fileName);
        setPreviewDownloadUrl(downloadUrl);
        
        // Petit délai pour s'assurer que le state est mis à jour
        setTimeout(() => {
            setPreviewOpen(true);
        }, 50);
    };

    // Fonction de fermeture corrigée
    const handlePreviewClose = (open: boolean) => {
        setPreviewOpen(open);
        
        // Reset après fermeture
        if (!open) {
            setTimeout(() => {
                setPreviewUrl(null);
                setPreviewFileName('');
                setPreviewDownloadUrl('');
            }, 300);
        }
    };

    const filteredPieces = pieces.filter(p => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            p.nom_original.toLowerCase().includes(search) ||
            p.type_document?.toLowerCase().includes(search) ||
            p.categorie?.toLowerCase().includes(search) ||
            p.description?.toLowerCase().includes(search)
        );
    });

    const totalCount = pieces.length + 
        Object.values(relatedPieces.demandeurs).reduce((acc, d) => acc + (d.pieces?.length || 0), 0) +
        Object.values(relatedPieces.proprietes).reduce((acc, p) => acc + (p.pieces?.length || 0), 0);

    const renderEmptyState = (message: string) => (
        <div className="text-center text-muted-foreground py-8 sm:py-12">
            <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-sm sm:text-base">{message}</p>
            {canUpload && (
                <p className="text-xs sm:text-sm mt-1 opacity-70">
                    Ajoutez des documents pour commencer
                </p>
            )}
        </div>
    );

    return (
        <>
            <Card className="border-0 shadow-lg">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/20 dark:to-blue-950/20 px-3 sm:px-6 py-2.5 sm:py-3 border-b">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="p-1 sm:p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg shrink-0">
                                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-lg font-bold leading-tight truncate">
                                    {title}
                                </h2>
                                <p className="text-xs text-muted-foreground hidden sm:block">
                                    {totalCount} document{totalCount > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        
                        {canUpload && (
                            <Button 
                                onClick={() => setUploadDialogOpen(true)} 
                                size="sm" 
                                className="h-8 sm:h-9 text-xs sm:text-sm shrink-0"
                            >
                                <Upload className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span className="hidden sm:inline">Ajouter</span>
                                <span className="sm:hidden">+</span>
                            </Button>
                        )}
                    </div>
                </div>

                <CardContent className="p-3 sm:p-4">
                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive" className="mb-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Search */}
                    <div className="relative mb-3">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un document..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 sm:pl-9 h-8 sm:h-9 text-sm"
                        />
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center py-8 sm:py-12">
                            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {/* Content */}
                    {!loading && (
                        <>
                            {attachableType === 'Dossier' && showRelated ? (
                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsList className="mb-3 bg-muted/30 h-8 sm:h-9 w-full grid grid-cols-4 gap-1">
                                        <TabsTrigger value="all" className="text-xs px-1">
                                            Tous
                                            <Badge variant="secondary" className="ml-1 text-xs px-1 h-4">
                                                {totalCount}
                                            </Badge>
                                        </TabsTrigger>
                                        <TabsTrigger value="dossier" className="text-xs px-1">
                                            <span className="hidden sm:inline">Dossier</span>
                                            <span className="sm:hidden">Dos.</span>
                                            <Badge variant="secondary" className="ml-1 text-xs px-1 h-4">
                                                {pieces.length}
                                            </Badge>
                                        </TabsTrigger>
                                        <TabsTrigger value="demandeurs" className="text-xs px-1">
                                            <span className="hidden sm:inline">Demandeurs</span>
                                            <span className="sm:hidden">Dem.</span>
                                            <Badge variant="secondary" className="ml-1 text-xs px-1 h-4">
                                                {Object.keys(relatedPieces.demandeurs).length}
                                            </Badge>
                                        </TabsTrigger>
                                        <TabsTrigger value="proprietes" className="text-xs px-1">
                                            <span className="hidden sm:inline">Propriétés</span>
                                            <span className="sm:hidden">Prop.</span>
                                            <Badge variant="secondary" className="ml-1 text-xs px-1 h-4">
                                                {Object.keys(relatedPieces.proprietes).length}
                                            </Badge>
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Tab: All */}
                                    <TabsContent value="all" className="space-y-2 mt-0">
                                        {filteredPieces.map(p => (
                                            <PieceJointeItem
                                                key={p.id}
                                                piece={p}
                                                canVerify={canVerify}
                                                canDelete={canDelete}
                                                onPreview={handlePreview}
                                                onVerify={handleVerify}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                        {Object.values(relatedPieces.demandeurs).map((d) =>
                                            d.pieces?.map((p: PieceJointe) => (
                                                <PieceJointeItem
                                                    key={p.id}
                                                    piece={p}
                                                    canVerify={canVerify}
                                                    canDelete={canDelete}
                                                    onPreview={handlePreview}
                                                    onVerify={handleVerify}
                                                    onDelete={handleDelete}
                                                />
                                            ))
                                        )}
                                        {Object.values(relatedPieces.proprietes).map((pr) =>
                                            pr.pieces?.map((p: PieceJointe) => (
                                                <PieceJointeItem
                                                    key={p.id}
                                                    piece={p}
                                                    canVerify={canVerify}
                                                    canDelete={canDelete}
                                                    onPreview={handlePreview}
                                                    onVerify={handleVerify}
                                                    onDelete={handleDelete}
                                                />
                                            ))
                                        )}
                                        {totalCount === 0 && renderEmptyState('Aucune pièce jointe')}
                                    </TabsContent>

                                    {/* Tab: Dossier */}
                                    <TabsContent value="dossier" className="space-y-2 mt-0">
                                        {filteredPieces.map(p => (
                                            <PieceJointeItem
                                                key={p.id}
                                                piece={p}
                                                canVerify={canVerify}
                                                canDelete={canDelete}
                                                onPreview={handlePreview}
                                                onVerify={handleVerify}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                        {filteredPieces.length === 0 && renderEmptyState('Aucune pièce jointe du dossier')}
                                    </TabsContent>

                                    {/* Tab: Demandeurs */}
                                    <TabsContent value="demandeurs" className="space-y-2 sm:space-y-3 mt-0">
                                        {Object.entries(relatedPieces.demandeurs).map(([id, data]) => (
                                            <div key={id} className="border rounded-lg p-2 sm:p-3 bg-muted/20">
                                                <h4 className="font-medium mb-2 flex items-center gap-2 text-xs sm:text-sm">
                                                    <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                                                    <span className="truncate">
                                                        {data.demandeur.nom_demandeur} {data.demandeur.prenom_demandeur}
                                                    </span>
                                                    <Badge variant="outline" className="text-xs shrink-0">
                                                        {data.demandeur.cin}
                                                    </Badge>
                                                </h4>
                                                <div className="space-y-2">
                                                    {data.pieces?.map((p: PieceJointe) => (
                                                        <PieceJointeItem
                                                            key={p.id}
                                                            piece={p}
                                                            canVerify={canVerify}
                                                            canDelete={canDelete}
                                                            onPreview={handlePreview}
                                                            onVerify={handleVerify}
                                                            onDelete={handleDelete}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {Object.keys(relatedPieces.demandeurs).length === 0 && 
                                            renderEmptyState('Aucune pièce jointe de demandeur')}
                                    </TabsContent>

                                    {/* Tab: Propriétés */}
                                    <TabsContent value="proprietes" className="space-y-2 sm:space-y-3 mt-0">
                                        {Object.entries(relatedPieces.proprietes).map(([id, data]) => (
                                            <div key={id} className="border rounded-lg p-2 sm:p-3 bg-muted/20">
                                                <h4 className="font-medium mb-2 flex items-center gap-2 text-xs sm:text-sm">
                                                    <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                                                    <span>Lot {data.propriete.lot}</span>
                                                    {data.propriete.titre && (
                                                        <Badge variant="outline" className="text-xs">
                                                            TNº{data.propriete.titre}
                                                        </Badge>
                                                    )}
                                                </h4>
                                                <div className="space-y-2">
                                                    {data.pieces?.map((p: PieceJointe) => (
                                                        <PieceJointeItem
                                                            key={p.id}
                                                            piece={p}
                                                            canVerify={canVerify}
                                                            canDelete={canDelete}
                                                            onPreview={handlePreview}
                                                            onVerify={handleVerify}
                                                            onDelete={handleDelete}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {Object.keys(relatedPieces.proprietes).length === 0 && 
                                            renderEmptyState('Aucune pièce jointe de propriété')}
                                    </TabsContent>
                                </Tabs>
                            ) : (
                                <div className="space-y-2">
                                    {filteredPieces.length > 0 ? (
                                        filteredPieces.map(p => (
                                            <PieceJointeItem
                                                key={p.id}
                                                piece={p}
                                                canVerify={canVerify}
                                                canDelete={canDelete}
                                                onPreview={handlePreview}
                                                onVerify={handleVerify}
                                                onDelete={handleDelete}
                                            />
                                        ))
                                    ) : (
                                        renderEmptyState('Aucune pièce jointe')
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Upload Dialog */}
            <UploadPieceJointeDialog
                open={uploadDialogOpen}
                onOpenChange={setUploadDialogOpen}
                attachableType={attachableType}
                attachableId={attachableId}
                demandeurs={demandeurs}
                proprietes={proprietes}
                onSuccess={fetchPieces}
            />

            {/* Preview Modal - État géré séparément */}
            <PreviewModal
                open={previewOpen}
                onOpenChange={handlePreviewClose}
                url={previewUrl}
                fileName={previewFileName}
                downloadUrl={previewDownloadUrl}
            />
        </>
    );
}