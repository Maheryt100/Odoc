<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\ValidCIN;
use Carbon\Carbon;

class StoreDemandeurRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | DOSSIER
            |--------------------------------------------------------------------------
            */
            'id_dossier' => 'required|exists:dossiers,id',

            /*
            |--------------------------------------------------------------------------
            | PROPRIÉTÉ — Champs obligatoires
            |--------------------------------------------------------------------------
            */
            'lot' => 'required|string|max:20',
            'type_operation' => 'required|in:morcellement,immatriculation',
            'nature' => 'required|in:Urbaine,Suburbaine,Rurale',
            'vocation' => 'required|in:Edilitaire,Agricole,Forestière,Touristique',

            /*
            |--------------------------------------------------------------------------
            | PROPRIÉTÉ — Champs optionnels
            |--------------------------------------------------------------------------
            */
            'propriete_mere' => 'nullable|string|max:200',
            'titre_mere' => 'nullable|string|max:50',
            'titre' => 'nullable|string|max:50',
            'proprietaire' => 'nullable|string|max:255',
            'contenance' => 'nullable|numeric|min:0',
            'charge' => 'nullable|string|max:255',
            'situation' => 'nullable|string|max:500',

            'numero_FN' => 'nullable|string|max:50',
            'numero_requisition' => 'nullable|string|max:50',
            'date_requisition' => 'nullable|date|before_or_equal:today',

            'date_depot_1' => 'nullable|date|before_or_equal:today',
            'date_depot_2' => 'nullable|date|before_or_equal:today',
            'date_approbation_acte' => 'nullable|date|before_or_equal:today',

            'dep_vol_inscription' => 'nullable|string|max:100',
            'numero_dep_vol_inscription' => 'nullable|string|max:50',
            'dep_vol_requisition' => 'nullable|string|max:100',
            'numero_dep_vol_requisition' => 'nullable|string|max:50',

            /*
            |--------------------------------------------------------------------------
            | DATE DE DEMANDE (NOUVEAU)
            |--------------------------------------------------------------------------
            */
            'date_demande' => 'nullable|date|before_or_equal:today|after_or_equal:2020-01-01',

            /*
            |--------------------------------------------------------------------------
            | DEMANDEURS (JSON STRINGIFIÉ)
            |--------------------------------------------------------------------------
            */
            'demandeurs' => 'required|string',

            /*
            |--------------------------------------------------------------------------
            | DEMANDEURS — Champs individuels (après parse JSON)
            |--------------------------------------------------------------------------
            */
            'demandeurs.*.titre_demandeur' => 'required|string|max:20',
            'demandeurs.*.nom_demandeur' => 'required|string|max:100',
            'demandeurs.*.prenom_demandeur' => 'required|string|max:100',
            'demandeurs.*.date_naissance' => 'required|date|before:-18 years',
            'demandeurs.*.cin' => ['required', new ValidCIN],

            'demandeurs.*.lieu_naissance' => 'nullable|string|max:100',
            'demandeurs.*.sexe' => 'nullable|in:Homme,Femme',
            'demandeurs.*.occupation' => 'nullable|string|max:100',
            'demandeurs.*.nom_pere' => 'nullable|string|max:255',
            'demandeurs.*.nom_mere' => 'nullable|string|max:255',

            'demandeurs.*.date_delivrance' => 'nullable|date|before_or_equal:today',
            'demandeurs.*.lieu_delivrance' => 'nullable|string|max:100',
            'demandeurs.*.domiciliation' => 'nullable|string|max:150',
            'demandeurs.*.telephone' => 'nullable|string|max:15',

            'demandeurs.*.situation_familiale' => 'nullable|string|max:50',
            'demandeurs.*.regime_matrimoniale' => 'nullable|string|max:50',
            'demandeurs.*.nationalite' => 'nullable|string|max:50',

            'demandeurs.*.date_mariage' => 'nullable|date|before_or_equal:today',
            'demandeurs.*.lieu_mariage' => 'nullable|string|max:100',
            'demandeurs.*.marie_a' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'date_demande.date' => 'La date de demande doit être une date valide.',
            'date_demande.before_or_equal' => 'La date de demande ne peut pas être dans le futur.',
            'date_demande.after_or_equal' => 'La date de demande ne peut pas être antérieure au 01/01/2020.',

            'lot.required' => 'Le numéro de lot est obligatoire.',
            'type_operation.required' => 'Le type d\'opération est obligatoire.',
            'nature.required' => 'La nature est obligatoire.',
            'vocation.required' => 'La vocation est obligatoire.',

            'demandeurs.required' => 'Au moins un demandeur est requis.',
            'demandeurs.*.titre_demandeur.required' => 'Le titre de civilité est obligatoire.',
            'demandeurs.*.nom_demandeur.required' => 'Le nom est obligatoire.',
            'demandeurs.*.prenom_demandeur.required' => 'Le prénom est obligatoire.',
            'demandeurs.*.date_naissance.required' => 'La date de naissance est obligatoire.',
            'demandeurs.*.date_naissance.before' => 'Le demandeur doit avoir au moins 18 ans.',
            'demandeurs.*.cin.required' => 'Le CIN est obligatoire.',
        ];
    }

    /**
     * Préparer les données avant validation
     * → Parser le JSON des demandeurs
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('demandeurs') && is_string($this->demandeurs)) {
            $decoded = json_decode($this->demandeurs, true);

            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $this->merge([
                    'demandeurs' => $decoded,
                ]);
            }
        }
    }

    /**
     * Validation métier après parse
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {

            /*
            |--------------------------------------------------------------------------
            | 1. Vérifier doublons internes de CIN
            |--------------------------------------------------------------------------
            */
            $demandeurs = $this->input('demandeurs', []);

            if (!is_array($demandeurs)) {
                $validator->errors()->add('demandeurs', 'Format JSON invalide.');
                return;
            }

            $cins = array_column($demandeurs, 'cin');
            $counts = array_count_values($cins);

            foreach ($demandeurs as $index => $demandeur) {
                $cin = $demandeur['cin'] ?? null;

                if ($cin && ($counts[$cin] ?? 0) > 1) {
                    $validator->errors()->add(
                        "demandeurs.$index.cin",
                        'Ce CIN apparaît plusieurs fois dans le formulaire.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | 2. Cohérence date_demande / date_requisition
            |--------------------------------------------------------------------------
            */
            if ($this->filled('date_demande') && $this->filled('date_requisition')) {
                $dateDemande = Carbon::parse($this->date_demande);
                $dateRequisition = Carbon::parse($this->date_requisition);

                if ($dateDemande->lessThan($dateRequisition)) {
                    $validator->errors()->add(
                        'date_demande',
                        'La date de demande ne peut pas être antérieure à la date de réquisition.'
                    );
                }
            }
        });
    }
}
