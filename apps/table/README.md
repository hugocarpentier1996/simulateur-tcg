# Table locale

Lancer `pnpm dev` depuis la racine ; voir le README principal pour Docker.
Cette application consomme le moteur sans le modifier ni lui ajouter de dépendance DOM.

## Entrées et sorties

- `src/session.ts` : `createDemo()` fournit une session déterministe en Main. `dispatch`
  transmet une intention à `act` et conserve son résultat et un journal français.
  Un refus conserve l'état et le journal précédents, et ajoute un message d'erreur.
- `undo(session)` restaure l'état complet et le journal précédents, puis enlève un retour
  de l'historique (dix actions réussies maximum). Les instantanés partagent les données
  immuables du moteur sans historique imbriqué. Aucun rétablissement, aucune persistance ;
  une nouvelle partie repart sans historique et un refus n'ajoute pas d'instantané.
- `placementOptions(state, cardId)` demande à `getLegalActions` les destinations et
  paiements valides. `placeUnit(session, cardId, destinationId)` les recalcule au dépôt
  et joue l'action correspondante. Une carte impayable n'a aucune destination.
- `boardOptions` étend ces choix aux unités en jeu et `playOrMove` exécute le dépôt :
  déplacement sans paiement ou mise en jeu avec paiement. Les mouvements légaux sont
  fournis par le moteur ; la démo illustrée permet aussi les attaques, les passes
  et les répartitions de dégâts via le panneau latéral. `passShowdown` passe pour le joueur prioritaire
  de l'Open Showdown ; conquête, tenue et victoire restent calculées par le moteur.
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

## Démonstration illustrée et champs

Le navigateur utilise `createDemo(true)` : petits decks de démonstration orange/jaune
(Daring Poro, Petty Officer, Vanguard Attendant et Garen Rugged), runes Body/Order,
légende Might of Demacia. Les anciennes fixtures synthétiques restent disponibles
via `createDemo()` pour conserver leurs tests de paiement ciblés.

Les quatre champs sont dans le catalogue. Chaque joueur en apporte trois :
Fortified/Peak/Camp pour J1, Peak/Camp/Void pour J2. BO1 tire un champ par joueur
avec la graine fixe de démonstration ; deux exemplaires du même champ sont possibles.
« Choix BO3 · manche d’essai » propose les trois choix par joueur avant la préparation.
Cette vue teste la première manche ; le suivi complet de série BO3 reste une API moteur.

`tableActions(session)` fournit les choix autorisés aux deux joueurs locaux :
Shield, Channel facultatif, passes, allocations de combat, Vision, défausse,
capacités d'attaque et ordre des effets de mort.

`cardActions(session, cardId)` liste les actions complètes d'une carte de la main ou
d'une unité (sort ciblé, mise en jeu avec cible, énergie de sort), pour son propriétaire.
`submitCardAction` revérifie l'action affichée au clic : si l'état a changé, refus
sans modifier la partie. `handPlayer(state)` désigne le joueur dont la main est montrée,
les fenêtres obligatoires primant sur la priorité. `main.ts` recalcule
la liste au clic puis transmet l'intention à `dispatch`. Aucun bouton ne résout
une capacité ou ne répartit les dégâts en contournant `act`.

Les cartes affichent leur illustration locale, les unités leurs tags, et la
sélection montre une image plus grande. Les 70 images de cartes implémentées sont
incluses dans `public/cards`, même si le deck de démo n'utilise qu'un sous-ensemble.
Provenance : [métadonnées](../../docs/metadonnees-cartes.md).
