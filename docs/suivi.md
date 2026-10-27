# Suivi du projet

Ce fichier sert à reprendre le travail sans l'historique de conversation. Les règles
confirmées sont dans `regles.md`, les contrats et commandes dans le README et le code.
Mettre à jour ce suivi à chaque étape validée, puis créer un commit descriptif et pousser.
Les identifiants des commits ultérieurs se retrouvent avec `git log --oneline`.

## État au 27 octobre 2026

- Projet : monorepo pnpm, moteur TypeScript pur dans `packages/game-engine`, catalogue
  de test dans `packages/game-data`. Table locale dans `apps/table`, aucun serveur réseau de jeu.
- GitHub : `https://github.com/hugocarpentier1996/simulateur-tcg`, branche publiée `main`.
- Dernière validation fonctionnelle : `pnpm check` réussi, 173 tests et build Vite.
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

### Destinations interdites depuis la main — 26 octobre 2026

- Trois cas de régression explicites : jouer une unité depuis la main sur un battlefield
  adverse, neutre ou dans la base adverse renvoie `INVALID_SUMMON_DESTINATION`.
- Chaque refus conserve intégralement l'état initial. Les destinations autorisées restent
  couvertes par le test existant. Aucun changement du moteur nécessaire : les nouveaux
  tests passent dès leur ajout, le comportement étant déjà implémenté.
- Validation : test ciblé puis `pnpm check` réussi, 143 tests.

### Première table locale, plateau en miroir et placement automatique — 27 octobre 2026

- Application TypeScript/Vite dans `apps/table`. `pnpm dev` ouvre le serveur local sur
  127.0.0.1:5173 ; commande Docker et port local documentés. `pnpm check` inclut le build.
- Session préparée via les API publiques : decks fixes de 39 unités, 12 runes rouge/bleu,
  champions, dés fixes et aucun mulligan, jusqu'à la première Main. Pas de changement moteur.
- Plateau en miroir : deck de runes à gauche, runes de couleur au centre, deck et défausse
  à droite ; base au-dessus, champs centraux à colonnes dynamiques, adversaire en miroir.
  Légendes/champions près des bases, main adverse masquée et main active en éventail.
- À la demande de l'utilisateur, paiement manuel remplacé par un paiement automatique :
  `placementOptions` consomme `getLegalActions`, `placeUnit` revérifie au dépôt. Zones
  autorisées éclairées, glisser-déposer par événements pointeur (souris/tactile), alternative
  sélection puis clic/clavier sur « Poser ici ». Pas de dépense si refus ou annulation.
- Passage de tour, scores, ressources, unités Ready/Tap et journal français affichés.
- Tests de session et géométrie ajoutés avant implémentation : 150 tests au total.
  Vérification navigateur : paiement, passage au joueur 2 avec trois runes, placement
  par clic et par glisser-déposer (Éclaireur Tap et rune recyclée). `pnpm check` + build validés.
- Limites : démo locale sans sauvegarde ni écran de préparation. Aucun déplacement de
  permanents, combat, spell ou gear interactif pour cette tranche. Le paiement automatique
  propose un plan déterministe sans choix stratégique. Les règles restent dans le moteur.

### Placement de la légende et annulation locale — 27 octobre 2026

- Légende entre la base et le chosen champion : à droite pour le joueur actif, miroir
  à gauche pour l'adversaire, y compris sur écran étroit.
- Bouton hors plateau « Annuler l’action (N/10) », désactivé sans historique. Chaque
  action réussie sauvegarde l'état et le journal précédents ; `undo` les restaure et efface
  erreur/sélection. Les refus ne comptent pas. Dix instantanés maximum, sans historique
  imbriqué, sans rétablissement, réinitialisés à la nouvelle partie ou au rechargement.
- TDD : quatre tests observés en échec puis validés (mise en jeu/paiement, fin de tour,
  limite de dix sur treize actions, refus et nouvelle action après retour).
  `pnpm check` réussi : 154 tests et construction Vite.

### Déplacements, conquête et tenue dans la table — 27 octobre 2026

- Unités en jeu sélectionnables et déplaçables par glisser-déposer ou clic. `boardOptions`
  et `playOrMove` réutilisent les actions légales ; mouvement Ready depuis sa base vers
  un champ libre/allié, arrivée Tap sans paiement. Aucun changement des règles moteur.
- Open Showdown visible dans le panneau : priorité et compteur de passes, bouton pour
  le joueur prioritaire. Fin de tour bloquée pendant le Showdown. Conquête après toutes
  les passes, contrôle affiché puis tenue automatique au prochain Beginning.
- Journal : mouvement, passes, contrôle, conquête, tenue et pioche de remplacement.
  Annulation conservée sur mouvements et passes, y compris retour avant une conquête.
- Limite UI explicite : attaques masquées tant que les commandes de combat n'existent
  pas. Aucun mouvement entre champs ni retour volontaire en base ajouté.
