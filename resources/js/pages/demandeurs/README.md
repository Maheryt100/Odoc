# Module Demandeurs - Documentation

## 📁 Structure des fichiers

```
pages/demandeurs/
├── types.ts                           # Types TypeScript
├── helpers.ts                         # Fonctions utilitaires
├── validation.ts                      # Logique de validation
├── components/
│   ├── DemandeurFilters.tsx          # Barre de filtres et recherche
│   ├── DemandeurTable.tsx            # Tableau avec pagination
│   ├── DemandeurDetailDialog.tsx     # Dialogue détails demandeur
│   ├── SmartDeleteDemandeurDialog.tsx # Dialogue suppression intelligente
│   └── DemandeursListWithOrder.tsx   # Liste avec ordre (propriétés)
├── index.tsx                          # Page liste principale
├── create.tsx                         # Formulaire création
├── update.tsx                         # Formulaire modification
└── README.md                          # Cette documentation
```

---

## 🎯 Fonctionnalités principales

### 1. **Affichage des demandeurs**
- Liste paginée (10 par page)
- Badges de statut intelligents :
  - Bleu : Avec propriétés actives
  - Vert : Avec propriétés acquises uniquement
  - Gris : Sans propriété
  - Rouge : Données incomplètes

### 2. **Filtres avancés**
- **Par statut** :
  - Tous
  - Avec propriétés actives
  - Avec propriétés acquises
  - Sans propriété
- **Par recherche** : Nom, prénom, CIN, domiciliation
- **Tri** :
  - Date de création (défaut)
  - Nom alphabétique
  - Nombre de propriétés
  - Statut (incomplets en premier)
- **Ordre** : Croissant / Décroissant

### 3. **Actions disponibles**
- Voir détails
- Modifier (si dossier ouvert)
- Lier à une propriété (si dossier ouvert)
- Supprimer (avec validation intelligente)

---

## 🔧 Utilisation des helpers

### `getDemandeurStatusBadge(demandeur)`
Retourne la configuration du badge de statut :
```tsx
const badge = getDemandeurStatusBadge(demandeur);
// { variant: 'default', text: 'Avec propriété(s) : 2 actives, 1 acquise', className: '...' }
```

### `getDemandeurStats(demandeur, proprietes)`
Calcule les statistiques complètes :
```tsx
const stats = getDemandeurStats(demandeur, proprietes);
// { total_proprietes: 3, proprietes_actives: 2, proprietes_acquises: 1, ... }
```

### `filterDemandeursByStatus(demandeurs, filtre)`
Filtre par statut :
```tsx
const actifs = filterDemandeursByStatus(demandeurs, 'actives');
```

### `sortDemandeurs(demandeurs, tri, ordre)`
Trie la liste :
```tsx
const triees = sortDemandeurs(demandeurs, 'nom', 'asc');
```

---

## ✅ Validation

### Champs obligatoires
- `date_naissance`
- `lieu_naissance`
- `date_delivrance`
- `lieu_delivrance`
- `domiciliation`
- `occupation`
- `nom_mere`

### Fonctions de validation
```tsx
import { 
    isDemandeurIncomplete,
    isValidCIN,
    isValidTelephone,
    validateDemandeurForm 
} from './validation';

// Vérifier si incomplet
const incomplete = isDemandeurIncomplete(demandeur);

// Valider un formulaire
const { isValid, errors } = validateDemandeurForm(formData);
```

---

## 🎨 Badges de statut

### Règles d'affichage

| Actives | Acquises | Badge |
|---------|----------|-------|
| 0 | 0 | "Sans propriété" (gris) |
| 2 | 0 | "Avec propriété(s) : 2 actives" (bleu) |
| 0 | 1 | "Avec propriété(s) : 1 acquise" (vert) |
| 1 | 1 | "Avec propriété(s) : 1 active, 1 acquise" (bleu) |

### Codes couleur
```css
/* Active (bleu) */
variant="default"

/* Acquise uniquement (vert) */
className="bg-green-50 text-green-700 border-green-300"

/* Sans propriété (gris) */
variant="secondary"

/* Données incomplètes (rouge) */
<AlertCircle className="text-red-500" />
```

---

## 🔗 Backend - Calcul des statistiques

### Modèle Demandeur.php

Nouveaux accessors ajoutés :
```php
protected $appends = [
    'nom_complet',
    'is_incomplete',
    'hasProperty',                  // ✅ NOUVEAU
    'proprietes_actives_count',     // ✅ NOUVEAU
    'proprietes_acquises_count',    // ✅ NOUVEAU
];

public function getHasPropertyAttribute(): bool
{
    return $this->demandes()->exists();
}

public function getProprietes_actives_countAttribute(): int
{
    return $this->demandesActives()->count();
}

public function getProprietes_acquises_countAttribute(): int
{
    return $this->demandesArchivees()->count();
}
```

