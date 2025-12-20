import { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogContent,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
    X, 
    Download, 
    ZoomIn, 
    ZoomOut,
    RotateCw,
    Maximize2,
    Minimize2,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface PreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string | null;
    fileName?: string;
    downloadUrl?: string;
}

export default function PreviewModal({
    open,
    onOpenChange,
    url,
    fileName = 'document',
    downloadUrl
}: PreviewModalProps) {
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Détection mobile simple
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Reset state when URL changes or modal opens
    useEffect(() => {
        if (url && open) {
            setZoom(100);
            setRotation(0);
            setLoading(true);
            setError(null);
            setIsFullscreen(false);
        }
    }, [url, open]);

    // Cleanup on close
    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                setZoom(100);
                setRotation(0);
                setLoading(true);
                setError(null);
                setIsFullscreen(false);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [open]);

    if (!url) return null;

    const isPdf = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('pdf');
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || (!isPdf && url.includes('view'));

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
    const handleReset = () => {
        setZoom(100);
        setRotation(0);
    };
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);
    const toggleFullscreen = () => setIsFullscreen(prev => !prev);

    const handleDownload = () => {
        if (downloadUrl) {
            window.location.href = downloadUrl;
        } else if (url) {
            window.location.href = url;
        }
    };

    const handleLoad = () => {
        setLoading(false);
        setError(null);
    };

    const handleError = () => {
        setLoading(false);
        setError('Impossible de charger le document');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className={`
                    ${isFullscreen 
                        ? 'w-screen h-screen max-w-none rounded-none' 
                        : 'max-w-[95vw] sm:max-w-[90vw] lg:max-w-[85vw] h-[95vh]'
                    }
                    p-0 gap-0 flex flex-col overflow-hidden
                `}
            >
                {/* Accessibilité */}
                <VisuallyHidden>
                    <DialogTitle>{fileName}</DialogTitle>
                    <DialogDescription>
                        Prévisualisation de {isPdf ? 'document PDF' : 'image'}
                    </DialogDescription>
                </VisuallyHidden>

                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-muted/30 shrink-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <h3 className="font-medium text-sm sm:text-base truncate">
                            {fileName}
                        </h3>
                        {!isMobile && (
                            <span className="text-xs text-muted-foreground">
                                {isPdf ? 'PDF' : isImage ? 'Image' : 'Document'}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        {/* Zoom Controls - Only for Images */}
                        {isImage && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleZoomOut}
                                    disabled={zoom <= 25}
                                    className="h-8 w-8 sm:h-9 sm:w-9"
                                    title="Zoom arrière"
                                >
                                    <ZoomOut className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReset}
                                    className="hidden sm:flex h-8 px-3 text-xs font-medium min-w-[3.5rem]"
                                    title="Réinitialiser"
                                >
                                    {zoom}%
                                </Button>
                                
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleZoomIn}
                                    disabled={zoom >= 300}
                                    className="h-8 w-8 sm:h-9 sm:w-9"
                                    title="Zoom avant"
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </Button>

                                {!isMobile && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleRotate}
                                        className="h-8 w-8 sm:h-9 sm:w-9"
                                        title="Pivoter"
                                    >
                                        <RotateCw className="h-4 w-4" />
                                    </Button>
                                )}
                            </>
                        )}

                        {/* Fullscreen */}
                        {!isMobile && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleFullscreen}
                                className="h-8 w-8 sm:h-9 sm:w-9"
                                title={isFullscreen ? "Quitter plein écran" : "Plein écran"}
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="h-4 w-4" />
                                ) : (
                                    <Maximize2 className="h-4 w-4" />
                                )}
                            </Button>
                        )}
                        
                        {/* Download */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDownload}
                            className="h-8 w-8 sm:h-9 sm:w-9"
                            title="Télécharger"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                        
                        {/* Close */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 sm:h-9 sm:w-9"
                            title="Fermer"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content - LA CLÉ DU SUCCÈS: flex-1 overflow-auto */}
                <div className="flex-1 overflow-auto bg-muted/10 relative">
                    {/* Loading */}
                    {loading && !error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                                <p className="text-sm text-muted-foreground">Chargement...</p>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-4 sm:p-6">
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="space-y-2">
                                    <p>{error}</p>
                                    <div className="flex gap-2 mt-3">
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => {
                                                setError(null);
                                                setLoading(true);
                                            }}
                                        >
                                            Réessayer
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            onClick={handleDownload}
                                        >
                                            <Download className="mr-2 h-3 w-3" />
                                            Télécharger
                                        </Button>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {/* PDF Viewer */}
                    {isPdf && !error && (
                        <iframe
                            src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
                            className="w-full h-full border-0"
                            title={fileName}
                            onLoad={handleLoad}
                            onError={handleError}
                        />
                    )}

                    {/* Image Viewer - LOGIQUE DE VOTRE CODE QUI MARCHAIT */}
                    {isImage && !error && (
                        <div className="flex items-center justify-center min-h-full p-2 sm:p-4">
                            <img
                                src={url}
                                alt={fileName}
                                className="max-w-full h-auto rounded shadow-lg"
                                style={{ 
                                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                                    transition: 'transform 0.2s ease',
                                    transformOrigin: 'center center'
                                }}
                                onLoad={handleLoad}
                                onError={handleError}
                            />
                        </div>
                    )}

                    {/* Autres types de fichiers */}
                    {!isPdf && !isImage && !error && (
                        <div className="flex items-center justify-center min-h-full p-2 sm:p-4">
                            <div className="text-center space-y-4">
                                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Aperçu non disponible</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Ce type de fichier ne peut pas être prévisualisé
                                    </p>
                                </div>
                                <Button onClick={handleDownload}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Télécharger le fichier
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Bottom Bar - Only for Images */}
                {isMobile && isImage && !error && (
                    <div className="border-t bg-muted/30 p-2 flex items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-1 flex-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleZoomOut}
                                disabled={zoom <= 25}
                                className="h-9 w-9"
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                                className="h-9 px-3 text-xs font-medium"
                            >
                                {zoom}%
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleZoomIn}
                                disabled={zoom >= 300}
                                className="h-9 w-9"
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleRotate}
                                className="h-9 w-9"
                            >
                                <RotateCw className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleFullscreen}
                                className="h-9 w-9"
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="h-4 w-4" />
                                ) : (
                                    <Maximize2 className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}