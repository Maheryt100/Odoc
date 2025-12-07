<?php

namespace App\Http\Requests;

use App\Rules\ValidCIN;
use Illuminate\Foundation\Http\FormRequest;

/**
 * ✅ AMÉLIORATION: Form Request pour validation centralisée
 * Utilisé par DemandeurProprieteController@store
 */
class StoreDemandeurRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Propriété
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
            
            // Demandeurs (tableau JSON)
            'demandeurs_json' => 'required|json',
            'demandeurs' => 'required|array|min:1',
            'demandeurs.*.titre_demandeur' => 'required|string|max:15',
            'demandeurs.*.nom_demandeur' => 'required|string|max:40',
            'demandeurs.*.prenom_demandeur' => 'required|string|max:50',
            'demandeurs.*.date_naissance' => 'required|date|before:-18 years',
            'demandeurs.*.cin' => ['required', new ValidCIN, 'unique:demandeurs,cin'],
            
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

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            // Propriété
            'lot.required' => 'Le numéro de lot est obligatoire.',
            'nature.required' => 'La nature est obligatoire.',
            'nature.in' => 'La nature doit être: Urbaine, Suburbaine ou Rurale.',
            'vocation.required' => 'La vocation est obligatoire.',
            'vocation.in' => 'La vocation doit être: Edilitaire, Agricole, Forestière ou Touristique.',
            'type_operation.required' => 'Le type d\'opération est obligatoire.',
            
            // Demandeurs
            'demandeurs.required' => 'Au moins un demandeur est requis.',
            'demandeurs.*.titre_demandeur.required' => 'Le titre est obligatoire (demandeur :position).',
            'demandeurs.*.nom_demandeur.required' => 'Le nom est obligatoire (demandeur :position).',
            'demandeurs.*.prenom_demandeur.required' => 'Le prénom est obligatoire (demandeur :position).',
            'demandeurs.*.date_naissance.required' => 'La date de naissance est obligatoire (demandeur :position).',
            'demandeurs.*.date_naissance.before' => 'Le demandeur doit avoir au moins 18 ans (demandeur :position).',
            'demandeurs.*.cin.required' => 'Le CIN est obligatoire (demandeur :position).',
            'demandeurs.*.cin.unique' => 'Ce CIN existe déjà (demandeur :position).',
        ];
    }

    /**
     * Préparer les données pour validation
     * ✅ Décode le JSON des demandeurs automatiquement
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('demandeurs_json')) {
            $demandeurs = json_decode($this->demandeurs_json, true);
            
            if (json_last_error() === JSON_ERROR_NONE && is_array($demandeurs)) {
                $this->merge([
                    'demandeurs' => $demandeurs
                ]);
            }
        }
    }

    /**
     * ✅ Valider après validation standard
     * Vérifier les doublons CIN dans la requête
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (!$validator->errors()->has('demandeurs')) {
                $demandeurs = $this->input('demandeurs', []);
                $cins = array_column($demandeurs, 'cin');
                
                // Vérifier doublons dans la requête
                if (count($cins) !== count(array_unique($cins))) {
                    $validator->errors()->add(
                        'demandeurs', 
                        'Certains CIN sont dupliqués dans le formulaire.'
                    );
                }
            }
        });
    }
}