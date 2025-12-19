import React, { useState } from 'react';
import { Calendar, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DatePickerDemandeProps {
    value?: string; // Format YYYY-MM-DD
    onChange: (date: string) => void;
    label?: string;
    description?: string;
    minDate?: string; // Format YYYY-MM-DD
    maxDate?: string; // Format YYYY-MM-DD (défaut: aujourd'hui)
    required?: boolean;
    error?: string;
    disabled?: boolean;
}

export default function DatePickerDemande({
    value,
    onChange,
    label = "Date de la demande",
    description = "Date officielle de la demande d'acquisition",
    minDate = "2020-01-01",
    maxDate,
    required = false,
    error,
    disabled = false
}: DatePickerDemandeProps) {
    const today = new Date().toISOString().split('T')[0];
    const effectiveMaxDate = maxDate || today;
    const [touched, setTouched] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTouched(true);
        onChange(e.target.value);
    };

    const formatDateDisplay = (dateStr: string): string => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr + 'T00:00:00');
            const options: Intl.DateTimeFormatOptions = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            return date.toLocaleDateString('fr-FR', options);
        } catch {
            return dateStr;
        }
    };

    const showError = touched && error;

    return (
        <div className="space-y-2">
            <Label htmlFor="date_demande" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {label}
                {required && <span className="text-red-500">*</span>}
            </Label>

            {description && (
                <p className="text-xs text-muted-foreground">
                    {description}
                </p>
            )}

            <div className="space-y-2">
                <Input
                    id="date_demande"
                    name="date_demande"
                    type="date"
                    value={value || ''}
                    onChange={handleChange}
                    min={minDate}
                    max={effectiveMaxDate}
                    required={required}
                    disabled={disabled}
                    className={showError ? 'border-red-500' : ''}
                />

                {/* Affichage formaté de la date sélectionnée */}
                {value && !showError && (
                    <p className="text-xs text-muted-foreground italic">
                        📅 {formatDateDisplay(value)}
                    </p>
                )}

                {/* Message d'erreur */}
                {showError && (
                    <p className="text-xs text-red-500 font-medium">
                        {error}
                    </p>
                )}
            </div>

            {/* Alerte informative */}
            <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Important :</strong> Cette date ne pourra pas être modifiée après la création.
                </AlertDescription>
            </Alert>
        </div>
    );
}

// Exemple d'utilisation dans un formulaire
export function DatePickerDemandeExample() {
    const [dateDemo, setDateDemo] = useState('');
    const [error, setError] = useState('');

    const handleDateChange = (newDate: string) => {
        setDateDemo(newDate);
        
        // Validation exemple
        if (newDate && new Date(newDate) > new Date()) {
            setError('La date ne peut pas être dans le futur');
        } else if (newDate && new Date(newDate) < new Date('2020-01-01')) {
            setError('La date ne peut pas être antérieure au 01/01/2020');
        } else {
            setError('');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="p-6 border rounded-lg bg-white shadow-sm">
                <h2 className="text-xl font-bold mb-4">Exemple d'utilisation</h2>
                
                <DatePickerDemande
                    value={dateDemo}
                    onChange={handleDateChange}
                    required
                    error={error}
                />

                {dateDemo && !error && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                            ✅ Date sélectionnée : <strong>{dateDemo}</strong>
                        </p>
                    </div>
                )}
            </div>

            {/* Documentation */}
            <div className="space-y-3 text-sm">
                <h3 className="font-semibold">Caractéristiques :</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Date par défaut : Aujourd'hui</li>
                    <li>Date minimum : 01/01/2020</li>
                    <li>Date maximum : Aujourd'hui</li>
                    <li>Format stocké : YYYY-MM-DD (ISO)</li>
                    <li>Format affiché : Jour Mois Année (français)</li>
                    <li>Validation : Automatique avec messages d'erreur</li>
                </ul>
            </div>
        </div>
    );
}