- TDD : trois scénarios observés en échec puis validés (Tap/adversaire/refus, conquête
  puis holding avec annulation, renfort sans point et exclusion temporaire des attaques).
  Vérification navigateur : glisser-déposer, deux passes, score 0 → 1 → 2 au tour suivant.
  `pnpm check` : 157 tests + build. Serveur de vérification temporaire sur 5174 arrêté après essai.

### Première carte réelle : Vanguard Attendant — 27 octobre 2026

- OGS-016/024 dans `game-data/src/ogs`, export `vanguardAttendant` : 6 Énergie, 1 jaune,
  5 Might, arrivée Ready. Métadonnées texte/URL conservées, aucune image consultée.
- `entersReady` optionnel dans la définition et le contrat moteur ; mise en jeu Ready
  si true, Tap par défaut. Aucun changement aux decks de démonstration de l'interface.
- TDD : arrivée Ready observée en échec, puis trois cas validés : base/champ contrôlé,
  paiement, déplacement immédiat et refus coût/couleur/destination. `pnpm check` : 160 tests.
- Confirmations couleurs, Power bicolore, létalité après baisse de Might et exception ADD
  inscrites dans les règles. Les mécanismes bicolores/ADD/dégâts généraux restent à coder
  au fil des cartes concernées. Suivi carte par carte : `docs/cartes-ogs.md` (1/24).

### Zephyr Sage et Shield — 27 octobre 2026

- OGS-005/024 : 6 Énergie, 1 vert, 6 Might, Shield 1, arrivée Tap par défaut.
- `shield` dans le catalogue ; `combatMightBonus` ajoute le bonus dans `effectiveMight`
  uniquement pour le défenseur sur le champ du Combat Showdown, jusqu'à sa clôture.
  Le calcul commun couvre dégâts, seuil létal et affichage. Aucun effet de pile ajouté.
- TDD : bonus et survie observés en échec, puis quatre tests validés : toutes les étapes
  du combat, absence hors contexte, survie à 6 dégâts puis soin global et retour à 6 Might,
  coût et arrivée Tap. `pnpm check` : 164 tests + build.
- Assault confirmé avec le même timing côté attaquant ; à implémenter avec Garen OGS-007.
  Suivi OGS : 2/24 cartes, toujours hors decks de démonstration. Aucune image analysée.

### Garen Body OGS-007 — 27 octobre 2026

- 6 Énergie, 1 orange, 5 Might, Assault 2 / Shield 2. Bonus choisi selon le rôle :
  jamais +4, jamais en Open ni hors du champ de combat. Export `garenBody`.
- TDD : attaque observée en échec, quatre tests validés (attaque/défense complètes,
  exclusions et mise en jeu Tap). Validation complète : 168 tests + build.
- Suivi OGS : 3/24, catalogue/moteur uniquement, hors decks de démo.

### Master Yi Body OGS-009 — 27 octobre 2026

- 7 Énergie, 1 orange, 6 Might ; arrivée Ready et Ganking. Export `masterYiBody`.
- Mouvement basique étendu aux champs d'origine pour Ganking : Ready obligatoire, Tap
  après déplacement, refus même champ/base et hors fenêtre. Champ quitté neutralisé
  seulement si aucune unité n'y reste, registre des points conservé. Actions légales
  mises à jour automatiquement par validation dans `act`.
- TDD : déplacements observés en échec puis cinq tests validés (Open sans double score,
  maintien du contrôle et entrée en combat, exclusions, coût/Ready, renfort allié).
- Validation complète : 173 tests + build. Suivi OGS : 4/24, hors decks de démo.

### Highlander OGS-020 — 27 octobre 2026

- Réaction à 4 Énergie, cible alliée revérifiée à la résolution. Ajoute une protection
  temporaire contre la prochaine mort : rappel Tap en base et soin immédiat.
- Équipement, bonus/malus et Stun conservés ; pas de déplacement ni de capacité de mort.
  `replaceDeaths` précède le traitement simultané des morts de combat ; à réutiliser
  lors de l'ajout des autres sources de mort. Aucun système de dégâts de sorts ajouté.
- TDD : cible ennemie acceptée et protection absente observées en échec ; puis mort au
  lieu du rappel observée en échec. Neuf tests couvrent paiement/pile, cible, attaque et
  défense, usage unique, expiration, jeton, soin immédiat et dégâts simultanés.
- Suivi OGS : 5/24, catalogue/moteur seulement. Highlander hors decks de démonstration.
- Validation complète : `pnpm check`, 182 tests et build réussis.
- Autorisation actuelle : continuer les cartes OGS sans demander sauf doute de règle,
  avec validation complète puis commit/push distinct après chaque carte.

### Master Yi Calm OGS-004 — 27 octobre 2026

- 5 Énergie, 1 Power vert, 4 Might, arrivée Tap. Bonus statique de +4 Might si son
  propriétaire a au moins huit runes en jeu (Ready ou Tap), jamais celles du deck.
