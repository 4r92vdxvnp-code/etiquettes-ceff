# Projet : Generateur d'etiquettes pour tableaux electriques modulaires CEFF

Application metier gratuite permettant a un electricien de saisir le contenu d'un tableau electrique modulaire (rangees, equipements, dimensions) et de generer un fichier d'etiquetage prêt a envoyer au graveur industriel.

## Etat d'avancement

| Etape | Etat | Commentaire |
|---|---|---|
| Architecture generale | Termine | Documentee dans ce CLAUDE.md |
| Modele de donnees | Termine | Package `@ceff/core` |
| Validateurs metier | Termine | 35 tests verts |
| Moteur dimensionnel | Termine | 23 tests verts |
| Layout commun ecran/PDF | Termine | 5 tests verts |
| Filtre anti tiret cadratin | Termine | 16 tests verts |
| Libelles francais corriges | Termine | 13 tests verts |
| **Generateur PDF** | **Termine** | 4 tests verts : generation A3, anti-cadratin, echelle reduite, couleurs etiquettes |
| **Generateur Excel** | **Termine** | 4 tests verts : libelles, anti-cadratin, couleurs etiquettes, dimensions |
| Charte CEFF (composants stylises) | A faire | |
| **Editeur React (PWA)** | **Termine** | Vite 5 + React 18 + Tailwind + Zustand + vite-plugin-pwa, build OK |
| **Persistance** | **Termine** | localStorage auto-save a chaque mutation (IndexedDB prevu en V2) |
| Vision IA (option) | A faire | |

**Total tests core : 93 verts. Total tests export-pdf : 4 verts. Total tests export-excel : 4 verts. Total : 101 tests.**

## Architecture

Monorepo avec packages independants :

```
etiquettes-ceff/
├── packages/
│   ├── core/         (livre, 92 tests verts)
│   ├── export-pdf/   (en cours)
│   ├── export-excel/ (a faire)
│   └── charte/       (a faire)
└── apps/
    └── web/          (a faire, PWA React)
```

Stack cible : TypeScript strict + Vite + React 18 + Tailwind + Zustand + pdf-lib + ExcelJS + IndexedDB. PWA installable sur iOS, Android, Windows, macOS.

## Regles metier strictes (NON NEGOCIABLES)

### 1. Unite de stockage : demi-modules entiers

Toutes les positions et largeurs sont stockees en `HalfModules` (entiers). 1 demi-module = 9 mm. 1 module = 18 mm. Conversion en mm uniquement a l'affichage et a l'export. Cela elimine totalement les erreurs flottantes sur les sommes de positions, critiques pour la precision graveur.

**Ne jamais faire d'arithmetique flottante sur les positions ou largeurs.**

### 2. Anti tiret cadratin (regle CRITIQUE)

Aucun caractere `\u2014` (em dash) ni `\u2013` (en dash) ne doit survivre a la chaine de traitement. Trois points d'application :
1. Saisie utilisateur : filtre temps reel via `sanitizeLabelText()`
2. Export PDF : filtre avant ecriture via `stripForbiddenDashes()`
3. Export Excel : filtre avant ecriture via `stripForbiddenDashes()`

Test garde-fou : `containsForbiddenDash()` est utilise dans les tests d'integration pour relire chaque export et verifier l'absence de ces caracteres. **Le test d'integration anti-cadratin doit faire partie du CI.**

### 3. Source unique de verite

Le `Project` (defini dans `core/src/types/project.ts`) est la seule source. UI, PDF graveur, PDF client, Excel sont tous des projections. La fonction `layoutProject()` produit la structure geometrique commune utilisee a la fois par le rendu ecran et par les exports PDF.

**Pas de duplication de donnees entre l'editeur et les exports.**

### 4. Hauteur d'etiquette unique par tableau

Choix architectural valide : la hauteur d'etiquette est globale au projet (champ `Project.heightMm`), pas variable par rangee ni par equipement. Valeurs autorisees : 15, 30, 40, 50, 100 mm.

### 5. Largeurs hors grille autorisees

