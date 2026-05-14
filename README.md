# Etiquettes CEFF

Application metier gratuite pour generer des etiquettes de tableaux electriques modulaires, prete a envoyer au graveur industriel.

## Installation

```bash
cd packages/core
npm install
npm test
```

Si les 92 tests passent, le coeur metier est bon.

## Structure

- `packages/core` : modele de donnees, validateurs, moteur dimensionnel, layout. **92 tests verts.**
- `packages/export-pdf` : generateur PDF du plan d'etiquetage (en cours de developpement).
- `apps/web` : a venir, PWA editeur React.

## Workflow Claude Code

Le fichier `CLAUDE.md` a la racine contient tout le contexte du projet. Claude Code le lit automatiquement au demarrage.

```bash
claude
```

Pour reprendre le travail :
> Continue le generateur PDF du package export-pdf. Lis CLAUDE.md pour le contexte. La prochaine action est dans la section "Prochaine action suggeree".