- `runeMightBonus` est recalculé par `effectiveMight` : un paiement qui recycle la
  huitième rune fait immédiatement perdre le bonus. Aucun effet mis sur la pile.
- TDD : bonus absent, combat refusé et définition mutable observés en échec ; six
  tests passent pour les seuils 7/8/9, le coût/recyclage et un combat complet.
- Suivi OGS : 6/24, toujours hors decks de démo. Les morts hors combat restent à
  raccorder avec les premières cartes de dégâts, comme pour les autres bonus/malus.
- Validation complète : `pnpm check`, 188 tests et build réussis.

### Garen Order OGS-013 — 27 octobre 2026

- 6 Énergie, 1 jaune, 5 Might, arrivée Tap ; +1 Might aux autres unités alliées dans
  sa zone (base comprise). Pas de bonus à soi-même, à l'adversaire ni ailleurs.
- Aura continue recalculée sans pile : suit la source et cesse à son départ, fonctionne
  Tap/Stun ; plusieurs sources se cumulent et peuvent se renforcer mutuellement.
- TDD : six tests observés en échec puis validés. Combat avec mort de Garen : l'allié
  profite du bonus pour survivre, reçoit le soin global, puis perd l'aura.
- Suivi OGS : 7/24, catalogue/moteur, hors decks de démo. Suite proposée : Incinerate,
  première tranche de dégâts de sort avec le traitement des morts hors combat.
- Validation complète : `pnpm check`, 194 tests et build réussis.

### Incinerate OGS-003 — 27 octobre 2026

- Action, 2 Énergie, aucun Power : 2 dégâts à une unité sur un battlefield, alliée ou
  adverse. Zone revérifiée à la résolution. Dégâts persistants, pas de soin par sort.
- `settleLethalUnits` traite les morts après effets/actions et en cascade lors de la
  perte d'une aura. Réutilise Highlander, gère jetons/cimetières, conserve le contrôle
  du showdown et empile les nouveaux effets de mort au-dessus de la pile restante.
- `passStack` attend les choix de ces effets avant de terminer la chaîne ou le combat.
  Une élimination du défenseur pendant l'après-combat est mémorisée pour sa relance.
- Soin global de fin de tour ajouté avant expiration des modificateurs temporaires.
- TDD : dégâts absents, cible de base acceptée, morts/soin absents observés en échec ;
  test de relance initialement en échec puis corrigé. Douze tests ciblés couvrent ces
  cas, les réactions, les cascades d'aura et le recyclage de la huitième rune de Yi.
- Suivi OGS : 8/24, hors decks de démo. Destruction directe et dégâts de zone restent
  pour leurs cartes ; aucun nouveau mécanisme générique de déclenchement préconstruit.
- Validation complète : `pnpm check`, 206 tests et build réussis.

### Final Spark OGS-022 — 27 octobre 2026

- Action, 8 Énergie sans Power, 8 dégâts à toute unité en jeu, base comprise.
  Réutilise les dégâts et morts d'Incinerate sans code moteur supplémentaire.
- TDD : carte absente du catalogue constatée, puis trois scénarios validés : cible
  en base/champ, paiement complet/refus à 7, survie à 9 Might avec 8 dégâts conservés.
- Suivi OGS : 9/24, hors decks de démo. Question posée pour Gentlemen's Duel : choix
  de l'ennemi au lancement ou à la résolution après le +3 ? Réponse encore attendue.
- Validation complète : `pnpm check`, 209 tests et build réussis.

### Gentlemen's Duel OGS-008 — 27 octobre 2026

- 6 Énergie + 1 orange, Action. `targetId` alliée et `secondaryTargetId` ennemie requis
  dès le lancement, vérifiés avant paiement et revérifiés à la résolution. Les actions
  légales énumèrent les paires. +3 Might pour le tour, puis dégâts réciproques simultanés.
- Confirmation : Stun ne bloque que les dégâts de combat. Le duel produit des événements
  `unit-damage`, contexte `duel`, avec chaque unité comme source. Ni dégâts de sort,
  ni de capacité, ni de combat ; les futures préventions doivent respecter cette distinction.
- TDD : huit échecs pertinents puis douze tests validés : coûts, ciblage/refus, pile,
  réactions, morts simultanées, Stun, Highlander, provenance et expiration du bonus.
- Comportement provisoire hérité du moteur : allié disparu = aucun effet ciblé ; ennemi
  disparu = bonus allié conservé, pas de duel, pas de nouvelle cible ni remboursement.
- Suivi OGS : 10/24, hors decks de démo. Pas de système de prévention préconstruit.
- Validation complète : `pnpm check`, 221 tests et build réussis (lint du test corrigé).

## Limites à conserver lors d'une reprise

- Première capacité de mort implémentée pour les morts de combat et hors combat. Autres déclencheurs,
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
- Étendre la table locale aux combats et aux sorts pendant les Showdowns.

L'utilisateur choisira la prochaine tranche ; ces pistes ne constituent pas une autorisation
de toutes les développer. À la reprise, vérifier les modifications locales avant d'agir.