Un equipement peut declarer un `widthMm` optionnel quand sa largeur reelle ne tombe pas sur la grille demi-module (ex : 200 mm exact pour un disjoncteur general specifique). Dans ce cas, `widthMm` prevaut pour l'affichage des cotes mais `widthHalfModules` reste l'occupation logique dans la rangee.

L'editeur affiche un avertissement visuel quand `offGrid` est vrai dans le layout.

### 6. Orthographe francaise correcte dans les libelles generes

Tous les libelles generes automatiquement par l'application utilisent l'orthographe correcte : LONGUEUR (pas LONGEUR), LONGUEUR TOTALE (feminin), Rangee (avec accent), GENERAL (masculin), RANGEMENT (pas RANGEMANT).

Les textes saisis par l'utilisateur dans les etiquettes ne sont pas corriges : c'est sa saisie, on la respecte.

## Charte graphique CEFF (STRICTE)

**Police unique : Arial.** Aucune autre police, aucune fantaisie typographique.

| Element | Taille | Poids | Couleur |
|---|---|---|---|
| Titre 1 (bandeau bleu) | 24pt | 700 | `#1F3864` |
| Titre 2 (bandeau rouge) | 18pt | 700 | `#9B2020` |
| Titre 3 | 14pt | 700 | `#404040` |
| Corps | 11pt | 400 | `#000000` |
| Alerte | 11pt | 700 | `#C00000` |

**Couleurs autorisees pour les etiquettes : rouge (`#C00000`), noir (`#000000`), blanc (`#FFFFFF`) uniquement.**

**Interdictions absolues :** pas de `box-shadow`, pas de `text-shadow`, pas de `linear-gradient`, pas de `radial-gradient`, pas d'effet `blur`. Couleurs interdites : `#2E75B6` (bleu intermediaire), `#ED7D31` (orange vif), tout orange sature.

## Format du PDF de sortie

Le PDF principal n'est PAS une planche d'etiquettes prete a graver. C'est un **plan de validation** type plan technique avec cotation millimetrique :

- Format A3 paysage
- En-tete : logo CEFF a gauche + bandeau bleu marine `ETIQUETAGE TABLEAU MODULAIRE - Affaire : [nom]` + bandeau rouge cramoisi `Capacite par rangee : X modules = Y mm - Hauteur etiquette : Z mm - Fond : [couleur] - Texte : [couleur]`
- Plan : chaque rangee dessinee a l'echelle, avec rectangles d'etiquettes, modules vides representes, cotes individuelles type plan mecanique (fleche double sens, valeur centree), cote totale en bas (trait pointille)
- Echelle automatique pour faire tenir un 36 modules (648 mm) sur A3 paysage utile (400 mm) : facteur ~0,52

Voir l'image d'exemple `EXEMPLE_DE_TABLEAU_ETIQUETAGE_MODULAIRE.pdf` pour le rendu cible.

## Stack technique pour le generateur PDF (en cours)

Bibliotheque : **pdf-lib** (vectoriel propre, manipulable, pas de rasterisation).

Fichiers deja crees dans `packages/export-pdf/src/` :
- `charte-tokens.ts` : couleurs CEFF en RGB normalise pour pdf-lib, tailles de police, dimensions de mise en page en mm, helpers `mm()` et `pt()`
- `draw-helpers.ts` : `strokeRect`, `fillRect`, `fillStrokeRect`, `drawLine`, `drawArrowHead`, `drawCotation`, `drawText`, `drawTextInBox`, `measureTextWidth`
- `scale.ts` : `computePlanScale`, `tableXToPageX`, `tableWidthToPageWidth`

**A faire pour terminer le generateur PDF :**

1. Ecrire `src/header.ts` : fonction `drawHeader(ctx, project)` qui dessine logo + bandeau bleu + bandeau rouge en haut de la page A3.

2. Ecrire `src/row-renderer.ts` : fonction `drawRow(ctx, layoutRow, scale, yPosition, rowIndex)` qui dessine une rangee entiere : libelle "Rangee N" a gauche, rectangles d'etiquettes (avec couleurs reelles selon `bgColor`/`textColor` du projet), texte centre dans chaque etiquette, cotes individuelles sous chaque equipement (LONGUEUR / LONG selon largeur), cote totale en pointille en bas.

