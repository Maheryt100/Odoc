<?php

namespace App\Http\Requests;

use App\Models\Demandeur;
use App\Rules\ValidCIN;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;


/**
 * ✅ CORRIGÉ : Validation intelligente CIN
 * - Autorise les CIN existants (pour mise à jour)
 * - Bloque uniquement les doublons INTERNES (dans la même requête)
 */
class StoreDemandeurRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // ========== PROPRIÉTÉ ==========
            'lot' => 'required|string|max:15',
            'nature' => 'required|in:Urbaine,Suburbaine,Rurale',
            'vocation' => 'required|in:Edilitaire,Agricole,Forestière,Touristique',
            'type_operation' => 'required|in:morcellement,immatriculation',
            'id_dossier' => 'required|numeric|exists:dossiers,id',
            
            // Champs facultatifs propriété
            'proprietaire' => 'nullable|string|max:100',
            'situation' => 'nullable|string',
            'propriete_mere' => 'nullable|string|max:50',
            'titre_mere' => 'nullable|string|max:50',
            'titre' => 'nullable|string|max:50',
            'contenance' => 'nullable|numeric|min:1',
            'charge' => 'nullable|string|max:255',
            'numero_FN' => 'nullable|string|max:30',
            'numero_requisition' => 'nullable|string|max:50',
            'date_requisition' => 'nullable|date',
            'date_inscription' => 'nullable|date',
            'dep_vol' => 'nullable|string|max:50',
            'numero_dep_vol' => 'nullable|string|max:50',
            
            // ========== DEMANDEURS ==========
            'demandeurs_json' => 'required|string',
            
            // ✅ Validation de base (sans unique sur CIN)
            'demandeurs' => 'required|array|min:1',
            'demandeurs.*.titre_demandeur' => 'required|string|max:15',
            'demandeurs.*.nom_demandeur' => 'required|string|max:40',
            'demandeurs.*.prenom_demandeur' => 'required|string|max:50',
            'demandeurs.*.date_naissance' => 'required|date|before:-18 years',
            'demandeurs.*.cin' => ['required', new ValidCIN],
            
            // Champs facultatifs demandeurs
            'demandeurs.*.lieu_naissance' => 'nullable|string|max:100',
            'demandeurs.*.sexe' => 'nullable|string|max:10',
            'demandeurs.*.occupation' => 'nullable|string|max:30',
            'demandeurs.*.nom_pere' => 'nullable|string',
            'demandeurs.*.nom_mere' => 'nullable|string',
            'demandeurs.*.date_delivrance' => 'nullable|date|before:today',
            'demandeurs.*.lieu_delivrance' => 'nullable|string|max:40',
            'demandeurs.*.date_delivrance_duplicata' => 'nullable|date|before:today',
            'demandeurs.*.lieu_delivrance_duplicata' => 'nullable|string|max:40',
            'demandeurs.*.domiciliation' => 'nullable|string|max:60',
            'demandeurs.*.nationalite' => 'nullable|string|max:40',
            'demandeurs.*.situation_familiale' => 'nullable|string|max:40',
            'demandeurs.*.regime_matrimoniale' => 'nullable|string|max:40',
            'demandeurs.*.date_mariage' => 'nullable|date|before:today',
            'demandeurs.*.lieu_mariage' => 'nullable|string|max:40',
            'demandeurs.*.marie_a' => 'nullable|string|max:40',
            'demandeurs.*.telephone' => 'nullable|string|max:10',
        ];
    }

    public function messages(): array
    {
        return [
            'lot.required' => 'Le numéro de lot est obligatoire.',
            'nature.required' => 'La nature est obligatoire.',
            'nature.in' => 'La nature doit être: Urbaine, Suburbaine ou Rurale.',
            'vocation.required' => 'La vocation est obligatoire.',
            'vocation.in' => 'La vocation doit être: Edilitaire, Agricole, Forestière ou Touristique.',
            'type_operation.required' => 'Le type d\'opération est obligatoire.',
            
            'demandeurs.required' => 'Au moins un demandeur est requis.',
            'demandeurs.*.titre_demandeur.required' => 'Le titre est obligatoire (demandeur :position).',
            'demandeurs.*.nom_demandeur.required' => 'Le nom est obligatoire (demandeur :position).',
            'demandeurs.*.prenom_demandeur.required' => 'Le prénom est obligatoire (demandeur :position).',
            'demandeurs.*.date_naissance.required' => 'La date de naissance est obligatoire (demandeur :position).',
            'demandeurs.*.date_naissance.before' => 'Le demandeur doit avoir au moins 18 ans (demandeur :position).',
            'demandeurs.*.cin.required' => 'Le CIN est obligatoire (demandeur :position).',
        ];
    }

    /**
     * ✅ Préparer les données avant validation
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('demandeurs_json') && is_string($this->demandeurs_json)) {
            $demandeurs = json_decode($this->demandeurs_json, true);
            
            if (json_last_error() === JSON_ERROR_NONE && is_array($demandeurs)) {
                $this->merge([
                    'demandeurs' => $demandeurs
                ]);
            }
        }
    }

    /**
     * ✅ VALIDATION INTELLIGENTE CIN
     * Vérifie uniquement les doublons INTERNES dans la requête
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (!$this->has('demandeurs') || !is_array($this->demandeurs)) {
                $validator->errors()->add('demandeurs_json', 'Format JSON invalide');
                return;
            }

            $demandeurs = $this->demandeurs;
            $cins = array_column($demandeurs, 'cin');
            
            // ✅ 1. Vérifier doublons INTERNES (même CIN plusieurs fois dans le formulaire)
            $cinCounts = array_count_values($cins);
            
            foreach ($demandeurs as $index => $demandeur) {
                $position = $index + 1;
                $prefix = "demandeurs.{$index}";
                $cin = $demandeur['cin'] ?? '';

                // Si CIN apparaît plusieurs fois dans la requête
                if (isset($cinCounts[$cin]) && $cinCounts[$cin] > 1) {
                    $validator->errors()->add(
                        "{$prefix}.cin", 
                        "Ce CIN apparaît plusieurs fois dans le formulaire (demandeur {$position})"
                    );
                }
            }

            // ✅ 2. Log pour debug (peut être retiré en production)
            if (!$validator->errors()->has('demandeurs')) {
                Log::info('✅ Validation CIN réussie', [
                    'count' => count($demandeurs),
                    'cins' => $cins,
                    'demandeurs_existants' => Demandeur::whereIn('cin', $cins)
                        ->pluck('nom_demandeur', 'cin')
                        ->toArray()
                ]);
            }
        });
    }
}