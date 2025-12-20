// Dashboard/components/QuickActions.tsx - VERSION CORRIGÉE
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { Folder, FolderOpen, TrendingUp, Calendar } from 'lucide-react';

export function QuickActions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Actions rapides</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    Accès directs aux fonctionnalités principales
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* ✅ CORRECTION : Grid responsive 1/2/4 colonnes */}
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Button asChild variant="outline" className="h-auto py-4 hover:bg-accent">
                        <Link href={route('dossiers.create')}>
                            <div className="flex flex-col items-center gap-2">
                                <Folder className="h-5 w-5 sm:h-6 sm:w-6" />
                                <span className="text-xs sm:text-sm">Nouveau dossier</span>
                            </div>
                        </Link>
                    </Button>
                    
                    <Button asChild variant="outline" className="h-auto py-4 hover:bg-accent">
                        <Link href={route('dossiers')}>
                            <div className="flex flex-col items-center gap-2">
                                <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6" />
                                <span className="text-xs sm:text-sm">Voir dossiers</span>
                            </div>
                        </Link>
                    </Button>
                    
                    <Button asChild variant="outline" className="h-auto py-4 hover:bg-accent">
                        <Link href={route('statistiques.index')}>
                            <div className="flex flex-col items-center gap-2">
                                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                                <span className="text-xs sm:text-sm">Statistiques</span>
                            </div>
                        </Link>
                    </Button>
                    
                    <Button asChild variant="outline" className="h-auto py-4 hover:bg-accent">
                        <Link href={route('admin.activity-logs.index')}>
                            <div className="flex flex-col items-center gap-2">
                                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                                <span className="text-xs sm:text-sm">Logs d'activité</span>
                            </div>
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}