# @ceff/core

Coeur metier du generateur d'etiquettes pour tableau electrique modulaire CEFF.

Ce package contient toute la logique pure du domaine : modele de donnees, validateurs, moteur dimensionnel, layout. Il ne depend d'aucune UI ni d'aucun moteur de rendu. Il est testable unitairement et reutilisable par les exports PDF, Excel et par l'editeur React.

## Structure

```
src/
  types/         Modele de donnees et constantes physiques
    units.ts        Constantes (HALF_MODULE_MM, A3_LANDSCAPE_MM, etc.)
    project.ts      Project, Row, Equipment
  validation/    Validateurs metier
    result.ts       Type ValidationResult discriminant
    validators.ts   validateProject, validateRow, validateNoOverlap...
  layout/        Moteur dimensionnel
    dimensions.ts   Conversions et calculs en mm
    layout.ts       layoutProject() partage ecran/PDF
  utils/         Utilitaires
    text-sanitizer.ts  Filtre anti tiret cadratin (CRITIQUE)
    labels.ts          Libelles francais corriges
  __tests__/     92 tests unitaires
```

## Installation

```bash
cd packages/core
npm install
```

## Tests

```bash
npm test          # une fois
npm run test:watch # mode watch
```

Resultat actuel : 92 tests, 0 echec.

## Build

```bash
npm run build
```

Produit `dist/` avec JS + types (.d.ts) prets a etre importes par les autres packages du monorepo.

## Choix de conception cles

### Unite de stockage : demi-modules entiers

Les positions et largeurs sont stockees en `HalfModules` (entiers). Conversion en mm uniquement a l'affichage. Cela elimine totalement les erreurs flottantes sur les sommes de positions, critiques pour la precision graveur.

### Largeurs hors grille (off-grid)

Un equipement peut declarer un `widthMm` optionnel quand sa largeur reelle ne tombe pas sur la grille demi-module (ex : 200 mm exact pour un disjoncteur general specifique). Dans ce cas, `widthMm` prevaut pour l'affichage des cotes mais `widthHalfModules` reste l'occupation logique dans la rangee.

### Filtre anti tiret cadratin

Module `text-sanitizer.ts`. Aucun caractere `\u2014` (em dash) ni `\u2013` (en dash) ne peut survivre. Trois points d'application :
1. Saisie utilisateur (filtre temps reel)
2. Export PDF (avant ecriture)
3. Export Excel (avant ecriture)

Test garde-fou : `containsForbiddenDash()` est utilise dans les tests d'integration pour relire chaque export et verifier l'absence de ces caracteres.

### Hauteur unique par tableau

Choix architectural : la hauteur d'etiquette est globale au projet (champ `Project.heightMm`), pas variable par rangee ni par equipement. Cela simplifie le modele et permet d'afficher une hauteur precise dans le bandeau rouge du PDF.

### Source unique de verite

Le `Project` est la seule source. UI, PDF graveur, PDF client, Excel sont tous des projections. La fonction `layoutProject()` produit la structure geometrique commune utilisee a la fois par le rendu ecran et par les exports PDF.

## Exemple d'utilisation

```ts
import {
  layoutProject,
  validateProject,
  type Project,
} from '@ceff/core';

const project: Project = {
  id: 'p1',
  name: 'Lycee Pasteur',
  affaire: 'Lycee Pasteur batiment A',
  widthModules: 18,
  heightMm: 15,
  bgColor: 'blanc',
  textColor: 'noir',
  rows: [/* ... */],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  schemaVersion: 1,
};

const validation = validateProject(project);
if (!validation.ok) {
  console.error(validation.errors);
  return;
}

const layout = layoutProject(project);
// Utilisable par le SVG de l'editeur ET par le generateur PDF
```

## Prochaines etapes

1. `@ceff/charte` - tokens et composants stylises CEFF
2. `@ceff/export-pdf` - generation du PDF de plan d'etiquetage
3. `@ceff/export-excel` - generation de l'Excel pour graveur
4. `@ceff/store` - store Zustand avec validation a chaque mutation
5. `apps/web` - PWA editeur React
