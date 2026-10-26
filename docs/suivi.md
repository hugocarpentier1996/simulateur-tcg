# Suivi du projet

Ce fichier sert à reprendre le travail sans l'historique de conversation. Les règles
confirmées sont dans `regles.md`, les contrats et commandes dans le README et le code.
Mettre à jour ce suivi à chaque étape validée, puis créer un commit descriptif et pousser.
Les identifiants des commits ultérieurs se retrouvent avec `git log --oneline`.

## État au 26 octobre 2026

- Projet : monorepo pnpm, moteur TypeScript pur dans `packages/game-engine`, catalogue
  de test dans `packages/game-data`. Aucun client graphique ni serveur réseau opérationnel.
- GitHub : `https://github.com/hugocarpentier1996/simulateur-tcg`, branche publiée `main`.
- Dernière validation fonctionnelle : `pnpm check` réussi, 140 tests.
- Environnement principal : Windows/PowerShell, Docker disponible. Voir README pour les commandes.
- Attentes utilisateur : français, explications des étapes importantes, modules lisibles,
  contrats d'entrée/sortie documentés, TDD strict, publication GitHub à chaque étape achevée.

## Étapes réalisées

### Socle, tours, unités, combats et sorts — commit `9254b3d`

- Tours automatiques, ressources, paiement par runes, pioche et épuisement des decks.
- Unités jouées Tap en base, mouvements, Open/Combat Showdown, dégâts simultanés,
  règles Tank/Backline, retraite, soin global et conquête.
- Quatre sorts de test : déplacement, +2 Might, −1 Might et pioche, Stun d'un attaquant.
- Pile de Réactions, réaction sur réaction, fenêtres entre les sorts, effets jusqu'à
  la fin du tour. 84 tests validés lors de cette étape.

### Victoire, préparation de partie et BO3 — commit `57657b4`

- Victoire à 8 points. Dernier point de conquête conditionné aux autres champs scorés
  ce tour ; sinon pioche et inscription du champ comme scoré, sans point supplémentaire.
- Configuration : 39 cartes, chosen champion séparé, légende, 12 runes compatibles
  avec les couleurs de la légende, trois battlefields par joueur.
- D20 fournis par le serveur, égalité rejouée, choix du premier joueur ; quatre cartes
  initiales, mulligan de 0 à 2 sous le deck, puis pioche du premier tour.
- Channel initial : deux runes pour le premier, trois pour le second à son premier tour.
- BO1 : battlefield aléatoire par joueur. BO3 : choix avant les dés en manche 1,
  puis dernier perdant décide du départ aux manches suivantes.
- Gestionnaire BO3 séparé : `createBo3`, `actBo3`, `rollBo3`, `startNextBo3Game`.
  Résultats comptés une fois ; série terminée à 2–0 ou 2–1. Chaque joueur ne peut
  réutiliser une définition de battlefield dans la série, même sous un autre ID d'instance.
- Validation : `pnpm check`, 113 tests. Les scénarios sont dans `victory.test.ts`,
  `setup.test.ts` et `bo3.test.ts`.

### Suivi permanent — 26 octobre 2026

- Consigne de commit/push après chaque étape ajoutée à `AGENTS.md`.
- Création de ce journal et ajout d'un lien de reprise dans le README.
- Changement documentaire uniquement ; vérification complète avec `pnpm check`.

### Gears et équipements — 26 octobre 2026

- Permanents non-unités dans `GameState.gears`, catalogue `gearDefinitions`, transmis
  aussi par `createGame`. Pose Ready en base via `play-gear`, paiement commun aux cartes.
- `equip-gear` paie un coût distinct et attache à une unité alliée. Main active hors
  Showdown, sans pile en cours ; pas d'épuisement ni de rééquipement tant que le porteur vit.
- Auras et bonus du porteur calculés par `effectiveMight(unit, state)`, utilisés pour
  les dégâts et seuils létaux. Attention : l'ancien appel sans état omet les gears.
- Synchronisation après chaque action : suivi des déplacements/retraites, retour en
  base et détachement à la mort du porteur, Ready/Tap conservé. Awaken inclut les gears.
