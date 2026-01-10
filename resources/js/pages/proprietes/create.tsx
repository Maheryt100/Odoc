// pages/proprietes/create.tsx 
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, FileText, MapPin, Calendar, Layers, Shield, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/useResponsive';

import type { ProprieteFormProps, ProprieteFormData } from '@/pages/proprietes/types';
import { CHARGE_OPTIONS, EMPTY_PROPRIETE } from '@/pages/proprietes/types';

export type { ProprieteFormData };
export const emptyPropriete = EMPTY_PROPRIETE;

export default function ProprieteCreate({
    data,
    onChange,
    onRemove,
    index,
    showRemoveButton = false,
    selectedCharges = [],
    onChargeChange
}: ProprieteFormProps) {
    const isMobile = useIsMobile();

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header avec badge - Responsive */}
            {showRemoveButton && onRemove && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-4 sm:pb-6 border-b-2 border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm sm:text-base px-2 sm:px-3 py-1 flex-shrink-0">
                            #{typeof index !== 'undefined' ? index + 1 : ''}
                        </Badge>
                        <h3 className="text-lg sm:text-xl font-bold truncate">
                            Propriété {typeof index !== 'undefined' ? index + 1 : ''}
                        </h3>
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={onRemove}
                        className="h-8 sm:h-9 gap-2 shadow-md w-full sm:w-auto"
                    >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        Retirer
                    </Button>
                </div>
            )}

            {/* Section Type d'opération - Responsive */}
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-3 border-b-2 border-blue-200 dark:border-blue-800">
                    <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-100 truncate">
                            Type d'opération
                        </h4>
                        <p className="text-xs text-muted-foreground">Choisir le type de procédure</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium text-red-600">Type d'opération *</Label>
                    <Select
                        value={data.type_operation}
                        onValueChange={(value: string) => onChange('type_operation', value)}
                    >
                        <SelectTrigger className="w-full sm:w-[280px] h-10 sm:h-11 text-sm sm:text-base">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="morcellement">Morcellement</SelectItem>
                            <SelectItem value="immatriculation">Immatriculation</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Section Identification du lot - Responsive */}
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-3 border-b-2 border-green-200 dark:border-green-800">
                    <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                        <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-green-900 dark:text-green-100 truncate">
                            Identification du lot
                        </h4>
                        <p className="text-xs text-muted-foreground">Informations de base du terrain</p>
                    </div>
                </div>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium text-red-600">Lot *</Label>
                        <Input
                            value={data.lot}
                            onChange={(e) => onChange('lot', e.target.value)}
                            placeholder=""
                            required
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium text-red-600">Nature *</Label>
                        <Select 
                            value={data.nature} 
                            onValueChange={(value: string) => onChange('nature', value)}
                        >
                            <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                                <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Urbaine">Urbaine</SelectItem>
                                <SelectItem value="Suburbaine">Suburbaine</SelectItem>
                                <SelectItem value="Rurale">Rurale</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium text-red-600">Vocation *</Label>
                        <Select 
                            value={data.vocation} 
                            onValueChange={(value: string) => onChange('vocation', value)}
                        >
                            <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                                <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Edilitaire">Edilitaire</SelectItem>
                                <SelectItem value="Agricole">Agricole</SelectItem>
                                <SelectItem value="Forestière">Forestière</SelectItem>
                                <SelectItem value="Touristique">Touristique</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Section Propriétaire & Titres - Responsive */}
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-3 border-b-2 border-purple-200 dark:border-purple-800">
                    <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-purple-900 dark:text-purple-100 truncate">
                            Propriétaire & Titres
                        </h4>
                        <p className="text-xs text-muted-foreground">Références et propriétaire actuel</p>
                    </div>
                </div>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                    {data.type_operation === 'morcellement' && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-xs sm:text-sm font-medium">Nom propriété mère</Label>
                                <Input
                                    value={data.propriete_mere}
                                    onChange={(e) => onChange('propriete_mere', e.target.value)}
                                    placeholder="Nom de la propriété mère"
                                    className="h-10 sm:h-11 text-sm sm:text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs sm:text-sm font-medium">Titre mère (format : 12.345-A)</Label>
                                <Input
                                    value={data.titre_mere}
                                    onChange={(e) => onChange('titre_mere', e.target.value)}
                                    placeholder="Numéro du titre mère"
                                    className="h-10 sm:h-11 text-sm sm:text-base"
                                />
                            </div>
                        </>
                    )}
                    
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Nom propriété / Propriétaire</Label>
                        <Input
                            value={data.proprietaire}
                            onChange={(e) => onChange('proprietaire', e.target.value)}
                            placeholder="Nom de la propriété"
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Titre  (format : 12.345-A)</Label>
                        <Input
                            value={data.titre}
                            onChange={(e) => onChange('titre', e.target.value)}
                            placeholder="Numéro du titre"
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                </div>
            </div>

            {/* Section Détails & Références - Responsive */}
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-3 border-b-2 border-indigo-200 dark:border-indigo-800">
                    <div className="p-1.5 sm:p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex-shrink-0">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-indigo-900 dark:text-indigo-100 truncate">
                            Détails & Références
                        </h4>
                        <p className="text-xs text-muted-foreground">Contenance et numéros administratifs</p>
                    </div>
                </div>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Contenance (m²)</Label>
                        <Input
                            type="number"
                            min={1}
                            value={data.contenance}
                            onChange={(e) => onChange('contenance', e.target.value)}
                            placeholder="en m²"
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Numero FNº  (format : 12-A/26)</Label>
                        <Input
                            value={data.numero_FN}
                            onChange={(e) => onChange('numero_FN', e.target.value)}
                            placeholder=""
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>
                    {data.type_operation === 'immatriculation' && (
                        <div className="space-y-2">
                            <Label className="text-xs sm:text-sm font-medium">Nº Requisition</Label>
                            <Input
                                value={data.numero_requisition}
                                onChange={(e) => onChange('numero_requisition', e.target.value)}
                                placeholder=""
                                className="h-10 sm:h-11 text-sm sm:text-base"
                            />
                        </div>
                    )}
                    <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                        <Label className="text-xs sm:text-sm font-medium">Charges</Label>
                        <div className="space-y-2 p-3 sm:p-4 border-2 rounded-lg bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {CHARGE_OPTIONS.map((charge) => (
                                    <div key={charge} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`charge-${charge}-${index || 0}`}
                                            checked={selectedCharges.includes(charge)}
                                            onCheckedChange={(checked) => 
                                                onChargeChange && onChargeChange(charge, checked as boolean)
                                            }
                                        />
                                        <label 
                                            htmlFor={`charge-${charge}-${index || 0}`} 
                                            className="text-xs sm:text-sm cursor-pointer font-medium break-words"
                                        >
                                            {charge}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Localisation - Responsive */}
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-3 border-b-2 border-orange-200 dark:border-orange-800">
                    <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-orange-900 dark:text-orange-100 truncate">
                            Localisation
                        </h4>
                        <p className="text-xs text-muted-foreground">Situation géographique</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium">Situation (sise à)</Label>
                    <Input
                        value={data.situation}
                        onChange={(e) => onChange('situation', e.target.value)}
                        placeholder=""
                        className="h-10 sm:h-11 text-sm sm:text-base"
                    />
                </div>
            </div>

            {/* Section Dates de dépôt - Responsive */}
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-3 border-b-2 border-sky-200 dark:border-sky-800">
                    <div className="p-1.5 sm:p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex-shrink-0">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-sky-900 dark:text-sky-100 truncate">
                            Dates de dépôt
                        </h4>
                        <p className="text-xs text-muted-foreground">Dates de dépôt inscription et réquisition</p>
                    </div>
                </div>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                    <div className="p-3 sm:p-4 border-2 rounded-xl bg-gradient-to-br from-blue-50/70 to-cyan-50/70 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs">
                                Dépôt 1
                            </Badge>
                            <span className="text-xs text-muted-foreground">Bordereau n°1</span>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label className="text-xs sm:text-sm font-medium">Date dépôt 1</Label>
                                <Input
                                    type="date"
                                    value={data.date_depot_1}
                                    onChange={(e) => onChange('date_depot_1', e.target.value)}
                                    className="h-10 sm:h-11 text-sm sm:text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs sm:text-sm font-medium">Dep Vol</Label>
                                <Input
                                    value={data.dep_vol_inscription}
                                    onChange={(e) => onChange('dep_vol_inscription', e.target.value)}
                                    placeholder=""
                                    className="h-10 sm:h-11 text-sm sm:text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs sm:text-sm font-medium">Numéro Dep Vol</Label>
                                <Input
                                    value={data.numero_dep_vol_inscription}
                                    onChange={(e) => onChange('numero_dep_vol_inscription', e.target.value)}
                                    placeholder=""
                                    className="h-10 sm:h-11 text-sm sm:text-base"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-3 sm:p-4 border-2 rounded-xl bg-gradient-to-br from-purple-50/70 to-pink-50/70 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs">
                                Dépôt 2
                            </Badge>
                            <span className="text-xs text-muted-foreground">Bordereau n°2</span>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label className="text-xs sm:text-sm font-medium">Date dépôt 2</Label>
                                <Input
                                    type="date"
                                    value={data.date_depot_2}
                                    onChange={(e) => onChange('date_depot_2', e.target.value)}
                                    className="h-10 sm:h-11 text-sm sm:text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs sm:text-sm font-medium">Dep Vol</Label>
                                <Input
                                    value={data.dep_vol_requisition}
                                    onChange={(e) => onChange('dep_vol_requisition', e.target.value)}
                                    placeholder=""
                                    className="h-10 sm:h-11 text-sm sm:text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs sm:text-sm font-medium">Numéro Dep Vol</Label>
                                <Input
                                    value={data.numero_dep_vol_requisition}
                                    onChange={(e) => onChange('numero_dep_vol_requisition', e.target.value)}
                                    placeholder=""
                                    className="h-10 sm:h-11 text-sm sm:text-base"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Dates administratives - Responsive */}
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-3 border-b-2 border-emerald-200 dark:border-emerald-800">
                    <div className="p-1.5 sm:p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-emerald-900 dark:text-emerald-100 truncate">
                            Dates administratives
                        </h4>
                        <p className="text-xs text-muted-foreground">Dates de réquisition et d'approbation</p>
                    </div>
                </div>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium">Date réquisition</Label>
                        <Input
                            type="date"
                            value={data.date_requisition}
                            onChange={(e) => onChange('date_requisition', e.target.value)}
                            className="h-10 sm:h-11 text-sm sm:text-base"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                            Date approbation acte
                        </Label>
                        <Input
                            type="date"
                            value={data.date_approbation_acte}
                            onChange={(e) => onChange('date_approbation_acte', e.target.value)}
                            className="h-10 sm:h-11 text-sm sm:text-base border-emerald-300 dark:border-emerald-700"
                            min={data.date_requisition || undefined}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}