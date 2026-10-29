# Tags et images des cartes

Les 69 cartes implémentées et le jeton Recruit possèdent des métadonnées imprimées
dans `packages/game-data/src/printed-metadata.ts`. Les constructeurs les associent
par identifiant ; les cartes fictives de test n'ont pas d'image inventée.

- Tags : données structurées de la [galerie officielle](https://playriftbound.com/en-us/card-gallery/),
  récupérées le 29 octobre 2026 (champ `tags.tags`). Aucune déduction à partir du nom,
  de l'univers ou des capacités. Par exemple Tibbers OGS porte le tag Annie dans cette source.
- Images : copies des fichiers indiqués par `imageLocale` dans les JSON locaux
  Proving Grounds et Origins, dans `apps/table/public/cards/`. Recruit vient de
  `VEN - Vendetta/images/VEN-T04.png` et garde son identifiant moteur existant.
- `imageUrl` conserve la provenance distante ; `imageLocal` est le chemin HTTP
  local utilisable par la démo, inclus dans le build Vite.
- `displayName` conserve le nom complet du JSON, y compris les sous-titres de champions.
- `tags` est une liste immuable de métadonnées, distincte de Shield, Assault, Tank, etc.
  Le moteur expose `unitTags(state, unitId)` pour consulter la définition d'une unité
  en jeu, sans dupliquer ces données à chaque déplacement.

Les illustrations restent la propriété de leurs ayants droit. Aucun fichier image
n'a été analysé pour extraire les tags. Les JSON bruts restent hors du dépôt Git.
