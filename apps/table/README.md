# Table locale

Lancer `pnpm dev` depuis la racine ; voir le README principal pour Docker.
Cette application consomme le moteur sans le modifier ni lui ajouter de dépendance DOM.

## Entrées et sorties

- `src/session.ts` : `createDemo()` fournit une session déterministe en Main. `dispatch`
  transmet une intention à `act` et conserve son résultat et un journal français.
  Un refus conserve l'état et le journal précédents, et ajoute un message d'erreur.
- `placementOptions(state, cardId)` demande à `getLegalActions` les destinations et
  paiements valides. `placeUnit(session, cardId, destinationId)` les recalcule au dépôt
  et joue l'action correspondante. Une carte impayable n'a aucune destination.
- `src/view.ts` : transforme une session et une sélection en HTML échappé. Le plateau
  montre les zones en miroir ; les colonnes de battlefield suivent leur nombre réel.
- `src/main.ts` : traduit les clics et gestes pointeur en intentions. La carte flottante
  pendant un déplacement est uniquement visuelle. Le DOM n'est pas remplacé durant le
  geste, et aucun coût n'est payé avant la libération du pointeur sur une zone valide.
- `src/fan.ts` : positions symétriques de la main, avec rotation limitée à ±12°.
- `src/style.css` : plateau, cartes, éventail, zones éclairées et adaptation à la largeur.

## Déboguer

Pour un refus : consulter le panneau à droite, puis `placementOptions` et `act`.
Pour une différence d'affichage : comparer `session.state` dans le débogueur avec la
fonction de rendu concernée. La page ne conserve pas d'état entre rechargements.

Tests ciblés : `pnpm exec vitest run apps/table/src` ; validation complète : `pnpm check`.
Les tests de session vérifient l'intégration réelle avec le moteur (paiement, champion,
refus atomique, destinations et tours). Le parcours de glisser-déposer est aussi vérifié
manuellement dans le navigateur ; il n'y a pas encore de suite E2E automatisée.
