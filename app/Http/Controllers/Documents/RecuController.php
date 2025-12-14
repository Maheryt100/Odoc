<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Models\Propriete;
use App\Models\Demandeur;
use App\Models\DocumentGenere;
use App\Models\ActivityLog;
use App\Services\ActivityLogger;
use App\Http\Controllers\Documents\Concerns\HandlesDocumentGeneration;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use NumberFormatter;
use PhpOffice\PhpWord\TemplateProcessor;

class RecuController extends Controller
{
    use HandlesDocumentGeneration;

    /**
     * ✅ Générer ou télécharger un reçu existant
     */
    public function generate(Request $request)
    {
        $request->validate([
            'id_propriete' => 'required|exists:proprietes,id',
            'id_demandeur' => 'required|exists:demandeurs,id',
        ]);

        try {
            $propriete = Propriete::with('dossier.district')->findOrFail($request->id_propriete);
            $demandeur = Demandeur::findOrFail($request->id_demandeur);

            // Vérifier si un document existe déjà
            $documentExistant = DocumentGenere::findExisting(
                DocumentGenere::TYPE_RECU,
                $request->id_propriete,
                $request->id_demandeur,
                $propriete->dossier->id_district
            );

            if ($documentExistant && $documentExistant->fileExists()) {
                return $this->downloadExisting($documentExistant, 'reçu');
            }

            return $this->createNewRecu($propriete, $demandeur);

        } catch (\Exception $e) {
            Log::error('❌ Erreur génération reçu', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * ✅ Télécharger un reçu par son ID
     */
    public function download($id)
    {
        try {
            $document = DocumentGenere::findOrFail($id);

            if ($document->type_document !== DocumentGenere::TYPE_RECU) {
                return back()->withErrors(['error' => 'Ce document n\'est pas un reçu']);
            }

            return $this->downloadExisting($document, 'reçu');

        } catch (\Exception $e) {
            Log::error('❌ Erreur téléchargement reçu', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);
            return back()->withErrors(['error' => 'Impossible de télécharger: ' . $e->getMessage()]);
        }
    }

    /**
     * ✅ Historique des reçus pour une propriété
     */
    public function history($id_propriete)
    {
        try {
            $propriete = Propriete::with('dossier')->findOrFail($id_propriete);

            $documents = DocumentGenere::with(['demandeur', 'generatedBy'])
                ->where('id_propriete', $id_propriete)
                ->where('id_district', $propriete->dossier->id_district)
                ->where('type_document', DocumentGenere::TYPE_RECU)
                ->orderBy('generated_at', 'desc')
                ->get()
                ->map(function ($doc) {
                    return [
                        'id' => $doc->id,
                        'numero_recu' => $doc->numero_document,
                        'montant' => number_format($doc->montant, 0, ',', '.'),
                        'date_recu' => $doc->date_document->format('d/m/Y'),
                        'demandeur' => $doc->demandeur->nom_complet,
                        'cree_par' => $doc->generatedBy->name ?? 'Utilisateur inconnu',
                        'cree_le' => $doc->generated_at->format('d/m/Y H:i'),
                        'status' => $doc->status,
                        'download_count' => $doc->download_count,
                        'file_exists' => $doc->fileExists(),
                    ];
                });

            return response()->json([
                'success' => true,
                'recus' => $documents
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ SÉCURISÉ : Créer un nouveau reçu avec LOCK
     */
    private function createNewRecu(Propriete $propriete, Demandeur $demandeur)
    {
        DB::beginTransaction();

        try {
            $dossier = $propriete->dossier;

            // ✅ CRITIQUE : Lock pour éviter les doublons
            $existingDoc = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
                ->where('id_propriete', $propriete->id)
                ->where('id_demandeur', $demandeur->id)
                ->where('id_district', $dossier->id_district)
                ->where('status', DocumentGenere::STATUS_ACTIVE)
                ->lockForUpdate()
                ->first();

            if ($existingDoc) {
                DB::rollBack();
                return $this->downloadExisting($existingDoc, 'reçu');
            }

            // Calculer le prix
            $prix = $this->getPrixFromDistrict($propriete);
            $prixTotal = (int) ($prix * $propriete->contenance);

            // ✅ SÉCURISÉ : Numéro avec séquence
            $numeroRecu = $this->generateNumeroRecu($dossier->id, $dossier->numero_ouverture);

            // Créer le fichier Word
            $tempFilePath = $this->createRecuDocument($propriete, $demandeur, $numeroRecu, $prixTotal);

            // Sauvegarder
            $savedPath = $this->saveDocument($tempFilePath, 'RECU', $propriete, $demandeur);
            $nomFichier = basename($savedPath);

            // Créer l'enregistrement
            $document = DocumentGenere::create([
                'type_document' => DocumentGenere::TYPE_RECU,
                'id_propriete' => $propriete->id,
                'id_demandeur' => $demandeur->id,
                'id_dossier' => $dossier->id,
                'id_district' => $dossier->id_district,
                'numero_document' => $numeroRecu,
                'file_path' => $savedPath,
                'nom_fichier' => $nomFichier,
                'montant' => $prixTotal,
                'date_document' => Carbon::now(),
                'generated_by' => Auth::id(),
                'generated_at' => now(),
                'status' => DocumentGenere::STATUS_ACTIVE,
            ]);

            DB::commit();

            // Log d'activité
            ActivityLogger::logDocumentGeneration(ActivityLog::DOC_RECU, $document->id, [
                'numero_recu' => $numeroRecu,
                'montant' => $prixTotal,
                'lot' => $propriete->lot,
            ]);

            return response()->download($tempFilePath, $nomFichier)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Erreur création reçu', [
                'error' => $e->getMessage(),
                'propriete_id' => $propriete->id,
            ]);
            throw $e;
        }
    }

    /**
     * ✅ SÉCURISÉ : Génération numéro avec séquence par dossier
     */
    private function generateNumeroRecu(int $idDossier, string $numeroDossier): string
    {
        // Compter les reçus existants pour ce dossier avec LOCK
        $count = DocumentGenere::where('type_document', DocumentGenere::TYPE_RECU)
            ->where('id_dossier', $idDossier)
            ->where('status', DocumentGenere::STATUS_ACTIVE)
            ->lockForUpdate()
            ->count() + 1;

        $numero = sprintf('%03d/%s', $count, $numeroDossier);

        Log::info('✅ Numéro reçu généré', [
            'id_dossier' => $idDossier,
            'sequence' => $count,
            'numero' => $numero,
        ]);

        return $numero;
    }

    /**
     * ✅ CORRIGÉ : Créer le document Word avec variables cohérentes
     */
    private function createRecuDocument(
        Propriete $propriete, 
        Demandeur $demandeur, 
        string $numeroRecu, 
        int $montantTotal
    ): string {
        Carbon::setLocale('fr');
        $formatter = new NumberFormatter('fr', NumberFormatter::SPELLOUT);

        $templatePath = storage_path('app/public/modele_odoc/recu_paiement.docx');
        if (!file_exists($templatePath)) {
            throw new \Exception("Template reçu introuvable");
        }

        $modele = new TemplateProcessor($templatePath);
        
        $locationData = $this->getLocationData($propriete);
        $dossier = $propriete->dossier;

        // Formatage des données
        $dateRecu = Carbon::now()->translatedFormat('d/m/Y');
        $montantLettres = Str::upper(ucfirst($formatter->format((int) $montantTotal)));
        $cinFormate = implode('.', str_split($demandeur->cin, 3));
        $dateDelivrance = Carbon::parse($demandeur->date_delivrance)->translatedFormat('d/m/Y');

        $titreDemandeur = $demandeur->sexe === 'Homme' ? 'M.' : 'Mme';
        $nomComplet = $demandeur->nom_demandeur . ' ' . ($demandeur->prenom_demandeur ?? '');

        $motif = "Achat terrain Lot {$propriete->lot} TN°{$propriete->titre}";
        $details = "Propriété \"{$propriete->proprietaire}\" - Commune {$dossier->commune}";

        // ✅ CORRECTION : Variables cohérentes avec le template
        $modele->setValues([
            'District' => $locationData['district'],
            'NumeroRecu' => $numeroRecu,
            'DateRecu' => $dateRecu,
            'MontantChiffres' => number_format((int) $montantTotal, 0, ',', '.'),
            'TitreDemandeur' => $titreDemandeur,
            'NomComplet' => $nomComplet,
            'NumCIN' => $cinFormate,
            'DateDelivrance' => $dateDelivrance,
            'Domiciliation' => $demandeur->domiciliation,
            'MontantLettres' => $montantLettres,
            'Motif' => $motif,
            'Details' => $details,
        ]);

        $fileName = 'RECU_' . str_replace('/', '-', $numeroRecu) . '_' . uniqid() . '.docx';
        $filePath = sys_get_temp_dir() . '/' . $fileName;

        $modele->saveAs($filePath);

        return $filePath;
    }
}