### Chargement optimisé

Dans le contrôleur :
```php
$dossier = Dossier::with([
    'demandeurs' => function($q) {
        $q->withCount([
            'demandesActives as proprietes_actives_count',
            'demandesArchivees as proprietes_acquises_count'
        ]);
    }
])->findOrFail($id);
```

---

## 📊 Performances

### Optimisations appliquées
- ✅ `useMemo` pour filtrage/tri
- ✅ Pagination côté client (10 items)
- ✅ `withCount()` pour éviter N+1
- ✅ Chargement lazy des dialogues
- ✅ Délai de 100ms entre fermeture/ouverture dialogues

### Requêtes SQL générées
```sql
-- Chargement initial (1 requête principale + 2 eager loads)
SELECT * FROM dossiers WHERE id = ?;
SELECT * FROM demandeurs WHERE id_dossier = ?;
SELECT COUNT(*) as proprietes_actives_count FROM demander ...;
```

---

## 🐛 Corrections de bugs

### Bug #1 : "Sans propriété" pour demandeurs avec propriétés archivées
**Cause** : `hasProperty` calculé uniquement sur demandes actives

**Solution** :
```php
// Avant (bug)
public function getHasPropertyAttribute(): bool {
    return $this->demandesActives()->exists();
}

// Après (corrigé)
public function getHasPropertyAttribute(): bool {
    return $this->demandes()->exists(); // ✅ Inclut actives ET archivées
}
```

---

## 🔍 Différence avec DemandeursListWithOrder.tsx

| Composant | Contexte | Données affichées |
|-----------|----------|-------------------|
| `demandeurs/index.tsx` | Liste **tous les demandeurs d'un dossier** | Vue globale avec filtres/tri |
| `DemandeursListWithOrder.tsx` | Liste les demandeurs **d'une seule propriété** | Ordre (principal/consorts), prix |

**Utilisation** :
- `index.tsx` : Page principale `/dossiers/{id}/demandeurs`
- `DemandeursListWithOrder.tsx` : Dans `ProprieteDetailDialog.tsx`

---

## 🚀 Évolutions futures possibles

1. **Export Excel** : Ajouter bouton export avec stats
2. **Bulk actions** : Sélection multiple pour actions groupées
3. **Timeline** : Historique des modifications
4. **Statistiques graphiques** : Charts avec répartition actives/acquises
5. **Import CSV** : Ajout en masse de demandeurs

---

## 📝 Conventions de code

### Nommage
- Types : `PascalCase` (ex: `DemandeurWithProperty`)
- Fonctions : `camelCase` (ex: `getDemandeurStats`)
- Composants : `PascalCase` (ex: `DemandeurFilters`)
- Constants : `UPPER_SNAKE_CASE` (ex: `REQUIRED_FIELDS`)

### Organisation imports
```tsx
// 1. React
import { useState, useMemo } from 'react';

// 2. Librairies externes
import { Link } from '@inertiajs/react';

// 3. Composants UI
import { Card } from '@/components/ui/card';

// 4. Composants locaux
import DemandeurFilters from './components/DemandeurFilters';

// 5. Types
import type { DemandeurWithProperty } from './types';

// 6. Helpers
import { getDemandeurStatusBadge } from './helpers';
```

---

## 🧪 Tests suggérés

### Tests unitaires (helpers)
```tsx
describe('getDemandeurStatusBadge', () => {
    it('should return "Sans propriété" for 0 actives and 0 acquises', () => {
        const demandeur = { proprietes_actives_count: 0, proprietes_acquises_count: 0 };
        const badge = getDemandeurStatusBadge(demandeur);
        expect(badge.text).toBe('Sans propriété');
        expect(badge.variant).toBe('secondary');
    });

    it('should return green badge for acquises only', () => {
        const demandeur = { proprietes_actives_count: 0, proprietes_acquises_count: 2 };
        const badge = getDemandeurStatusBadge(demandeur);
        expect(badge.text).toContain('2 acquises');
        expect(badge.className).toContain('bg-green-50');
    });
});
```

### Tests d'intégration
- Filtrage par statut
- Recherche par CIN
- Tri par nom
- Pagination

---

## 📞 Support

Pour toute question ou bug, référez-vous à :
- Cette documentation
- Les commentaires dans `helpers.ts`
- Les types dans `types.ts`