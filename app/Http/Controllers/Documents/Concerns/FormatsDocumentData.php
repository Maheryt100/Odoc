<?php

namespace App\Http\Controllers\Documents\Concerns;

use Carbon\Carbon;
use NumberFormatter;
use Illuminate\Support\Str;

trait FormatsDocumentData
{
    /**
     * ✅ Formater un montant en lettres
     */
    protected function formatMontantEnLettres(int $montant): string
    {
        $formatter = new NumberFormatter('fr', NumberFormatter::SPELLOUT);
        return Str::upper(ucfirst($formatter->format($montant)));
    }
    
    /**
     * ✅ Formater un CIN avec points (123.456.789.012)
     */
    protected function formatCin(string $cin): string
    {
        return implode('.', str_split($cin, 3));
    }
    
    /**
     * ✅ Déterminer le titre (M./Mme) selon le sexe
     */
    protected function getTitreDemandeur(string $sexe): string
    {
        return $sexe === 'Homme' ? 'M.' : 'Mme';
    }
    
    /**
     * ✅ Déterminer "fils" ou "fille" selon le sexe
     */
    protected function getEnfantDe(string $sexe): string
    {
        return $sexe === 'Homme' ? 'fils' : 'fille';
    }
    
    /**
     * ✅ Déterminer "au demandeur" ou "à la demanderesse"
     */
    protected function getDemandeurPreposition(string $sexe): string
    {
        return $sexe === 'Homme' ? 'au demandeur' : 'à la demanderesse';
    }
    
    /**
     * ✅ Formater "marié(e) à ..."
     */
    protected function getMarieA(
        ?string $marie_a, 
        string $sexe, 
        ?Carbon $date_mariage, 
        ?string $lieu_mariage
    ): string {
        if (!$marie_a) {
            return '';
        }
        
        $prefix = $sexe === 'Homme' ? 'marié à la dame ' : 'mariée à monsieur ';
        $result = $prefix . $marie_a;
        
        if ($date_mariage) {
            Carbon::setLocale('fr');
            $result .= ', le ' . $date_mariage->translatedFormat('d F Y');
        }
        
        if ($lieu_mariage) {
            $result .= ' à ' . $lieu_mariage;
        }
        
        return $result . ',';
    }
    
    /**
     * ✅ Formater le nom complet d'un demandeur
     */
    protected function formatNomComplet(string $nom, ?string $prenom = null): string
    {
        return trim($nom . ' ' . ($prenom ?? ''));
    }
    
    /**
     * ✅ Formater le nom des parents "de [père] et de [mère]"
     */
    protected function formatNomParents(?string $nom_pere, string $nom_mere): string
    {
        if ($nom_pere) {
            return $nom_pere . ' et de ' . $nom_mere;
        }
        return $nom_mere;
    }
    
    /**
     * ✅ Formater une date pour les documents (format français long)
     */
    protected function formatDateDocument(?Carbon $date): string
    {
        if (!$date) {
            return '';
        }
        
        Carbon::setLocale('fr');
        return $date->translatedFormat('d F Y');
    }
    
    /**
     * ✅ Formater une date courte pour les documents (jj/mm/aaaa)
     */
    protected function formatDateCourte(?Carbon $date): string
    {
        if (!$date) {
            return '';
        }
        
        return $date->format('d/m/Y');
    }
    
    /**
     * ✅ Formater une période de dates (du X au Y)
     */
    protected function formatPeriodeDates(Carbon $dateDebut, Carbon $dateFin): string
    {
        Carbon::setLocale('fr');
        
        $debut = $dateDebut->translatedFormat('d');
        $fin = $dateFin->translatedFormat('d F Y');
        
        return $debut . ' au ' . $fin;
    }
    
    /**
     * ✅ Formater un montant avec séparateurs de milliers
     */
    protected function formatMontantChiffres(int $montant): string
    {
        return number_format($montant, 0, ',', '.');
    }
    
    /**
     * ✅ Déterminer l'article "d'" ou "de" selon la première lettre
     */
    protected function getArticle(string $mot, bool $majuscule = false): string
    {
        $premiereLettre = strtolower(mb_substr($mot, 0, 1));
        $voyelles = ['a', 'e', 'i', 'o', 'u', 'y'];
        
        $article = in_array($premiereLettre, $voyelles) ? 'd' : 'de';
        
        return $majuscule ? strtoupper($article) : $article;
    }
    
    /**
     * ✅ Obtenir les articles pour district et commune
     */
    protected function getArticles(string $district, string $commune): array
    {
        return [
            'D_dis' => $this->getArticle($district, true),
            'd_dis' => $this->getArticle($district, false),
            'd_com' => $this->getArticle($commune, false),
        ];
    }
    
    /**
     * ✅ Formater le Dep/Vol complet
     */
    protected function formatDepVol(?string $dep_vol, ?string $numero_dep_vol): string
    {
        if (!$dep_vol) {
            return 'Non renseigné';
        }
        
        $result = trim($dep_vol);
        
        if ($numero_dep_vol) {
            $result .= ' n°' . trim($numero_dep_vol);
        }
        
        return $result;
    }
    
    /**
     * ✅ Nettoyer et normaliser un texte
     */
    protected function normalizeText(?string $text): string
    {
        if (!$text) {
            return '';
        }
        
        return trim(preg_replace('/\s+/', ' ', $text));
    }
    
    /**
     * ✅ Obtenir une valeur par défaut si null
     */
    protected function getOrDefault(?string $value, string $default = 'Non renseigné'): string
    {
        return $value ? trim($value) : $default;
    }
    
    /**
     * ✅ Formater le numéro de titre (TN°XXXXX)
     */
    protected function formatNumeroTitre(?string $titre): string
    {
        if (!$titre) {
            return 'N/A';
        }
        
        return 'TN°' . $titre;
    }
    
    /**
     * ✅ Formater la situation matrimoniale pour les documents
     */
    protected function formatSituationMatrimoniale(
        ?string $situation_familiale,
        ?string $marie_a,
        string $sexe
    ): string {
        if ($situation_familiale === 'Marié(e)' && $marie_a) {
            return $this->getMarieA($marie_a, $sexe, null, null);
        }
        
        return '';
    }
}