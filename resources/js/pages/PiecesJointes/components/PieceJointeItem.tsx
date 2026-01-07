// components/PieceJointeItem.tsx
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
    Image, 
    FileText, 
    File, 
    MoreVertical, 
    Eye, 
    Download, 
    CheckCircle, 
    Trash2,
    User,
    Calendar
} from 'lucide-react';
import type { PieceJointe } from '@/pages/PiecesJointes/pieces-jointes';
import { CATEGORIES, formatDate } from '@/pages/PiecesJointes/pieces-jointes';

interface PieceJointeItemProps {
    piece: PieceJointe;
    canVerify?: boolean;
    canDelete?: boolean;
    onPreview: (url: string, fileName: string, downloadUrl: string) => void;
    onVerify: (id: number) => void;
    onDelete: (id: number) => void;
}

export default function PieceJointeItem({
    piece,
    canVerify = false,
    canDelete = true,
    onPreview,
    onVerify,
    onDelete
}: PieceJointeItemProps) {
    const getFileIcon = () => {
        if (piece.is_image) return <Image className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />;
        if (piece.is_pdf) return <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />;
        return <File className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />;
    };

    const handlePreview = () => {
        if (piece.is_image || piece.is_pdf) {
            // Utiliser l'URL de téléchargement directement pour éviter les problèmes
            // La route 'view' doit retourner le fichier brut
            onPreview(piece.view_url, piece.nom_original, piece.url);
        }
    };

    return (
        <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 border rounded-lg hover:bg-muted/50 transition group">
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
                {getFileIcon()}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                {/* File name */}
                <p className="font-medium text-sm sm:text-base truncate leading-tight">
                    {piece.nom_original}
                </p>
                
                {/* Metadata - Stack on mobile, inline on desktop */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="shrink-0">{piece.taille_formatee}</span>
                    
                    {piece.type_document && (
                        <>
                            <span className="hidden sm:inline">•</span>
                            <Badge variant="outline" className="text-xs w-fit">
                                {piece.type_document}
                            </Badge>
                        </>
                    )}
                    
                    <span className="hidden sm:inline">•</span>
                    <Badge className={`text-xs w-fit ${CATEGORIES[piece.categorie]?.color || ''}`}>
                        {piece.categorie_label}
                    </Badge>
                    
                    {piece.is_verified && (
                        <>
                            <span className="hidden sm:inline">•</span>
                            <Badge variant="outline" className="text-xs w-fit bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Vérifié
                            </Badge>
                        </>
                    )}
                </div>
                
                {/* Description */}
                {piece.description && (
                    <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">
                        {piece.description}
                    </p>
                )}

                {/* User & Date - Mobile */}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground sm:hidden">
                    {piece.user && (
                        <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {piece.user.name}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(piece.created_at)}
                    </span>
                </div>
            </div>

            {/* Actions Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition"
                        aria-label="Actions"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {(piece.is_image || piece.is_pdf) && (
                        <DropdownMenuItem onClick={handlePreview}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualiser
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                        <a href={piece.url} download className="flex items-center w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger
                        </a>
                    </DropdownMenuItem>
                    {canVerify && !piece.is_verified && (
                        <DropdownMenuItem onClick={() => onVerify(piece.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Vérifier
                        </DropdownMenuItem>
                    )}
                    {canDelete && (
                        <DropdownMenuItem 
                            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                            onClick={() => onDelete(piece.id)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}