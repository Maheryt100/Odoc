// pages/proprietes/create.tsx
// ✅ VERSION AVEC NOUVELLES DATES

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, FileText, MapPin, Calendar, Layers, Shield, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    return (
        <div className="space-y-8">
            {/* HEADER avec badge numéro */}
            {showRemoveButton && onRemove && (
                <div className="flex justify-between items-center pb-6 border-b-2 border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-3">
                        <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-base px-3 py-1">
                            #{typeof index !== 'undefined' ? index + 1 : ''}
                        </Badge>
                        <h3 className="text-xl font-bold">
                            Propriété {typeof index !== 'undefined' ? index + 1 : ''}
                        </h3>
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={onRemove}
                        className="h-9 gap-2 shadow-md"
                    >
                        <Trash2 className="h-4 w-4" />
                        Retirer
                    </Button>
                </div>
            )}

            {/* SECTION TYPE D'OPÉRATION */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-200 dark:border-blue-800">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                            Type d'opération
                        </h4>
                        <p className="text-xs text-muted-foreground">Choisir le type de procédure</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-red-600">Type d'opération *</Label>
                    <Select
                        value={data.type_operation}
                        onValueChange={(value: string) => onChange('type_operation', value)}
                    >
                        <SelectTrigger className="w-full md:w-[280px] h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="morcellement">Morcellement</SelectItem>
                            <SelectItem value="immatriculation">Immatriculation</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* SECTION IDENTIFICATION DU LOT */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-green-200 dark:border-green-800">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Layers className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">
                            Identification du lot
                        </h4>
                        <p className="text-xs text-muted-foreground">Informations de base du terrain</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-red-600">Lot *</Label>
                        <Input
                            value={data.lot}
                            onChange={(e) => onChange('lot', e.target.value)}
                            placeholder="T 45"
                            required
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-red-600">Nature *</Label>
                        <Select 
                            value={data.nature} 
                            onValueChange={(value: string) => onChange('nature', value)}
                        >
                            <SelectTrigger className="h-11">
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
                        <Label className="text-sm font-medium text-red-600">Vocation *</Label>
                        <Select 
                            value={data.vocation} 
                            onValueChange={(value: string) => onChange('vocation', value)}
                        >
                            <SelectTrigger className="h-11">
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

            {/* SECTION PROPRIÉTAIRE & TITRES */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-200 dark:border-purple-800">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                            Propriétaire & Titres
                        </h4>
                        <p className="text-xs text-muted-foreground">Références et propriétaire actuel</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {data.type_operation === 'morcellement' && (
                        <>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Propriété mère</Label>
                                <Input
                                    value={data.propriete_mere}
                                    onChange={(e) => onChange('propriete_mere', e.target.value)}
                                    placeholder="Nom de la propriété mère"
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Titre mère</Label>
                                <Input
                                    value={data.titre_mere}
                                    onChange={(e) => onChange('titre_mere', e.target.value)}
                                    placeholder="Numéro du titre mère"
                                    className="h-11"
                                />
                            </div>
                        </>
                    )}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Titre</Label>
                        <Input
                            value={data.titre}
                            onChange={(e) => onChange('titre', e.target.value)}
                            placeholder="Numéro du titre"
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Nom Propriété / Propriétaire</Label>
                        <Input
                            value={data.proprietaire}
                            onChange={(e) => onChange('proprietaire', e.target.value)}
                            placeholder=""
                            className="h-11"
                        />
                    </div>
                </div>
            </div>

            {/* SECTION DÉTAILS & RÉFÉRENCES */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-indigo-200 dark:border-indigo-800">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                            Détails & Références
                        </h4>
                        <p className="text-xs text-muted-foreground">Contenance et numéros administratifs</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Contenance (m²)</Label>
                        <Input
                            type="number"
                            min={1}
                            value={data.contenance}
                            onChange={(e) => onChange('contenance', e.target.value)}
                            placeholder=""
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Numero FNº</Label>
                        <Input
                            value={data.numero_FN}
                            onChange={(e) => onChange('numero_FN', e.target.value)}
                            placeholder=""
                            className="h-11"
                        />
                    </div>
                    {data.type_operation === 'immatriculation' && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Nº Requisition</Label>
                            <Input
                                value={data.numero_requisition}
                                onChange={(e) => onChange('numero_requisition', e.target.value)}
                                placeholder=""
                                className="h-11"
                            />
                        </div>
                    )}
                    <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-medium">Charges</Label>
                        <div className="space-y-2 p-4 border-2 rounded-lg bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
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
                                        className="text-sm cursor-pointer font-medium"
                                    >
                                        {charge}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* NOUVELLE SECTION : DATES */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-orange-200 dark:border-orange-800">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <MapPin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                            Localisation
                        </h4>
                        <p className="text-xs text-muted-foreground">Situation géographique</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium">Situation (sise à)</Label>
                    <Input
                        value={data.situation}
                        onChange={(e) => onChange('situation', e.target.value)}
                        placeholder=""
                        className="h-11"
                    />
                </div>
            </div>

            {/* ✅ BLOC DATES DE DÉPÔT */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-sky-200 dark:border-sky-800">
                    <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                        <Calendar className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-sky-900 dark:text-sky-100">
                            Dates de dépôt
                        </h4>
                        <p className="text-xs text-muted-foreground">Dates de dépôt inscription et réquisition</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="p-4 border-2 rounded-xl bg-gradient-to-br from-blue-50/70 to-cyan-50/70 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                Dépôt 1
                            </Badge>
                            <span className="text-sm text-muted-foreground">Bordereau n°1</span>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Date dépôt 1</Label>
                                <Input
                                    type="date"
                                    value={data.date_depot_1}
                                    onChange={(e) => onChange('date_depot_1', e.target.value)}
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Dep Vol</Label>
                                <Input
                                    value={data.dep_vol_inscription}
                                    onChange={(e) => onChange('dep_vol_inscription', e.target.value)}
                                    placeholder=""
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Numéro Dep Vol</Label>
                                <Input
                                    value={data.numero_dep_vol_inscription}
                                    onChange={(e) => onChange('numero_dep_vol_inscription', e.target.value)}
                                    placeholder=""
                                    className="h-11"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-2 rounded-xl bg-gradient-to-br from-purple-50/70 to-pink-50/70 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                Dépôt 2
                            </Badge>
                            <span className="text-sm text-muted-foreground">Bordereau n°2</span>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Date dépôt 2</Label>
                                <Input
                                    type="date"
                                    value={data.date_depot_2}
                                    onChange={(e) => onChange('date_depot_2', e.target.value)}
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Dep Vol</Label>
                                <Input
                                    value={data.dep_vol_requisition}
                                    onChange={(e) => onChange('dep_vol_requisition', e.target.value)}
                                    placeholder=""
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Numéro Dep Vol</Label>
                                <Input
                                    value={data.numero_dep_vol_requisition}
                                    onChange={(e) => onChange('numero_dep_vol_requisition', e.target.value)}
                                    placeholder=""
                                    className="h-11"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BLOC DATES ADMINISTRATIVES */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-emerald-200 dark:border-emerald-800">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                            Dates administratives
                        </h4>
                        <p className="text-xs text-muted-foreground">Dates de réquisition et d'approbation</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Date réquisition</Label>
                        <Input
                            type="date"
                            value={data.date_requisition}
                            onChange={(e) => onChange('date_requisition', e.target.value)}
                            className="h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            Date approbation acte
                        </Label>
                        <Input
                            type="date"
                            value={data.date_approbation_acte}
                            onChange={(e) => onChange('date_approbation_acte', e.target.value)}
                            className="h-11 border-emerald-300 dark:border-emerald-700"
                            min={data.date_requisition || undefined}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}