3. Ecrire `src/generate-pdf.ts` : fonction principale `generatePdf(project)` qui orchestre tout :
   - Cree un PDFDocument pdf-lib
   - Embed la police Helvetica (proche d'Arial, livree avec pdf-lib) - pour la fidelite parfaite Arial, prevoir embedFont avec Liberation Sans en option future
   - Ajoute une page A3 paysage
   - Appelle `drawHeader()`
   - Calcule `scale = computePlanScale(...)`
   - Pour chaque rangee, appelle `drawRow()`
   - Si `scale.reduced`, ajoute pied de page "Echelle 1:X.XX - Document non contractuel"
   - Garantit l'absence de tiret cadratin via `stripForbiddenDashes()` sur tout texte avant ecriture
   - Retourne `Uint8Array` (les bytes du PDF)

4. Ecrire `src/__tests__/generate-pdf.test.ts` :
   - Test 1 : genere le PDF de l'exemple CEFF (3 rangees, 18 modules), verifie qu'il contient les bons libelles via `pdf-parse`.
   - Test 2 : test garde-fou anti tiret cadratin. On cree un projet avec un texte contenant `\u2014`, on genere le PDF, on extrait son texte, on verifie `containsForbiddenDash(extractedText) === false`.
   - Test 3 : reduction d'echelle pour un tableau 36 modules.
   - Test 4 : couleurs etiquettes correctes (rouge `#C00000`, noir, blanc) selon `bgColor`/`textColor`.

5. Ecrire `src/index.ts` : exporter `generatePdf` et types associes.

## Choix de conception valides avec l'utilisateur

1. **Hauteur etiquettes : unique pour tout le tableau** (pas par rangee, pas par equipement)
2. **Valeurs hors grille demi-module : autorisees en saisie libre** (avec avertissement visuel)
3. **Orthographe libelles generes : corrigee automatiquement** (LONGUEUR, LONGUEUR TOTALE, GENERAL, RANGEMENT)

## Points de vigilance industriels

- **Precision dimensionnelle** : les graveurs travaillent au dixieme de mm. Stockage en demi-modules entiers garantit l'exactitude.
- **Differences metriques police** : Arial Windows vs Arial macOS vs Helvetica PDF peuvent avoir de micro-differences. Tester sur les machines des graveurs avant prod.
- **Couleurs RVB vs CMJN** : la charte est en hex (RVB). Les graveurs travaillent en CMJN. Documenter les equivalents CMJN approches.
- **Decoupe multi-pages A3** : si on ajoute cette option, repere de raccord a 5 mm du bord, trait fin 0,2 mm.
- **Profondeur d'undo** : 50 niveaux minimum dans l'editeur.
- **Sauvegarde locale auto** : toutes les 5 secondes ou a chaque mutation, dans IndexedDB.
- **Test anti tiret cadratin de bout en bout** : doit tourner dans le CI a chaque commit.
- **Compatibilite iOS Safari** : IndexedDB limitee a ~50 Mo, pas de stockage permanent garanti. Prevoir export JSON regulier.
- **Performance 50 rangees x 36 modules** : 2400 cellules potentielles. Virtualisation si freeze.

## Conventions de code

- TypeScript strict avec `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- Pas de `any`. Si on doit en mettre un, commentaire explicite obligatoire.
- Pas d'accents dans les commentaires de code (compatibilite editeurs / encodings). Accents OK dans les chaines `string`.
- Tests unitaires avec Vitest. Un fichier de test par module, dans `__tests__/`.
- Imports avec extension `.js` (ESM strict).
- Barrel files (`index.ts`) dans chaque sous-dossier pour les exports publics.

## Quick start (a faire la premiere fois sur un nouveau poste)

```powershell
cd packages\core
npm install
npm test
# Resultat attendu : 92/92 tests passent

cd ..\export-pdf
npm install
# Pas de tests pour l'instant, en cours de developpement
```

## Prochaine action suggeree

Ecrire le generateur Excel (`packages/export-excel/`) en s'inspirant de la meme architecture : `@ceff/core` comme source unique, `stripForbiddenDashes()` sur chaque cellule, test anti-cadratin en CI.