- Deux cartes de test : Bannière de ralliement (+1 Might aux alliés) et Lame renforcée
  (+2 au porteur). Coûts provisoires, avec les identifiants de couleur de test existants.
- Tests écrits puis observés en échec avant implémentation ; 14 nouveaux tests,
  validation complète `pnpm check` réussie (127 tests).
- Exceptions gear-unité et capacités déclenchées non couvertes. Pose/attachement
  immédiats dans cette tranche ; pas de fenêtre de Réaction spécifique à ces opérations.
  Le bannissement d'un porteur et les autres effets de gears restent à définir.

### Mort, champion, actions jouables et partie complète — 26 octobre 2026

- Carte `reborn` : à la mort, invoque `spirit`, jeton Tap de 3 Might. Le jeton disparaît
  à sa mort. Catalogue `deathTestUnits` à fournir avec les deux définitions.
- `play-unit` accepte la zone champion et `destinationId` : base propre ou battlefield
  contrôlé uniquement, arrivée Tap et coût normal. Même règle pour l'invocation.
- Dégâts, soin, déclenchements puis transfert des morts avant les choix. `pendingDeaths`
  attend `queue-death-effects` : ordre choisi par chaque propriétaire, attaquant puis défenseur.
- Pile commune aux sorts et effets de mort, Réactions possibles entre résolutions.
  `combatAftermath` diffère la conquête. `combat/finish.ts` relance si le défenseur éliminé
  a été remplacé, sans score intermédiaire ; sinon conquête/retraite/clôture normale.
- Tests : victoire après deux combats, défaite au second sans point, pas de victoire
  prématurée à 7, ordre des morts, réaction, et absence de relance si un défenseur avait survécu.
- `getLegalActions(state, playerId)` valide les candidats par `act`, avec un paiement
  réalisable par choix. Inclut préparation, sorts, unités/champion, gears, dégâts et choix de mort.
  Pas d'énumération de tous les plans de paiement ; combinaisons de dégâts/morts coûteuses
  sur grand plateau. Pour BO3 : lire `series.game`, exécuter ensuite via `actBo3`.
- `full-game.test.ts` joue un BO1 complet via les actions autorisées, jusqu'à **8–1** :
  champions, gear, Réaction, deux combats puis tenue. Replay identique vérifié.
- TDD : tests observés en échec avant l'ajout des comportements. `pnpm check` réussi,
  140 tests. La simulation complète est également une vérification d'intégration.

## Limites à conserver lors d'une reprise

- Première capacité de mort implémentée pour les morts de combat. Autres déclencheurs,
  nouvelles sources de dégâts et cartes accordant des points restent à ajouter.
  Destination d'invocation devenue illégale : effet ignoré, choix provisoire documenté.
- Effets propres aux battlefields, tags légende/champion et limites de copies à compléter.
- Les cartes de test utilisent encore `color-1`/`color-2` ; les nouvelles configurations
  utilisent rouge, vert, bleu, orange, violet, jaune. Harmoniser coûts et runes ensemble.
- Le moteur reçoit un état serveur de confiance, sans validation générale de JSON client.
  Ne pas exposer les mains, les choix privés ou le hasard aux clients.
- Hasard reproductible du prototype non cryptographique. Les decks initiaux sont fournis
  déjà mélangés ; la production nécessitera un hasard serveur privé, compatible avec les replays.
- Les choix provisoires de résolution des sorts figurent dans le README ; ne pas les
  transformer en règles confirmées. Aucune règle de sideboard BO3 n'a été définie.
- Le mode pris en charge est 1v1 ; les structures restent extensibles à plusieurs joueurs.

## Suites possibles, non encore engagées

- Étendre les capacités avec des cartes concrètes et tester leurs interactions.
- Harmoniser les couleurs et construire deux decks de démonstration cohérents.
- Préparer une interface minimale pour jouer et observer une partie complète.

L'utilisateur choisira la prochaine tranche ; ces pistes ne constituent pas une autorisation
de toutes les développer. À la reprise, vérifier les modifications locales avant d'agir.
