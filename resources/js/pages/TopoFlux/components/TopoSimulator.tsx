import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
    MapPin, 
    User, 
    Upload, 
    Send, 
    CheckCircle, 
    AlertCircle,
    Loader2,
    FileText
} from 'lucide-react';

// ✅ Types pour la réponse API
interface TopoSyncResponse {
    success: boolean;
    message: string;
    import_id: number;
    batch_id: string;
    entity_type: string;
    action_suggested: string;
    match_found: boolean;
    match_details?: {
        match_confidence: number;
        matched_entity_id: number;
        match_method: string;
    };
    files_count: number;
}

export default function TopoSimulator() {
    const [entityType, setEntityType] = useState<'propriete' | 'demandeur'>('propriete');
    const [token, setToken] = useState('');
    const [targetDossier, setTargetDossier] = useState('');
    
    // Données Propriété
    const [proprieteData, setProprieteData] = useState({
        lot: '',
        nature: 'Urbaine',
        vocation: 'Edilitaire',
        type_operation: 'immatriculation',
        titre: '',
        proprietaire: '',
        contenance: '',
        situation: ''
    });
    
    // Données Demandeur
    const [demandeurData, setDemandeurData] = useState({
        titre_demandeur: 'Monsieur',
        nom_demandeur: '',
        prenom_demandeur: '',
        date_naissance: '',
        cin: '',
        domiciliation: '',
        telephone: ''
    });
    
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<TopoSyncResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const formData = new FormData();
            
            // Données JSON
            const syncData = {
                entity_type: entityType,
                action_suggested: 'create',
                target_dossier_id: parseInt(targetDossier),
                entity_data: entityType === 'propriete' ? proprieteData : demandeurData
            };
            
            formData.append('data', JSON.stringify(syncData));
            
            // Fichiers
            files.forEach(file => {
                formData.append('files', file);
            });

            // Envoi vers FastAPI
            const res = await fetch('http://localhost:8000/api/v1/topo-sync/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Erreur lors de l\'envoi');
            }

            const data: TopoSyncResponse = await res.json();
            setResponse(data);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <Card className="border-2 border-blue-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardTitle className="flex items-center gap-3 text-2xl">
                            <MapPin className="h-8 w-8 text-blue-600" />
                            Simulateur TopoManager
                        </CardTitle>
                        <CardDescription>
                            Envoi de données terrain vers GeODOC via FastAPI
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Token TopoManager</Label>
                            <Input
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Collez votre token JWT ici"
                            />
                            <p className="text-xs text-muted-foreground">
                                Obtenir via: POST /api/v1/auth/login
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type d'entité</Label>
                                <Select value={entityType} onValueChange={setEntityType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="propriete">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Propriété
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="demandeur">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Demandeur
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>ID Dossier cible</Label>
                                <Input
                                    type="number"
                                    value={targetDossier}
                                    onChange={(e) => setTargetDossier(e.target.value)}
                                    placeholder="Ex: 123"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Formulaire Propriété */}
                {entityType === 'propriete' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Données Propriété
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Lot *</Label>
                                    <Input
                                        value={proprieteData.lot}
                                        onChange={(e) => setProprieteData({...proprieteData, lot: e.target.value})}
                                        placeholder="T 45"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Titre</Label>
                                    <Input
                                        value={proprieteData.titre}
                                        onChange={(e) => setProprieteData({...proprieteData, titre: e.target.value})}
                                        placeholder="12345"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Nature *</Label>
                                    <Select 
                                        value={proprieteData.nature}
                                        onValueChange={(value) => setProprieteData({...proprieteData, nature: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Urbaine">Urbaine</SelectItem>
                                            <SelectItem value="Suburbaine">Suburbaine</SelectItem>
                                            <SelectItem value="Rurale">Rurale</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Vocation *</Label>
                                    <Select 
                                        value={proprieteData.vocation}
                                        onValueChange={(value) => setProprieteData({...proprieteData, vocation: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Edilitaire">Edilitaire</SelectItem>
                                            <SelectItem value="Agricole">Agricole</SelectItem>
                                            <SelectItem value="Forestière">Forestière</SelectItem>
                                            <SelectItem value="Touristique">Touristique</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Contenance (m²)</Label>
                                    <Input
                                        type="number"
                                        value={proprieteData.contenance}
                                        onChange={(e) => setProprieteData({...proprieteData, contenance: e.target.value})}
                                        placeholder="500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Situation</Label>
                                <Input
                                    value={proprieteData.situation}
                                    onChange={(e) => setProprieteData({...proprieteData, situation: e.target.value})}
                                    placeholder="Sis à..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Formulaire Demandeur */}
                {entityType === 'demandeur' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Données Demandeur
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Titre *</Label>
                                    <Select 
                                        value={demandeurData.titre_demandeur}
                                        onValueChange={(value) => setDemandeurData({...demandeurData, titre_demandeur: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Monsieur">Monsieur</SelectItem>
                                            <SelectItem value="Madame">Madame</SelectItem>
                                            <SelectItem value="Mademoiselle">Mademoiselle</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Nom *</Label>
                                    <Input
                                        value={demandeurData.nom_demandeur}
                                        onChange={(e) => setDemandeurData({...demandeurData, nom_demandeur: e.target.value})}
                                        placeholder="RAKOTO"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Prénom *</Label>
                                    <Input
                                        value={demandeurData.prenom_demandeur}
                                        onChange={(e) => setDemandeurData({...demandeurData, prenom_demandeur: e.target.value})}
                                        placeholder="Jean"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>CIN (12 chiffres) *</Label>
                                    <Input
                                        value={demandeurData.cin}
                                        onChange={(e) => setDemandeurData({...demandeurData, cin: e.target.value})}
                                        placeholder="123456789012"
                                        maxLength={12}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Date de naissance *</Label>
                                    <Input
                                        type="date"
                                        value={demandeurData.date_naissance}
                                        onChange={(e) => setDemandeurData({...demandeurData, date_naissance: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Domiciliation</Label>
                                <Input
                                    value={demandeurData.domiciliation}
                                    onChange={(e) => setDemandeurData({...demandeurData, domiciliation: e.target.value})}
                                    placeholder="Adresse complète"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Téléphone</Label>
                                <Input
                                    value={demandeurData.telephone}
                                    onChange={(e) => setDemandeurData({...demandeurData, telephone: e.target.value})}
                                    placeholder="0340000000"
                                    maxLength={10}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Upload fichiers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Fichiers joints (optionnel)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />
                        {files.length > 0 && (
                            <div className="mt-3 space-y-1">
                                {files.map((file, idx) => (
                                    <div key={idx} className="text-sm flex items-center gap-2">
                                        <Badge variant="outline">{file.name}</Badge>
                                        <span className="text-muted-foreground">
                                            ({(file.size / 1024).toFixed(1)} Ko)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Bouton envoi */}
                <Button
                    onClick={handleSubmit}
                    disabled={loading || !token || !targetDossier}
                    className="w-full h-12 text-lg"
                    size="lg"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Envoi en cours...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-5 w-5" />
                            Envoyer vers GeODOC
                        </>
                    )}
                </Button>

                {/* Réponse */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {response && (
                    <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                            <div className="space-y-2">
                                <p className="font-semibold text-green-900">
                                    ✅ Import créé avec succès !
                                </p>
                                <div className="text-sm text-green-800 space-y-1">
                                    <p>Import ID: <strong>{response.import_id}</strong></p>
                                    <p>Batch ID: <code className="bg-white px-2 py-1 rounded">{response.batch_id}</code></p>
                                    <p>Action suggérée: <Badge>{response.action_suggested}</Badge></p>
                                    {response.match_found && (
                                        <p className="text-orange-600">
                                            ⚠️ Entité existante détectée (confiance: {(response.match_details.match_confidence * 100).toFixed(0)}%)
                                        </p>
                                    )}
                                    {response.files_count > 0 && (
                                        <p>📎 {response.files_count} fichier(s) transféré(s)</p>
                                    )}
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    );
}