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

### Annie Fury OGS-001 — 27 octobre 2026

- 5 Énergie + 1 rouge, 4 Might, Tap. +1 par instance de dégâts de sort du propriétaire.
  Bonus continu cumulable, indépendant de la zone/Ready/Stun, calculé à la résolution.
- TDD : quatre échecs pertinents constatés, puis sept tests valident le bonus, le coût,
  le cumul, le départ de source et les exclusions du combat/duel.
- `spellAbilityDamageBonus` servira également aux capacités de dégâts, mais aucune
  n'existe encore : raccordement et test avec Tibbers à faire. Carte suivie comme tranche
  partielle dans le registre (10 cartes complètes + Annie partielle), hors démo.
- Validation complète : `pnpm check`, 228 tests et build réussis.

### Blast of Power OGS-012 — 27 octobre 2026

- Action, 6 Énergie + 1 jaune : tue une unité sur un battlefield, sans dégâts ni soin.
  Cible revérifiée à la résolution. Highlander remplace aussi cette mort directe.
- `settleLethalUnits` accepte des IDs condamnés explicitement, consommés une fois ;
  le reste du traitement (capacités, jetons, aura perdue, contrôle) reste commun.
- TDD : cinq échecs pertinents puis sept tests validés, notamment Might 0/100,
  refus base/couleur, rappel Highlander et effets de mort sans score prématuré.
- Registre : 11 cartes complètes, Annie Fury partielle, toutes hors decks de démo.
- Validation complète : `pnpm check`, 235 tests et build réussis.

### Firestorm OGS-002 — 27 octobre 2026

- Sort Normal, 6 Énergie + 1 rouge, cible un battlefield. Inflige simultanément
  3 dégâts à chaque ennemi qui y est présent à la résolution, sans toucher les alliés,
  les bases ni les autres champs. Interdit en showdown et en réaction.
- Ciblage de champ ajouté à `SpellDefinition`/`SpellBlueprint` et aux actions légales.
  `dealSpellDamage` partage les dégâts ciblés/de zone ; bonus d'Annie par unité touchée,
  tous les dégâts avant les morts et leurs choix. Aucun score par le sort lui-même.
- TDD : six échecs constatés puis huit tests validés, dont réactions modifiant les
  présences, champ supprimé, Annie et plusieurs effets de mort simultanés.
- Confirmation supplémentaire : Blast of Power ne tue pas une cible revenue en base
  avant sa résolution. Test déjà présent ; futur test d'intégration avec Flash à ajouter.
- Registre : 12 cartes complètes, Annie Fury partielle ; hors decks de démo.
- Validation complète : `pnpm check`, 243 tests et build réussis.

### Decisive Strike OGS-024 — 28 octobre 2026

- Action, 5 Énergie + 1 Power orange OU jaune. +2 Might pour le tour aux alliés présents
  à la résolution, en base et sur les champs ; pas aux arrivants ultérieurs.
- Ciblage technique `caster` : `targetId` est l'ID du lanceur. `boost-allies` applique
  des modificateurs temporaires, pas une aura. Contrats dans les types et modules.
- `powerChoice` traite un symbole flexible supplémentaire ; le paiement automatique
  préfère le Power flottant. Deux symboles bicolores (Tibbers) restent à étendre.
- TDD : cinq échecs pertinents puis sept scénarios sur coût/couleur, portée/expiration,
  timing, arrivées tardives et plateau vide. Registre : 13 cartes complètes et Annie
  Fury partielle. Hors decks de démo.
- Validation complète : `pnpm check`, 250 tests et build réussis.

### Flash OGS-011 — 28 octobre 2026

- Réaction, 2 Énergie sans Power : déplace 0, 1 ou 2 unités alliées distinctes en base.
  Conserve Ready/Tap, dégâts, Stun et équipement. Pas de soin ni de score.
- `selectedUnitIds` est une sélection explicite copiée au lancement ; `targetId`
  reste l'ID du lanceur (ciblage technique caster). Actions légales : toutes les
  sélections sans doublon jusqu'à deux. Revérification individuelle à la résolution.
- Intégration réelle : Flash répond à Blast of Power ; l'unité revenue en base survit,
  Blast reste payé et part au cimetière. Contrôle maintenu pendant le showdown actif.
- TDD : dix échecs pertinents constatés, puis treize tests couvrent sélection, paiement,
  Ready/Tap, dégâts, équipement, priorité/réaction, copie des choix et cibles disparues.
- Limite de prototype héritée : une cible disparue/devenue adverse est ignorée ; une
  cible déjà en base ne produit pas de déplacement. Hors decks de démonstration.
- Registre : 14 cartes complètes, Annie Fury partielle ; aucune légende implémentée.
- Validation complète : `pnpm check`, 263 tests et build réussis.

### Lux Order OGS-014 — 28 octobre 2026

- Unité 4 Énergie, 2 Might, arrivée Tap. Première capacité activée ADD :
  `activate-spell-energy` épuise une unité Ready possédant `spellEnergyAbility`.
- Fenêtres de Réaction partagées avec les sorts ; production immédiate, sans pile
  supplémentaire ni changement de priorité. Événement `spell-energy-added`.
- Réserve `spellEnergy` facultative par joueur, dépensée en priorité par les sorts
  uniquement. Les paiements ordinaires la préservent ; End/Draw l'effacent.
- Actions légales : activation proposée et paiements des sorts raccordés.
- TDD : cinq échecs pertinents constatés avant implémentation. Tests coût/Tap,
  restrictions unités/gears/équipement, Power flexible, priorité et fenêtres de
  Showdown, absence de réaction à ADD, expiration et non-mutation.
- Limite : activation explicite du moteur ; pas de bouton dédié ni Lux dans la démo.
  15 cartes complètes, Annie Fury toujours partielle pour les dégâts de capacités.
- Validation complète : `pnpm check`, 278 tests et build réussis.

### Lux Mind OGS-006 — 28 octobre 2026

- Unité 6 Énergie + 1 bleu, 5 Might, arrivée Tap. `onExpensiveSpell` déclenche
  un bonus personnel de +3 Might pour le tour au lancement accepté d'un sort de coût
  imprimé au moins 5 énergie. Le mode de paiement ne modifie pas ce seuil.
- Nouvelle entrée `SpellPlayEntry`, distincte des sorts et des morts : bonus empilé
  au-dessus du sort, réactions avant chaque résolution. Aucun bonus immédiat.
- Sources alliées en jeu, Ready/Tap ou Stun : une entrée par exemplaire. Bonus cumulables,
  expiration habituelle en fin de tour ; source absente à la résolution ignorée.
- TDD : six échecs pertinents observés, puis 13 tests coût/Tap, seuil 4/5/6,
  priorité, réponses, cumul, source disparue, propriétaire, réserves et expiration.
- Limite : ordre automatique des unités pour ces bonus personnels sans choix ;
  un choix d'ordre général des capacités simultanées reste à introduire si nécessaire.
  Aucun branchement UI/deck de démo. 16 cartes complètes, Annie Fury partielle.
- Validation complète : `pnpm check`, 291 tests et build réussis.

### Tibbers OGS-018 et raccordement Annie Fury — 28 octobre 2026

- Tibbers : 8 Énergie, 2 Power rouge/violet (mélange autorisé), 7 Might, arrivée Tap.
  Depuis la main ou zone champion, empile une capacité de mise en jeu indépendante
  de la source. Réactions possibles avant ses dégâts.
- À la résolution : 3 dégâts simultanés à toutes les unités sur tous les champs,
  alliés et Tibbers compris ; bases exclues. Cibles évaluées après les réactions.
- Annie Fury ajoute son bonus à chaque instance de dégâts de capacité ; calcul avant
  les morts, même si Annie meurt dans ces dégâts. Événements `ability-damage`
  distincts des sorts, du combat et des dégâts directs d'unités (duel).
- `powerChoiceAmount` étend le coût flexible (1 par défaut). Paiement automatique
  et manuel, deux runes Tap, réserves flottantes et trois combinaisons testés.
  Les catalogues unité/sort/gear conservent cette quantité.
- TDD : huit échecs initiaux puis un échec sur la conservation des coûts ; 13 scénarios
  couvrent aussi Flash, morts simultanées, pile des effets de mort, source disparue.
- 18 cartes complètes (Annie Fury incluse), 6 restantes. Hors decks de démo.
  Aucun nouveau choix de cible ou d'ordre n'est nécessaire pour cette capacité de zone.
- Validation complète : `pnpm check`, 304 tests et build réussis.
- Tests futurs : cibler les nouveaux comportements et leurs raccordements ; ne pas
  dupliquer par carte les scénarios déjà couverts par les systèmes partagés.

### Annie Chaos OGS-010 — 28 octobre 2026

- 4 Énergie + 1 violet, 3 Might, arrivée Tap. La capacité récupère le sort choisi
  du cimetière vers la main après sa fenêtre de réaction, même si Annie a disparu.
- Choix `returnSpellId` à l'empilement confirmé par l'utilisateur. Actions légales
  raccordées. Refus avant paiement des choix invalides ou omis si un sort est disponible.
- Sans sort récupérable, Annie reste jouable et sa capacité n'a aucun effet ; cible
  devenue illégale ignorée sans remplacement (convention actuelle du prototype).
- TDD : quatre échecs puis quatre scénarios ciblés, dont réaction réelle et chosen champion.
- 19 cartes complètes. Hors decks de démonstration.
- Validation complète : `pnpm check`, 308 tests et build réussis.

### Recruit the Vanguard OGS-015 — 28 octobre 2026

- Action, 6 Énergie : quatre jetons Recrue de Might 1, Tap. `tokenDestinations`
  contient quatre destinations choisies à l'empilement, confirmation utilisateur.
  Base propre ou champs contrôlés, répétitions autorisées ; copie de la liste en pile.
- Actions légales : toutes les répartitions ordonnées sur les destinations autorisées.
  Coût combinatoire limité ici à quatre jetons ; ne pas généraliser sans précaution.
- Extraction de `summonToken` depuis les effets de mort : mêmes identifiants
  déterministes sans collision et même disparition des jetons morts, sans cimetière.
- TDD : cinq échecs initiaux puis six scénarios ciblés, dont Flash faisant perdre le
  contrôle, copie des choix, défense en Showdown et absence de score prématuré.
- Convention héritée : si une destination devient illégale, seule cette invocation est
  ignorée, sans remboursement ni nouvelle destination. Ce n'est pas une nouvelle règle confirmée.
- 20 cartes complètes sur 24 ; seules les quatre légendes restent à implémenter.
  `recruitToken` est une définition de jeton supplémentaire, pas une 25e carte OGS.
  Hors decks de démo ; pas de nouvel écran de choix de cartes/destinations.
- Validation complète : `pnpm check`, 314 tests et build réussis.

### Précision de portée des zones — 28 octobre 2026

- Confirmation utilisateur : chaque battlefield comprend un côté allié et un côté
  ennemi ; un effet de zone peut désigner une ou plusieurs zones concernées.
- Architecture souhaitée : distinguer dégâts de zone et dégâts ciblant une unité,
  en explicitant la portée. Ne pas confondre portée et source (sort/capacité/unité).
- Documentation uniquement : les côtés ne sont pas encore des zones explicites du
  modèle. Préserver l'identité du battlefield pour contrôle, combat et score ; concevoir
  la représentation des côtés lors d'une tranche fonctionnelle qui en a besoin.
- Les cartes actuelles conservent leur comportement : Tibbers touche tous les champs,
  Firestorm les ennemis du champ choisi. Aucun changement du moteur ni nouveau test.
- Vérification : `pnpm check` réussi, 314 tests et build.

### Représentation des côtés et dégâts de zone — 28 octobre 2026

- API publique `BattlefieldSide` (battlefieldId + playerId), `BattlefieldArea`
  (champ entier ou côté), `getBattlefieldSides`, `getUnitLocation` et
  `unitsInBattlefieldAreas`. Côtés présents même vides, indépendants du contrôleur.
- Représentation dérivée de zoneId + ownerId : pas de doublon d'état persistant,
  migration ou identifiant de côté concaténé. Le battlefield parent demeure la
  référence des mouvements, combats, invocations, contrôle et score. En 1v1 une unité
  occupe le côté de son propriétaire ; ni équipes ni position sur le côté adverse.
- `dealAreaDamage` reçoit une union de champs/côtés explicites et une source typée
  sort/capacité. Déduplique les unités, applique les bonus avant les morts ; l'appelant
  conserve le traitement des morts. Champs disparus et côtés inconnus ignorés.
- Firestorm utilise les côtés ennemis du champ choisi ; Tibbers les champs entiers.
  Les dégâts individuels, de combat et de duel gardent leurs traitements distincts.
- TDD : cinq échecs avant ajout de l'API, puis tests des côtés, changement de contrôle,
  déplacements en combat, chevauchement de portées et extensibilité des joueurs.
  Tests existants Firestorm/Tibbers réutilisés pour la compatibilité.
- Limite : représentation moteur et API, pas de modification de l'affichage du plateau.
- Validation complète : `pnpm check`, 319 tests et build réussis.

### Wuju Bladesman OGS-019 — 28 octobre 2026

- Catalogue `legendDefinitions` transmis par createGame ; instances permanentes dans
  cards en zone legend, sans Might/dégâts. Les passifs restent actifs même Tap.
- +2 Might à l'unique défenseur sur le champ du Combat Showdown, jusqu'à sa clôture.
  Aucun bonus en attaque, Open, base, ou si un second défenseur est présent.
- TDD : échec du bonus constaté puis deux scénarios ciblés. 21 cartes complètes.
- Hors démo ; capacités activées de légendes non implémentées sans carte concrète.
- `pnpm check` : 321 tests et build réussis.

### Lady of Luminosity OGS-021 — 28 octobre 2026

- Pioche 1 au lancement accepté d'un sort de coût imprimé 5+, via une entrée de pile
  indépendante. Réactions permises ; défaite par épuisement interrompt la chaîne.
- Passif actif même Tap ; uniquement les sorts du propriétaire. Ordre automatique
  actuel : bonus des unités puis déclenchement de légende empilé au-dessus.
- TDD : échecs initiaux puis trois scénarios ciblés. 22 cartes complètes, hors démo.
- `pnpm check` : 324 tests et build réussis.

### Might of Demacia OGS-023 — 28 octobre 2026

- Après conquête Open ou combat, empile pioche 2 si au moins quatre unités alliées
  sont présentes sur ce champ. Vérifie le seuil à nouveau après les réactions.
- Déclenchement indépendant du gain de point ; pas de déclenchement après victoire.
  Test Flash : retirer des unités avant résolution annule la pioche.
- TDD : deux échecs initiaux puis quatre scénarios ciblés, combat inclus.
- 23 cartes complètes, hors démo.
- `pnpm check` : 328 tests et build réussis.

### Dark Child OGS-017 — 28 octobre 2026

- Fin de tour suspendue : `end-turn.readyRuneIds` choisit les deux runes avant les
  réactions. `pendingTurnEnd` attend fin des piles, morts et Showdowns induits avant
  de nettoyer les ressources/bonus puis démarrer le joueur suivant.
- Choix de min(2, nombre de runes en jeu), sans doublon, runes Ready ou Tap ; celles
  recyclées avant résolution sont ignorées. La légende n'est pas épuisée par son passif.
- Actions légales : combinaisons de runes proposées. Aucun changement des fins de
  tour sans cette légende. Une seule légende par joueur dans la configuration normale.
- TDD : cinq échecs initiaux puis cinq scénarios ; test de création de partie ajouté
  pour le passage du catalogue et les instances Ready sans présence dans units.
- Les quatre légendes OGS sont raccordées : 24 cartes sur 24, hors decks de démo.
  Aucune capacité activée de légende n'a été inventée pour ces quatre passifs.
- `pnpm check` : 334 tests et build réussis.

### Origins : Daring Poro — 28 octobre 2026

- Définition issue du JSON local, 2 Énergie, 2 Might, Assault 1. Réutilise le moteur existant.
- TDD : refus UNKNOWN_UNIT_DEFINITION observé puis scénario de mise en jeu validé.
- Suivi du lot autorisé : docs/cartes-origins.md. Hors decks de démo.
- Validation : pnpm check, 335 tests et build réussis.

### Origins : Petty Officer — 28 octobre 2026

- Définition issue du JSON local, 5 Énergie, 5 Might, Assault 1. Réutilise le moteur existant.
- TDD : refus UNKNOWN_UNIT_DEFINITION observé puis scénario de mise en jeu validé.
- Suivi du lot autorisé : docs/cartes-origins.md. Hors decks de démo.
- Validation : pnpm check, 336 tests et build réussis.

### Origins : Stalwart Poro — 28 octobre 2026

- Définition issue du JSON local, 2 Énergie, 2 Might, Shield 1. Réutilise le moteur existant.
- TDD : refus UNKNOWN_UNIT_DEFINITION observé puis scénario de mise en jeu validé.
- Suivi du lot autorisé : docs/cartes-origins.md. Hors decks de démo.
- Validation : pnpm check, 337 tests et build réussis.

### Origins : Mega-Mech — 28 octobre 2026

- Définition issue du JSON local, 7 Énergie, 8 Might, sans capacité. Réutilise le moteur existant.
- TDD : refus UNKNOWN_UNIT_DEFINITION observé puis scénario de mise en jeu validé.
- Suivi du lot autorisé : docs/cartes-origins.md. Hors decks de démo.
- Validation : pnpm check, 338 tests et build réussis.

### Origins : Mountain Drake — 28 octobre 2026

- 9 Énergie, 10 Might, sans capacité. Réutilise le moteur existant.
- TDD : échec pertinent puis test de raccordement des données imprimées.
- Hors decks de démo ; lot suivi dans docs/cartes-origins.md.
- Validation : pnpm check, 339 tests et build réussis.

### Origins : Playful Phantom — 28 octobre 2026

- 5 Énergie, 5 Might, sans capacité. Réutilise le moteur existant.
- TDD : échec pertinent puis test de raccordement des données imprimées.
- Hors decks de démo ; lot suivi dans docs/cartes-origins.md.
- Validation : pnpm check, 340 tests et build réussis.

### Origins : Vanguard Sergeant — 28 octobre 2026

- 4 Énergie, 4 Might, sans capacité. Réutilise le moteur existant.
- TDD : échec pertinent puis test de raccordement des données imprimées.
- Hors decks de démo ; lot suivi dans docs/cartes-origins.md.
- Validation : pnpm check, 341 tests et build réussis.

### Origins : Falling Comet — 28 octobre 2026

- Action, 5 Énergie, 6 dégâts ciblés sur un battlefield ; réutilise les dégâts de sorts.
- TDD : refus de définition inconnue puis test de coût, résolution et exclusion des bases.
- Hors démo. Validation : pnpm check, 342 tests et build réussis.

### Origins : Ravenbloom Student — 28 octobre 2026

- 2 Énergie, 2 Might. Réutilise le déclenchement de Lux avec seuil zéro : +1 Might
  temporaire à chaque sort joué, via la pile, y compris un sort gratuit.
- TDD : deux échecs pertinents puis tests des coûts 0/2 et de la résolution différée.
- Hors démo. Validation : pnpm check, 344 tests et build réussis.

### Origins : Wielder of Water — 28 octobre 2026

- 3 Énergie, 2 Might, +2 Might seulement seul allié attaquant/défenseur au combat.
- Extension minimale du calcul commun de bonus de combat ; cumul avec Wuju.
- TDD : trois échecs puis tests attaque/défense, renfort, Open, coût et cumul.
- Dix nouvelles cartes livrées pour cette fournée ; questions regroupées dans
  docs/questions-origins.md. Stop à dix conformément à la demande utilisateur.
- Validation : pnpm check, 347 tests et build réussis.

### Réponse groupée Origins : Gust — 28 octobre 2026

- Question 1 confirmée : sortie du terrain = perte dégâts/modificateurs/Stun,
  détachement des équipements en base ; disparition des jetons.
- Gust : contrôle de Might <= 3 à la résolution ; dépassement = effet ignoré.
- Documentation uniquement. Gust reste à implémenter et à tester ; questions 2–5
  encore ouvertes. Pas de nouvelle fournée engagée pendant les réponses.

### Réponses groupées Origins 2–5 — 28 octobre 2026

- Toutes les questions de docs/questions-origins.md sont résolues et reportées dans
  docs/regles.md : here obligatoire malgré absence de contrôle, pioche sans défausse
  si main vide, Dune Drake condition au déclenchement et à la résolution de capacité
  avant dégâts de combat, Stupefy ne remonte pas une Might 0 et fait piocher.
- Documentation uniquement ; ces comportements restent à implémenter et tester.
  La fournée précédente reste à dix cartes, aucune nouvelle carte ajoutée ici.

### Origins fournée 2 : Gust — 28 octobre 2026

- Retour en main commun : retrait des effets, détachement des équipements, disparition des jetons.
- Might maximale revérifiée à la résolution ; contrôle du champ conservé pendant le showdown.
- Trois scénarios ciblés ajoutés en TDD.

- Validation : pnpm check, 350 tests et build réussis.

### Origins fournée 2 : Stupefy — 28 octobre 2026

- Réduction bornée à la résolution, sans relever une unité à 0 ; pioche indépendante.
- TDD : cas Might 0, 1, 2 et 3.

- Validation : pnpm check, 354 tests et build réussis.

### Origins fournée 2 : En Garde — 28 octobre 2026

- +1 Might et bonus supplémentaire si seule unité alliée dans sa zone à la résolution.
- Tests avec ennemi présent et arrivée d'un allié avant résolution.

- Validation : pnpm check, 356 tests et build réussis.

### Origins fournée 2 : Back to Back — 28 octobre 2026

- Sélection obligatoire de deux alliés distincts au lancement, bonus indépendants à la résolution.
- Actions légales raccordées ; tests de sélection et de cible disparue.

- Validation : pnpm check, 359 tests et build réussis.

### Origins fournée 2 : Cannon Barrage — 28 octobre 2026

- Dégâts de zone communs appliqués aux côtés ennemis du combat actif.
- Les autres champs, bases et alliés sont épargnés ; aucun dégât en Open Showdown.

- Validation : pnpm check, 361 tests et build réussis.

### Origins fournée 2 : Morbid Return — 28 octobre 2026

- Récupération depuis la défausse mutualisée avec Annie Chaos ; validation du propriétaire et du type.
- Cible choisie avant réactions, revérifiée à la résolution ; actions légales raccordées.

- Validation : pnpm check, 363 tests et build réussis.

### Origins fournée 2 : Sneaky Deckhand — 28 octobre 2026

- Mise en jeu Tap sur champ entièrement vide en plus des destinations ordinaires.
- Open Showdown avant conquête ; tests de contrôle, destinations refusées et actions légales.

- Validation : pnpm check, 365 tests et build réussis.

### Origins fournée 2 : Noxian Drummer — 28 octobre 2026

- Déclencheurs de mouvement mutualisés, empilés avec fenêtre de réaction ; les mises en jeu ne les déclenchent pas.
- Invocation « here » obligatoire sur le champ annoncé, même adverse. Le cas Gust initialement accepté a été corrigé sur précision utilisateur (voir ci-dessous).
- Réutilise le jeton Recrue et le résolveur d'invocation commun.

- Validation : pnpm check, 368 tests et build réussis.

### Origins fournée 2 : Traveling Merchant — 28 octobre 2026

- Capacité après mouvement, y compris Flash : défausse puis pioche ; main vide = pioche seule.
- Choix obligatoire à la résolution (hypothèse à confirmer), exposé par les actions légales ; aucune réaction entre défausse et pioche.
- Reprise de pile extraite dans continue-stack ; les nouveaux déclencheurs retardent la clôture du combat et le score.
- Correction utilisateur Noxian Drummer : Gust retire la destination « here », donc aucune Recrue. Test inversé, échec constaté puis correction.
- Tests : choix/refus, main vide, Flash avec pile restante, absence de score prématuré.

- Validation : pnpm check, 372 tests et build réussis.

### Origins fournée 2 : Dune Drake — 28 octobre 2026

- Bonus d'attaque via la pile : ennemi Ready requis au déclenchement et à la résolution, avant dégâts.
- Tests de refus en défense/Open/ennemi Tap, réponse ADD, conversion Open vers Combat et second combat sans score intermédiaire.
- Fournee 2 terminée : dix nouvelles cartes, 44/69 entrées demandées raccordées au moteur.
- Questions restantes regroupées dans docs/questions-origins.md : « here » après déplacement interne de Noxian et moment du choix de défausse Merchant.
- Nettoyage de l'encodage de commentaires ajoutés dans cette fournée.

- Validation : pnpm check, 379 tests et build réussis.

### Origins fournée 3 : Body Rune — 28 octobre 2026

- Définition orange et création d'instance pour la préparation des decks. Réutilise Channel et paiement existants.
- Test de contrat : identifiant de définition et couleur transmis au moteur.

- Validation : pnpm check, 380 tests et build réussis.

### Origins fournée 3 : Calm Rune — 28 octobre 2026

- Définition vert, métadonnées et instance compatibles avec Channel/paiement communs.
- Test du contrat de couleur et d'identifiant.

- Validation : pnpm check, 381 tests et build réussis.

### Origins fournée 3 : Chaos Rune — 28 octobre 2026

- Définition violet, métadonnées et instance compatibles avec Channel/paiement communs.
- Test du contrat de couleur et d'identifiant.

- Validation : pnpm check, 382 tests et build réussis.

### Origins fournée 3 : Fury Rune — 28 octobre 2026

- Définition rouge, métadonnées et instance compatibles avec Channel/paiement communs.
- Test du contrat de couleur et d'identifiant.

- Validation : pnpm check, 383 tests et build réussis.

### Origins fournée 3 : Mind Rune — 28 octobre 2026

- Définition bleu, métadonnées et instance compatibles avec Channel/paiement communs.
- Test du contrat de couleur et d'identifiant.

- Validation : pnpm check, 384 tests et build réussis.

### Origins fournée 3 : Order Rune — 28 octobre 2026

- Définition jaune, métadonnées et instance compatibles avec Channel/paiement communs.
- Test du contrat de couleur et d'identifiant.

- Validation : pnpm check, 385 tests et build réussis.

### Origins fournée 3 : Mobilize — 28 octobre 2026

- Channel Tap partagé pour les effets, propriétaire explicite ; pioche seulement si aucune rune ne peut être canalisée.
- Tests pile disponible/vide, effet différé après réactions.

- Validation : pnpm check, 387 tests et build réussis.

### Origins fournée 3 : Stormclaw Ursine — 28 octobre 2026

- Tank transmis à l'unité ; capacité de mise en jeu empilée, puis Channel Tap partagé.
- Tests rune disponible/vide ; aucune pioche de remplacement propre à Mobilize.

- Validation : pnpm check, 389 tests et build réussis.

### Origins fournée 3 : Lecturing Yordle — 28 octobre 2026

- Tank et pioche de mise en jeu via la pile, indépendante de la survie de sa source.
- Test de la fenêtre avant pioche et de la disparition de la source.

- Validation : pnpm check, 390 tests et build réussis.

### Origins fournée 3 : First Mate — 28 octobre 2026

- Cible annoncée à la mise en jeu : une autre unité, alliée ou ennemie ; redressée après réactions.
- Sans autre unité, capacité sans effet. Actions légales raccordées ; refus de l'auto-ciblage.

- Validation : pnpm check, 392 tests et build réussis.

### Origins fournée 3 : Maddened Marauder — 28 octobre 2026

- Tank et choix de déplacement à l'empilement, y compris lui-même s'il entre sur un champ.
- Réutilise Flash pour conserver dégâts/Ready et libérer le contrôle ; cible revérifiée sur battlefield.
- Correction testée : Highlander est un rappel, ne déclenche pas Merchant.

- Validation : pnpm check, 395 tests et build réussis.

### Origins fournée 3 : Mystic Poro — 28 octobre 2026

- Vision après réactions : regard privé du sommet actuel, garder ou recycler au-dessous, puis reprise de pile.
- Deck vide sans pioche ni pénalité ; actions proposées uniquement au propriétaire.
- Tests changement du sommet par réaction, deux choix et deck vide.

- Validation : pnpm check, 398 tests et build réussis.

### Origins fournée 3 : Sai Scout — 28 octobre 2026

- Réutilise Vision et la mise en jeu sur champ entièrement vide.
- Test intégré : choix Vision avant ouverture du Showdown, aucune conquête prématurée.

- Validation : pnpm check, 399 tests et build réussis.

### Origins fournée 3 : Confront — 28 octobre 2026

- Pioche puis arrivées Ready du lanceur pour le tour courant, unités et jetons joués inclus.
- Ne redresse pas les unités déjà présentes et n'affecte pas l'adversaire ; expiration testée.

- Validation : pnpm check, 400 tests et build réussis.

### Origins fournée 3 : Meditation — 28 octobre 2026

- Coût facultatif : Tap un allié Ready dès le lancement pour piocher deux au lieu d'une.
- Choix inclus aux actions légales, paiement atomique ; bonus conservé si l'unité quitte le terrain en réaction.

- Validation : pnpm check, 403 tests et build réussis.

### Origins fournée 3 : Eager Apprentice — 29 octobre 2026

- Réduction cumulable des sorts uniquement depuis les champs, plancher 1 sans augmenter 0 ; paiement automatique raccordé.
- Lux et Lady conservent le coût imprimé pour leur seuil. Tests coût réel, coût imprimé, base/champ et cumul.

- Validation : pnpm check, 408 tests et build réussis.

### Origins fournée 3 : Disintegrate — 29 octobre 2026

- Dégâts à une unité sur champ et pioche conditionnée à sa mort effective par ces dégâts.
- Tests mort, jeton, survie, rappel Highlander et cible déplacée en base avant résolution.

- Validation : pnpm check, 413 tests et build réussis.

### Origins fournée 3 : Singularity — 29 octobre 2026

- Six dégâts simultanés à zéro, une ou deux unités distinctes choisies au lancement.
- Actions légales raccordées, alliés autorisés ; bonus calculés avant toute mort, test avec Annie parmi les cibles.

- Validation : pnpm check, 417 tests et build réussis.

### Origins fournée 3 : Faithful Manufactor — 29 octobre 2026

- Recrue invoquée au lieu de mise en jeu, base ou champ, après réactions.
- Invocation « here » mutualisée avec Noxian : aucun jeton si Gust retire la source ; déplacement interne reste provisoire/documenté.
- Tests base, champ et Gust.

- Validation : pnpm check, 420 tests et build réussis.

### Origins fournée 3 : Pouty Poro — 29 octobre 2026

- Deflect : Power quelconque en supplément par cible adverse, sorts simples/multiples et capacités de mise en jeu ; aucun coût de zone.
- Paiement commun étendu au Power générique et calcul automatique dépendant des cibles, runes Tap acceptées.
- Tests ciblage allié, adverse, deux Poro, coût imprimé conservé, First Mate et dégâts de zone.
- Hypothèse documentée : aucune cible payable pour une capacité obligatoire = capacité sans effet, sans empêcher la mise en jeu.

- Validation : pnpm check, 424 tests et build réussis.

### Origins fournée 3 : Crackshot Corsair — 29 octobre 2026

- Capacité d'attaque uniquement en combat ; choix complets et ordre des sources avant réactions, paiement Deflect atomique.
- Dégâts de sort/capacité mutualisés, avec bonus ; aucune confusion avec combat ou duel.
- Tests ciblage, réactions, source/cible disparue, Open/défense, Deflect et plusieurs Corsairs avec budget partagé.
- Périmètre utilisateur révisé : toutes les cartes sauf quatre battlefields. 21 entrées livrées dans cette fournée, 65/69 au total ; quatre champs volontairement non implémentés.
- Points de règles provisoires conservés dans docs/questions-origins.md ; aucun raccordement supplémentaire aux decks de démonstration.

- Validation : pnpm check, 431 tests et build réussis.

## Limites à conserver lors d'une reprise

- Première capacité de mort implémentée pour les morts de combat et hors combat. Autres déclencheurs,
  nouvelles sources de dégâts et cartes accordant des points restent à ajouter.
  Destination d'invocation devenue illégale : effet ignoré, choix provisoire documenté.
- Autres effets propres aux battlefields, tags légende/champion et limites de copies à compléter.
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

### Trifarian War Camp — 29 octobre 2026

- Catalogue de champs transmis à createGame ; +1 Might local pour tous les camps, indépendant du contrôle.
- TDD : échec 3 au lieu de 4 constaté, puis test de portée et sortie du champ. Validation pnpm check.

### Void Gate — 29 octobre 2026

- +1 dégât de sort/capacité par unité affectée ici, quelle que soit son allégeance ; portée calculée à la résolution. Aucun raccordement aux dégâts de combat/duel.
- TDD : deux échecs pertinents avant implémentation ; vérification des dégâts et événements par cible. Validation pnpm check.

### Fortified Position — 29 octobre 2026

- Choix du défenseur avant réactions, après les choix de l’attaquant ; cible quelconque selon le texte et Deflect payable. Shield 2 uniquement en défense, pendant ce combat.
- Tests Open, résolution différée, Gust/Flash, cible en base, expiration et nouveau combat après réinvocation. Validation pnpm check.

### Startipped Peak et clôture des champs Origins — 29 octobre 2026

- Capacité de tenue sur la pile, puis choix facultatif de Channel une rune Tap à la résolution.
- Beginning suspendu pendant réactions/choix ; reprise unique Channel puis Draw, sans répéter Awaken ni les points de tenue.
- Tests accepter/refuser, pile vide, conquête sans déclenchement, victoire immédiate, perte du contrôle en réaction et deux Peaks tenus.
- Intégration des catalogues testée en BO1 (hasard reproductible parmi trois par joueur) et BO3 (choix avant dés) ; règles existantes de non-réutilisation conservées.
- Vérification complémentaire : Void Gate n’augmente pas les dégâts directs du duel.
- Validation finale : pnpm check, 449 tests et build réussis.
- Bilan : 69/69 entrées demandées raccordées au moteur. Quatre commits de champs, chacun validé et poussé.
- Limite : les nouveaux champs ne sont pas encore ajoutés aux decks de démonstration ; les nouveaux choix sont exposés par act/getLegalActions, sans panneau UI dédié.

### Métadonnées et images locales — 29 octobre 2026

- Tags officiels importés par ID dans les définitions ; listes immuables, consultables par unitTags.
- 70 images locales (69 cartes + Recruit), issues des chemins JSON, incluses au build.
- TDD : tags absents, alias mutable et images manquantes constatés avant implémentation.
- Provenance et limites : docs/metadonnees-cartes.md. Validation pnpm check.

### Champs et cartes illustrées dans la démonstration — 29 octobre 2026

- Démo navigateur passée aux unités réelles orange/jaune, légende et runes illustrées.
- Catalogue de quatre champs, tirage BO1 parmi trois par joueur ; choix des champs pour une première manche d’essai BO3.
- Panneau piloté par getLegalActions : choix Shield, rune facultative, passes de pile et répartition des dégâts. Attaques désormais accessibles dans la démo illustrée.
- Images locales sur main, unités, champion, légende, runes et champs ; agrandissement de la carte sélectionnée et affichage des tags.
- Sous-titres des champions récupérés de la source officielle pour distinguer les versions.
- TDD : quatre nouveaux parcours UI/moteur échouaient avant raccordement ; ajout d’un test des sous-titres.
- Vérification navigateur : rendu des images observé ; vérification des clics limitée par un dialogue natif bloquant l’outil. Parcours BO3/Shield/Peak/combat validés en tests d’intégration.
- Validation : pnpm check, 457 tests et build réussis.
- Limites : petits decks de démonstration, pas encore d’éditeur de deck ni de pilotage UI de toute une série BO3 ; aucune nouvelle règle de légalité des tags ajoutée.

### Retour en base et cartes Tap sur le plateau — 29 octobre 2026

- Déplacement basique Ready champ → base propre autorisé, Tap à l’arrivée, sans coût ni soin. Contrôle libéré seulement si dernier occupant, registre de score conservé.
- Actions légales et dépôt UI proposent aussi la base ; Ganking existant reste obligatoire entre deux champs.
- Unités rendues comme cartes, tournées à 90° quand Tap. Seule la Might effective est en badge ; détails conservés en infobulle et libellé accessible.
- TDD : trois échecs pertinents constatés avant implémentation, puis tests retour/refus/contrôle et rendu de Might après déplacement.
- Ancien test Ganking mis à jour : sa base est désormais une destination autorisée.
- Rendu navigateur vérifié : carte couchée et badge Might, paiement puis pose via clic.
- Validation : pnpm check, 460 tests et build réussis.

### Déplacements groupés avant Showdown — 29 octobre 2026

- Action moteur `move-group` : validation de chaque mouvement dans l'état initial, refus atomique (Tap, destination, doublon, liste vide), puis arrivée simultanée.
- Les capacités d'attaque voient toutes les unités du groupe ; un seul Showdown est ouvert par champ.
- UI : brouillon local via dépôt ou clic, récapitulatif, validation explicite et annulation sans effet. Les cartes restent à leur emplacement réel jusqu'à confirmation.
- Les autres actions sont bloquées pendant la préparation. Une validation crée un seul niveau d'historique, annulable avec le bouton existant.
- Compatibilité : `move` individuel reste disponible ; getLegalActions fournit les mouvements individuels, pas toutes les combinaisons possibles.
- Limite du prototype : plusieurs destinations contestées sont mises en attente et traitées dans l'ordre des premières destinations du plan, via pendingShowdowns. Cet ordre est un choix d'interface, pas une nouvelle règle confirmée.
- TDD : échecs constatés avant implémentation ; cinq tests couvrent attaque groupée/capacités, refus atomique, file de Showdowns, préparation/annulation et plan périmé.
- Validation : pnpm check réussi, 465 tests et build. Navigateur : deux Poro préparés puis confirmés, présents ensemble dans un Open Showdown, un seul ajout à l'historique.

### Plateau compact et decks Proving Grounds — 29 octobre 2026

- Aperçu des mouvements : copie transparente Tap à destination, Might passive calculée dans la projection. Les vrais états/contrôles restent inchangés ; aucune capacité ni réaction simulée par l'aperçu.
- Open et Combat Showdown partagent le même panneau (champ, priorité, passes, actions légales) ; étape dégâts et réactions conservent leurs indications propres.
- Noms des domaines Fury, Calm, Mind, Body, Chaos, Order dans les runes et coûts. Cristaux numérotés de 1 à 8, allumés selon le score, à gauche du joueur du bas et à droite de celui du haut.
- Mise en page à hauteur de fenêtre : plateau/main visibles sans défilement de page, défilement interne pour journal, choix et rangées débordantes. Images des champs en arrière-plan pour ne pas masquer les unités.
- Quatre listes TXT utilisateur importées dans starter-deck-lists.ts ; sélection indépendante pour chaque joueur. Les miroirs sont possibles. Chaque liste contient 40 cartes, une copie de champion est retirée avant le mélange des 39 restantes et des 12 runes.
- Les huit versions de champions appropriées sont explicitement référencées, avec partage d'un tag de légende ; les métadonnées actuelles n'ont pas de tag générique Champion.
- Nouvelle graine issue de crypto.getRandomValues dans main.ts à chaque nouvelle BO1/rechargement ; préparation pure et reproductible avec graine explicite dans starter-session.ts. Dés 19/8 et absence de mulligan restent des simplifications de la démo.
- Battlefield unique fourni par chaque fichier, conformément à la réponse utilisateur. Option moteur battlefieldSelection=provided réservée au BO1 ; les configurations normales conservent trois candidats. Le bouton BO3 conserve sa démonstration fixe antérieure.
- Dark Child : choix des runes de fin de tour désormais exposé pour éviter le blocage du deck Annie, puis fenêtre normale de réactions.
- TDD : échecs pertinents constatés pour aperçu, cristaux/domaines, panneau commun, préparation des decks et fin de tour Annie avant correction. Validation pnpm check : 471 tests, lint/types/format et build réussis.
- Navigateur : absence de débordement de page mesurée en 1280×720 et 1024×600 ; pose, fin de tour Annie, redressement et aperçu Tap observés. Capture locale work/table-apercu-cristaux.png.
- Limites préexistantes : l'interface de dépôt joue encore uniquement les unités ; lancement/ciblage des sorts et certains choix de capacités restent à raccorder, même si les cartes et leurs règles sont présentes dans le moteur. Les listes complètes sont maintenant distribuées, pas seulement les unités. Suite : sélecteurs de cibles et actions de cartes depuis la main.

### Sorts et choix de capacités dans la table — 30 octobre 2026

- Panneau de carte sélectionnée : `cardActions` expose les actions complètes du moteur (cibles, seconde cible du Duel, destinations des Recrues, épuisement, énergie de sort) ; `submitCardAction` refuse un choix périmé sans toucher la partie.
- Main du joueur qui doit agir (`handPlayer`) : réaction du joueur prioritaire, Vision, défausse, effets de mort, capacités d'attaque. Panneau dédié à ces choix obligatoires, carte révélée par Vision, bouton pour rendre la priorité hors Showdown.
- Plusieurs mises en jeu possibles vers une même destination (cibles de capacité) : choix explicite dans le panneau au lieu d'un placement implicite.
- Tests `spell-ui.test.ts` : ciblage/paiement/empilement, refus d'un choix périmé, réaction à une réaction, Duel, Recrues, Vision, défausse, priorité après résolution.
- Vérification : registre npm inaccessible depuis l'environnement de reprise. Tests exécutés hors ligne avec TypeScript 6.0.3/tsx et un équivalent minimal de l'API vitest : 477 tests réussis ; typage du code de production sans erreur. Prettier, ESLint et build Vite non exécutés : `pnpm check` (Docker ou CI) reste à confirmer.

### Journal des sorts et des dégâts — 30 octobre 2026

- Le journal nomme désormais le lancement et la résolution des sorts, les dégâts de sort, de capacité et de duel, les destructions, défausses, invocations de jetons et sorts récupérés en main.
- Les noms sont cherchés dans l'état après puis avant l'action, pour nommer une unité détruite ou un sort parti au cimetière. Aucune règle n'est recalculée par la table.
- TDD : `spell-journal.test.ts` échouait (seule la ligne de paiement apparaissait) avant l'implémentation.
- Vérification hors ligne (même banc que l'étape précédente) : 479 tests réussis, typage sans erreur. `pnpm check` complet reste à confirmer par Docker ou la CI.

### Confirmation de remise à zéro dans la page — 30 octobre 2026

- « Nouvelle partie BO1 » et « Choix BO3 » affichent une confirmation dans le panneau d'action au lieu de `window.confirm`, dont le dialogue natif bloquait les outils d'automatisation du navigateur.
- Pendant la confirmation, la table est figée (clics et glisser-déposer ignorés) jusqu'à « Recommencer » ou « Continuer la partie ». `renderTable` reçoit l'état `PendingReset`.
- TDD : `reset-confirm.test.ts` (rendu BO1/BO3, absence sans demande, plus de `window.confirm`) échouait avant l'implémentation.
- Vérification hors ligne : 483 tests réussis, typage sans erreur. Navigateur (bundle esbuild + Chromium, 1280×720) : panneau affiché, clic sur une carte ignoré, abandon puis confirmation BO3 fonctionnels, aucune erreur de page ni dialogue. `pnpm check` reste à confirmer.

### Vision sans fenêtre de priorité superflue — 30 octobre 2026

- Retour de test manuel : après le placement de la carte vue, le Joueur 2 recevait la priorité et devait « Rendre la priorité ». Le placement termine désormais la résolution : pile vide hors Showdown, aucune priorité rouverte. Dans une pile non vide ou un Showdown, le comportement existant est conservé (Sai Scout ouvre toujours son Showdown).
- Règle ajoutée à `regles.md` comme confirmée par l'utilisateur.
- TDD : nouveau test Mystic Poro observé en échec (priorité « b ») avant la correction de `chooseVision`.
- Question ouverte : après la résolution d'un sort hors Showdown, la priorité revient encore à l'adversaire, conformément à la règle de chaîne actuelle. À aligner si l'utilisateur le souhaite.

### Ciblage par clic sur le plateau — 30 octobre 2026

- Après sélection d'un sort (ou d'une unité dont la mise en jeu cible), les unités et zones ciblables sont surlignées. Un clic choisit la cible ; si le choix devient unique, le sort est payé et empilé immédiatement. Le Duel se cible en deux clics (alliée puis ennemie). Le panneau latéral reste disponible et n'affiche que les options compatibles.
- `targetOptions` et `pickTarget` (session) dérivent les cibles des actions légales du moteur ; aucune règle n'est dupliquée. Cible illégale : message, partie et sélection inchangées.
- Restent au panneau : cibles joueur, listes d'unités (Flash) et destinations des Recrues.
- TDD : `click-target.test.ts` échouait (API absente) avant l'implémentation. Banc hors ligne : 487 tests, typage sans erreur.

### Dark Child depuis le bouton de fin de tour — 30 octobre 2026

- Le panneau annexe de fin de tour est retiré. « Terminer le tour » reste actif : avec Dark Child, un premier clic ouvre la sélection, les runes se cliquent sur la rangée du joueur, puis le bouton (« Valider · n / 2 runes ») termine le tour. « Annuler » quitte la sélection.
- Bouton « Auto » sous la légende (par joueur, état local de l'interface) : redresse automatiquement 2 runes, Tap d'abord puis Ready, dans l'ordre du plateau.
- API de session : `endTurnRuneChoice`, `autoEndRunes`, `endTurn` (refus sans modification si le choix est incomplet). Le moteur n'a pas changé ; la fenêtre de réactions de l'effet est conservée.
- TDD : `annie-end-turn.test.ts` échouait (API absente) ; l'ancien test du panneau Dark Child a été adapté à la nouvelle demande. Banc hors ligne : 491 tests, typage sans erreur. Navigateur : sélection de deux runes et validation, sans erreur ni dialogue.

### Utilisation manuelle des runes — 30 octobre 2026

- Moteur : actions `tap-rune` (rune Ready -> Tap, +1 énergie) et `recycle-rune` (rune en jeu -> sous le deck de runes, +1 Power de sa couleur, +1 énergie si elle était Ready), avec l'événement `rune-used`. Production ADD : aucune pile, fenêtre d'une Réaction (`canUseTiming`). Autorisées pendant une pile, comme l'énergie de sort. Non énumérées par `getLegalActions`, pour ne pas multiplier les candidats ; `act` les valide.
- Le paiement automatique consomme déjà la réserve flottante : une rune tapée à la main évite d'en mobiliser une autre.
- Table : clic sur une rune = Tap ; clic droit = recyclage. Info-bulle explicative, journal (« Tap une rune », « recycle une rune : +1 Power Order »), annulation possible. En mode de sélection Dark Child, le clic sert au choix des runes.
- `domainName` déplacé dans la session pour nommer les domaines aussi dans le journal.
- TDD : `manual-runes.test.ts` (moteur, 4 échecs constatés avant le raccordement à `act`) et `apps/table/src/manual-runes.test.ts` (API absente). Banc hors ligne : 499 tests, typage sans erreur. Navigateur : Tap puis recyclage, réserve « 2 énergie · 1 Order Power », aucune erreur.
- Règle de production manuelle ajoutée à `regles.md`, confirmée par l'utilisateur.

### Parcours de la défausse — 30 octobre 2026

- Les deux piles « Défausse » sont des boutons : un clic ouvre dans le panneau la défausse (publique) du joueur, carte la plus récente en premier, avec illustrations, noms et texte en info-bulle. « Fermer » ou un second clic la referme. Lecture seule, sans effet sur la partie.
- `TableUi.graveyard` porte l'état local d'affichage.
- TDD : `graveyard.test.ts` (3 échecs avant implémentation). Navigateur : ouverture et fermeture sans erreur.

### Outillage de vérification hors Docker — 30 octobre 2026

- Cause identifiée : dans l'environnement cloud de Claude, `registry.npmjs.org` était exclu du proxy (liste NO_PROXY) alors que la résolution DNS directe y est impossible. En forçant le passage par le proxy, l'installation fonctionne : Node 24.22.1 et pnpm 11.25.0 comme le Dockerfile, puis `pnpm install --frozen-lockfile` et `pnpm check` complet (format, lint, types, vitest, build Vite) avant chaque commit.
- Historique réécrit à la demande de l'utilisateur : chaque commit de la série du 30 octobre a été rejoué avec son format corrigé et vérifié (format, lint, types, tests du banc) ; les commits de correction et le lien `node_modules` commité par erreur ont disparu. Règle de travail : toutes les vérifications passent avant le commit, la CI n'est qu'un contrôle de sécurité.

### Priorité hors Showdown après une chaîne — 30 octobre 2026

- Précision utilisateur : en Main, l'adversaire n'a jamais la priorité pour jouer des Actions, seulement des Réactions pendant une pile. Une chaîne résolue hors Showdown rend donc la priorité au joueur actif (`continueStack`) ; en Showdown, l'adversaire de l'initiateur la reçoit comme avant. La résolution de Vision n'ouvre pas de fenêtre ; seule sa mise sur la pile en ouvre une.
- Le cas particulier ajouté plus tôt pour Vision est retiré : la règle générale le couvre. La « question ouverte » de l'étape Vision est ainsi tranchée. `regles.md` mis à jour.
- Tests adaptés à la règle précisée (sorts de test, Lux Mind, Confront, Recruit the Vanguard, table) : ils supposaient une passe du Joueur 2 après chaque chaîne hors Showdown.
- Vérifié avant commit : Prettier, ESLint, tsc et 502 tests du banc ; vitest et build par la CI.

### « Jouer un sort » = sort résolu — 30 octobre 2026

- Précision utilisateur : un sort est joué une fois validé et non contré. Lady of Luminosity, Lux OGS-006 et Ravenbloom Student (choix confirmé pour les trois) se déclenchent à la résolution du sort, plus au lancement. `spellPlayedTriggers` calcule ces déclenchements dans `passStack` après `resolveSpell`, sur le coût imprimé ; la légende est empilée en dernier et se résout donc en premier. Chaque déclenchement ouvre sa fenêtre de Réaction.
- Conséquence : la pioche de Lady a lieu alors que le sort est déjà en défausse. Sur deck vide, la défausse (sort compris) est recyclée avec la pénalité habituelle ; la défaite n'intervient que si deck et défausse sont vides.
- Hypothèse conservée : un sort résolu sans effet (cible disparue) reste « joué » ; aucune carte ne contre encore un sort.
- Tests Lady, Lux, Ravenbloom et Eager Apprentice réécrits selon la règle ; Lady échouait d'abord sur la nouvelle attente. `pnpm check` complet passé avant commit.

### Défausse consultable dans tous les contextes — 30 octobre 2026

- Retour de test : avec la défausse ouverte puis un déplacement préparé, « Fermer » était ignoré (filtre des boutons pendant la préparation des déplacements). L'ouverture et la fermeture de la défausse sont maintenant traitées avant ces filtres : elles fonctionnent pendant un déplacement, une sélection de runes ou un ciblage, sans toucher à la partie.
- Correctif voisin : activer « Auto » pendant une sélection manuelle des runes de Dark Child quitte cette sélection, ce qui réactive le bouton de fin de tour.
- Vérifié dans le navigateur (Chromium) : défausse ouverte avant et après la préparation d'un déplacement, puis fermée ; « Auto » activé en cours de sélection puis fin de tour. `pnpm check` complet avant commit.

### Runes affichées comme des cartes — 31 octobre 2026

- Demande utilisateur : runes reconnaissables à leur apparence. Chaque rune est maintenant sa seule illustration, entourée d'une bordure à la couleur de son domaine (Fury rouge, Calm vert, Mind bleu, Body orange, Chaos violet, Order jaune), sans texte. Une rune Tap pivote de 90° comme les unités, dans un emplacement carré qui évite les chevauchements.
- Le nom du domaine et l'état restent dans le libellé accessible et l'info-bulle (« Rune Body · Ready »). Le test des domaines vérifie ce libellé au lieu du texte visible demandé auparavant.
- TDD : `rune-display.test.ts` (2 échecs avant implémentation). Navigateur : 1280×720 et 1024×600 sans débordement, rune Ready et rune Tap visibles. `pnpm check` complet avant commit.

### Mulligan dans la table — 31 octobre 2026

- La partie BO1 de la table s'ouvre sur le mulligan (règle existante du moteur : 0 à 2 cartes sous le deck sans mélange, puis autant de pioches ; le premier tour démarre après le dernier choix). Le premier joueur choisit d'abord, puis le second ; la main affichée est celle du joueur qui choisit.
- Un clic marque ou démarque une carte (2 au plus, carte abaissée et grisée avec un repère ↺). Le bouton indique « Garder ma main » ou « Remplacer n cartes ». Journal : « remplace n carte(s) sous son deck » / « garde sa main ». Annulation possible.
- API de session : `mulliganPlayer`, `confirmMulligan` ; `prepareDemo(state, stopAtMulligan)` et `createStarterSession(seed, { mulligan })`. Les fixtures de test et la manche d'essai BO3 gardent leurs mains, comme avant.
- TDD : `mulligan.test.ts` (4 échecs avant implémentation). Navigateur : marquage limité à 2, remplacement, passage au Joueur 2, début du tour avec 5 cartes, aucune erreur. `pnpm check` complet avant commit.

### Ciblage « Lancer, cibles, Valider » et défausse au clic — 31 octobre 2026

- Retours de test : Singularity trop complexe (toutes les combinaisons listées), préférence pour un bouton « Lancer », une sélection des cibles à la souris puis une validation. Le sort sélectionné propose « Lancer » ; les cibles légales ne sont surlignées qu'ensuite. Chaque clic ajoute ou retire une cible (Duel : alliée puis ennemie ; Singularity, Flash : jusqu'au maximum, dans n'importe quel ordre), puis « Valider » paie et empile. Un clic sur une unité non ciblable affiche un message sans quitter le ciblage. Les options restantes (cibles joueur, destinations des Recrues, coûts optionnels) restent dans « Toutes les options » ou s'affichent à la validation.
- Le dépôt d'une unité dont la mise en jeu cible ouvre ce même mode ciblage. Les unités de la base adverse sont désormais ciblables à la souris.
- Traveling Merchant : pendant la défausse imposée, les cartes de la main sont surlignées et un clic défausse la carte.
- API : `startTargeting`, `toggleTarget`, `confirmTargets`, `discardFromHand` ; `pickTarget` (lancement automatique au premier clic) est remplacé.
- TDD : `click-target.test.ts` réécrit (5 échecs avant implémentation), `discard-click.test.ts` (3 échecs). Navigateur sur une table de test : Singularity (deux cibles, retrait, validation), Duel (refus de l'ennemie en premier, puis validation), défausse au clic. `pnpm check` complet avant commit.

### Extension Origins complète — à partir du 31 octobre 2026

Demande utilisateur : implémenter les cartes restantes de `ListeCartes/OGN - Origins/cartes.json`, une par commit. Chaque carte reçoit définition, métadonnées officielles (nom, tags), image locale, test moteur ; `pnpm check` complet passe avant chaque commit. Liste tenue dans `cartes-origins.md`.

- Shipyard Skulker (ogn-175) : unité sans capacité.
- Hextech Ray (ogn-009) : 3 dégâts à une unité sur un champ (effet de dégâts existant).
- Void Seeker (ogn-024) : 4 dégâts à une unité sur un champ puis pioche 1, même si la cible meurt.
- Primal Strength (ogn-154) : +7 Might à une unité quelconque jusqu'à la fin du tour.
- Rune Prison (ogn-050) : Stun d'une unité quelconque jusqu'à la fin du tour.
- Discipline (ogn-058) : Réaction, +2 Might jusqu'à la fin du tour puis pioche 1.
- Smoke Screen (ogn-093) : Réaction, -4 Might jusqu'à la fin du tour, minimum 1.
- Progress Day (ogn-114) : sort normal, pioche 4.
- Sunlit Guardian (ogn-054) : Shield et Tank.
- Catalyst of Aeons (ogn-138) : canalise 2 runes Tap, pioche 1 si moins de 2 ont pu l'être. L'option `drawIfEmpty` devient `drawIfShort` (pioche si moins de runes que demandé), sans changement pour Mobilize.
- Vengeance (ogn-229) : sort normal, tue une unité quelconque (base comprise).
- Rebuke (ogn-172) : renvoie en main une unité sur un champ, sans limite de Might.
- Grand Strategem (ogn-233) : +5 Might à toutes les unités alliées jusqu'à la fin du tour.
- Challenge (ogn-128) : duel entre une unité alliée et une ennemie choisies au lancement, sans bonus.
- Whiteflame Protector (ogn-082) : nouvel effet générique `onPlayTargetEffect` (cible d'unité choisie à la mise en jeu, restrictions allié/ennemi/champ/soi-même, effets Might, dégâts de capacité, Stun, destruction, renvoi en main). Ici +8 Might à une unité, lui-même compris ; cible disparue = aucun effet.
- Riptide Rex (ogn-092) : à la mise en jeu, 6 dégâts à une unité ennemie sur un champ.
- Solari Shieldbearer (ogn-051) : à la mise en jeu, Stun d'une unité jusqu'à la fin du tour.
- Harnessed Dragon (ogn-234) : à la mise en jeu, tue une unité ennemie ; sans ennemi, aucun effet.
- Zaunite Bouncer (ogn-188) : à la mise en jeu, renvoie en main une autre unité sur un champ.
- Solari Chief (ogn-225) : à la mise en jeu, une unité ennemie est tuée si elle est Stun, sinon Stun (variante `kill-if-stunned-else-stun`, état évalué à la résolution).
- Carnivorous Snapvine (ogn-149) : à la mise en jeu, duel avec une unité ennemie sur un champ (variante `fight` ; source disparue = aucun dégât).
- Watchful Sentry (ogn-096) : Deathknell, pioche 1. `DeathEffect` devient une union (jeton, pioche, canalisation Tap, jetons en base, dégâts sur le champ de la mort) ; seule l'invocation d'un jeton choisit une destination, les autres effets utilisent conventionnellement la base. La zone de la mort est conservée dans le déclenchement.
- Soaring Scout (ogn-216) : Deathknell, canalise 1 rune Tap.
- Machine Evangel (ogn-239) : Deathknell, trois Recrues de 1 Might dans la base du propriétaire.
- Kog'Maw (ogn-190) : Deathknell, 4 dégâts de capacité à toutes les unités du champ où il est mort (aucun effet s'il meurt en base).
- Seal of Rage (ogn-040) : capacité ADD des gears (`resourceAbility`, action `activate-gear`) : Tap, +1 Power Fury dans la réserve, sans pile, dans une fenêtre de Réaction. Les gears reçoivent désormais leurs métadonnées imprimées (image, tags).
- Seal of Focus (ogn-081) : Tap, +1 Power Calm (capacité ADD de gear).
- Seal of Insight (ogn-120) : Tap, +1 Power Mind (capacité ADD de gear).
- Seal of Strength (ogn-163) : Tap, +1 Power Body (capacité ADD de gear).
- Seal of Discord (ogn-204) : Tap, +1 Power Chaos (capacité ADD de gear).
- Seal of Unity (ogn-245) : Tap, +1 Power Order (capacité ADD de gear).
- Energy Conduit (ogn-098) : Tap, +1 énergie (capacité ADD de gear).
- Gears dans la table : un gear en main se pose via le panneau (« Poser en base »), les gears en jeu s'affichent dans leur zone comme des cartes couchées à 90° quand ils sont Tap, et un clic active un gear de ressource (Seals, Energy Conduit) ; les autres gears se sélectionnent pour afficher leurs options d'équipement. Journal : pose, équipement, ressource. Vérifié dans le navigateur (pose puis activation de Seal of Rage).
- Anivia (ogn-148) : en attaquant, 3 dégâts de capacité à toutes les unités ennemies du champ (nouveau mode d'`AttackEntry`, ennemis évalués à la résolution).
- Warwick (ogn-159) : arrive Ready ; en attaquant, tue toutes les unités ennemies blessées du champ.
- Ahri (ogn-066) : « When I hold » — capacité d'unité empilée après une tenue scorée sur son champ (`onHoldScore`), +1 point d'effet de carte (`awardPoints`, événement `points-gained`, victoire immédiate possible).
- Legion Rearguard (ogn-010) : mécanique Accelerate (`accelerate` sur la définition, option `accelerate` de `play-unit` : +1 énergie et +1 Power du domaine, arrivée Ready). Les actions légales proposent les deux variantes quand elles sont payables ; la table l'indique dans le libellé.
- Blazing Scorcher (ogn-001) : Accelerate (Fury).
- Draven (ogn-028) : +1 Might par point de son propriétaire (`mightPerOwnPoint`).
- Captain Farron (ogn-015) : les autres unités alliées de sa zone ont Assault (`otherAlliesHereAssault`). Hypothèse documentée : un Assault accordé s'ajoute à l'Assault imprimé.
- Taric (ogn-074) : Shield, Tank ; les autres unités alliées de sa zone ont Shield.
- Tasty Faefolk (ogn-075) : Accelerate (Calm) ; Deathknell, canalise 2 runes Tap puis pioche 1 (option `draw` de l'effet de mort de canalisation).
- Thousand-Tailed Watcher (ogn-116) : Accelerate (Mind) ; à la mise en jeu, -3 Might jusqu'à la fin du tour à toutes les unités ennemies, minimum 1 (effet de mise en jeu `weaken-enemies`).
- Leona (ogn-238) : Shield ; en attaquant, Stun d'une unité ennemie du champ choisie avant réactions (`onAttackTargetEffect`, choix d'attaque étendus aux effets stun et dégâts égaux à la Might).
- Yasuo (ogn-076) : en attaquant, dégâts égaux à sa Might (à la résolution) à une unité ennemie du champ.
- Kai'Sa (ogn-039) : Accelerate (Fury) ; « When I conquer », pioche 1 (`onConquerDraw`, capacité d'unité empilée après la conquête comme celles des légendes).
- Flurry of Blades (ogn-133) : Réaction, 1 dégât de sort à toutes les unités sur les champs (effet `damage-all-at-battlefields` ; ajout de `exhaust-allies` pour Unchecked Power).
- Unchecked Power (ogn-123) : épuise les unités alliées puis 12 dégâts à toutes les unités sur les champs.
- Cleave (ogn-004) : Assault 3 jusqu'à la fin du tour (modificateur temporaire `assault`, compté seulement en attaque).
- Ride the Wind (ogn-173) : déplace une unité alliée (sans exiger Ready) puis la redresse (effet `ready-unit`).
- Charm (ogn-043) : déplace une unité ennemie (nouvelle restriction de cible `allegiance: 'enemy'` pour les sorts).
- Siphon Power (ogn-266) : Réaction ; sur un champ choisi, +1 Might aux alliés et -1 aux ennemis (minimum 1) jusqu'à la fin du tour (effet `modify-battlefield-sides`).
- Last Breath (ogn-260) : redresse une unité alliée qui inflige sa Might à une unité ennemie sur un champ, sans réciproque (effet `strike`).
- Thermo Beam (ogn-022) : détruit tous les équipements en jeu, posés ou attachés (effet `kill-all-gear`, helper `killGears`, event `gear-killed`).
- Salvage (ogn-224) : Action ; détruit facultativement un équipement (cible `optional-gear`, le lanceur pour s'abstenir) puis pioche 1 ; les gears deviennent cliquables en mode ciblage.
- Falling Star (ogn-029) : deux instructions « inflige 3 à une unité » (effet `damage-instances`, cibles multi-ensemble : la même unité peut être choisie deux fois, aussi au clic dans la table).
- Wind Wall (ogn-064) : Réaction ; contre un sort de la pile (cible `stack-spell` avec plafonds de coût optionnels, effet `counter-spell`, event `spell-countered`). Le sort contré n'est pas « joué » (pas de déclenchement). Dans la table, le sort contré se choisit au panneau.
- Defy (ogn-045) : Réaction ; contre un sort coûtant au plus 4 énergie et 1 Power (plafonds `maxEnergy`/`maxPower` de la cible `stack-spell`).
- Find Your Center (ogn-047) : Action ; pioche 1 et canalise 1 rune Tap ; coûte 2 énergie de moins si un adversaire est à 3 points ou moins de son seuil de victoire (`costReduction` de sort, `spellCost` prend désormais la définition).
- Sky Splitter (ogn-014) : Action ; 5 dégâts à une unité sur un champ ; énergie réduite de la plus haute Might parmi ses unités (`costReduction: highest-own-might`, plancher 0).
- Zenith Blade (ogn-262) : Action ; étourdit une unité ennemie sur un champ puis peut y déplacer une unité alliée (effet `move-ally-to-target`, seconde cible facultative ; déplacement par sort factorisé dans `moveUnit`).
- Stormbringer (ogn-250) : unité alliée en base (nouvelle restriction de cible `zone: 'base'`) ; sa Might en dégâts à toutes les unités ennemies d'un champ choisi, puis elle s'y déplace (effet `might-damage-enemies-then-move`).
- Invert Timelines (ogn-201) : chaque joueur défausse sa main puis pioche 4, lanceur d'abord (effet `discard-hands-then-draw`).
- Bullet Time (ogn-268) : Action ; coût X (`variablePower`, champ d'action `xPower`, payé en Power quelconque) pour X dégâts aux unités ennemies d'un champ ; X proposé au panneau (« X = n »).
- Ahri (ogn-119) : en attaquant ou en défendant, -2 Might (minimum 1) à une unité ennemie ici (`onAttackTargetEffect` de type `weaken` avec `defendToo` ; les défenseurs présents au début du combat déclenchent aussi).
- Deadbloom Predator (ogn-161) : Deflect ; peut être joué sur un champ occupé par l'ennemi, ce qui lance un combat à l'arrivée (`canPlayToOccupiedEnemyBattlefield`).
- Darius (ogn-243) : Legion (entre Ready si une autre carte a été jouée ce tour ; compteur `cardsPlayedThisTurn` tenu par `act`, remis à zéro au tour suivant) et +1 Might aux autres alliés de sa zone.
- Jinx (ogn-030) : Accelerate, Assault 2 ; à la mise en jeu, défausse 2 cartes choisies (`onPlayEffect` `discard` ; `pendingDiscard` généralisé avec `remaining`/`draw`, le loot reste le cas par défaut).
- Undercover Agent (ogn-178) : Deathknell — défausse 2 cartes choisies puis pioche 2 (DeathEffect `discard-draw`, via `startDiscard`).
- Ekko (ogn-110) : Accelerate ; Deathknell — se recycle (cimetière -> sous le deck) pour redresser les runes de son propriétaire (DeathEffect `recycle-self-ready-runes`, appliqué automatiquement).
- Kayn (ogn-189) : Ganking ; ne subit aucun dégât après deux déplacements dans le tour (compteur `movesThisTurn` tenu par `act` à partir des événements `unit-moved`, remis à zéro en fin de tour ; `preventsDamage` appliqué au combat, aux dégâts d'effet, aux duels et aux frappes).
- Fiora (ogn-232) : tant qu'elle est Mighty (5+ Might), Deflect, Ganking et Shield 1 (`mightyKeywords`, helper `hasKeyword` utilisé par le déplacement et Deflect ; le Shield conditionnel est évalué sans lui-même).
- Chemtech Enforcer (ogn-003) : Assault 2 ; à la mise en jeu, défausse 1 (réutilise `onPlayEffect` `discard`).
- Jeweled Colossus (ogn-086) : Vision et Shield (mots-clés existants).
- Retreat (ogn-104) : Réaction ; renvoie une unité alliée en main puis canalise 1 rune Tap (effets existants).
- Noxus Hopeful (ogn-012) : Legion — coûte 2 énergie de moins (`legionEnergyReduction`, helper `unitCost` partagé par l'action et les actions légales ; corrige au passage le plan de paiement proposé pour Accelerate).
- Scrapyard Champion (ogn-020) : Legion — à la mise en jeu, défausse 2 puis pioche 2 (`discard` avec `draw` et condition `legion`).
- Dangerous Duo (ogn-016) : Legion — à la mise en jeu, +2 Might à une unité ce tour (`onPlayTargetEffect.legion`).
- Kadregrin the Infernal (ogn-038) : à la mise en jeu, pioche 1 par unité alliée Mighty, comptée à la résolution (`onPlayEffect` `draw-per-mighty`).
- Magma Wurm (ogn-011) : tant qu'il est en jeu, les autres unités alliées (jetons compris) entrent Ready (`otherAlliesEnterReady`, helper `alliesEnterReady`).
- Leona (ogn-079, Calm) : entre Ready si un adversaire est à 3 points de la victoire (`entersReadyIfOpponentWithin`) ; les ennemis Stun de sa zone ont -8 Might, minimum 1 (`stunnedEnemiesHereMalus`, appliqué en fin de `effectiveMight`).
- Pit Crew (ogn-091) : se redresse quand son propriétaire joue un gear (`readyOnGearPlayed`).
- Convergent Mutation (ogn-108) : Réaction ; ce tour, la Might d'une unité alliée monte à celle d'une autre unité alliée, sans baisse (effet `match-ally-might`, seconde cible alliée).
- Darius (ogn-027, Fury) : à la deuxième carte jouée du tour par son propriétaire, +2 Might ce tour et se redresse (`onSecondCardPlayed`, appliqué par `act`).
- Last Stand (ogn-069) : Action ; double la Might d'une unité alliée ce tour et lui donne Temporary (nouveau mot-clé : `temporary` sur l'unité, tuée au début de la Beginning de son contrôleur, avant le score).
- Sprite Mother (ogn-106) : à la mise en jeu, joue ici un jeton Sprite 3 Might Ready et Temporary (jeton `token-sprite`, champ `temporary` des définitions appliqué par `summonToken`).
- Brynhir Thundersong (ogn-026) : à la mise en jeu (après réactions), les adversaires ne peuvent plus jouer de carte ce tour (`playLockedPlayers`, refus `PLAY_LOCKED` dans `act`).
- Raging Firebrand (ogn-031) : à la mise en jeu, le prochain sort joué ce tour coûte 5 énergie de moins (`nextSpellDiscount`, appliqué par `spellCost` et consommé au lancement).
- Raging Soul (ogn-019) : Assault et Ganking si son propriétaire a défaussé une carte ce tour (`discardedThisTurn` tenu par `act` depuis les événements `card-discarded`).
- Sona (ogn-073) : sur un champ, redresse 4 runes alliées à la fin du tour de son propriétaire, via la pile, Tap d'abord sans choix (`readyRunesAtEndAtBattlefield`, entrée `legend-ready-runes` réutilisée).
- Dr. Mundo (ogn-109) : +1 Might par carte de son cimetière (`mightPerTrashCard`) ; au début de sa Beginning, recycle ses 3 plus anciennes cartes de cimetière (`recycleTrashAtBeginning`, sans choix).
- Pit Rookie (ogn-136) : à la mise en jeu, buffe une autre unité alliée. Nouveau mécanisme Buff : `buffed` sur l'unité (+1 Might permanent, au plus un), helpers `buffUnit` / `spendBuff` ; la table l'indique dans l'infobulle (avec Temporary).
- Bilgewater Bully (ogn-125) : Ganking tant qu'il est buffé (`buffedGanking`).
- Wizened Elder (ogn-065) : +1 Might supplémentaire tant qu'il est buffé (`buffedExtraMight`).
- Trifarian Gloryseeker (ogn-217) : Legion — se buffe à la mise en jeu (`onPlayEffect` `buff-self`).
- Peak Guardian (ogn-223) : se buffe puis, sur un champ, buffe les autres alliés de ce champ (`buff-self` avec `alliesHere`).
- Sett (ogn-240, Order) : Tank ; +1 Might par unité alliée buffée de son champ (`mightPerBuffedAllyHere`).
- Lee Sin (ogn-151, Body) : Accelerate ; les autres alliés buffés de son champ ont +2 Might (`otherBuffedAlliesHereMight`).
- Cithria of Cloudfield (ogn-139) : se buffe quand son propriétaire joue une autre unité (`buffOnAllyPlayed`, sans pile).
- Yasuo (ogn-205, Chaos) : Ganking ; à son troisième déplacement du tour, son propriétaire marque 1 point (`scoreOnThirdMove`, via `movesThisTurn` et `awardPoints`).
- Rhasa the Sunderer (ogn-195) : coûte 1 énergie de moins par carte de son cimetière (`energyReductionPerTrashCard` dans `unitCost`).
- Rhasa the Sunderer (ogn-195) : coûte 1 énergie de moins par carte de son cimetière (`energyReductionPerTrashCard` dans `unitCost`).
- Spoils of War (ogn-144) : Réaction ; pioche 2 ; coûte 2 de moins si une unité ennemie est morte ce tour (`enemyDeathsThisTurn` tenu par `act`, `costReduction` `enemy-died-this-turn`).
- Unyielding Spirit (ogn-145) : Réaction ; empêche tous les dégâts de sort et de capacité ce tour (`effectDamagePrevented`, appliqué par `dealEffectDamage` et la frappe).
- Cemetery Attendant (ogn-165) : à la mise en jeu, récupère une unité de son cimetière (`onPlayReturnUnit`, entrée `return-spell` généralisée avec `cardKind`).
- Jinx (ogn-202, Chaos) : quand son propriétaire défausse (une fois par action), se redresse et gagne +1 Might ce tour (`onOwnerDiscard`, appliqué par `act`).
- Vanguard Captain (ogn-218) : Legion — à la mise en jeu, deux jetons Recrue 1 ici (`onPlaySummonHereCount`, `onPlaySummonHereLegion`).
- Herald of Scales (ogn-140) : les Dragons de son propriétaire coûtent 2 énergie de moins, minimum 1 (`dragonEnergyReduction`, tag imprimé Dragon, dans `unitCost`).
- Imperial Decree (ogn-221) : Action ; ce tour, toute unité qui subit des dégâts est tuée (`damageBaseline` relevé au décret, helper `isLethal` utilisé par les morts et le combat).
- Correction des coûts hybrides (symbole de Power bicolore, cf. illustration) : Last Breath, Zenith Blade et Stormbringer coûtent 2 Power au choix parmi leurs deux domaines, Siphon Power 1 Power Mind ou Order (`powerChoice`).
- Noxian Guillotine (ogn-254) : Action, Power hybride Fury/Order ; la cible meurt la prochaine fois qu'elle subit des dégâts ce tour (`killOnDamageAbove`, effacé en fin de tour), ou aussitôt avec Legion.
- Dragon's Rage (ogn-258) : Power hybride Calm/Body ; déplace une unité ennemie puis elle et une autre unité ennemie déjà à destination s'infligent leur Might (effet `fight-at-destination`, helper `destinationFoe`).
- Showstopper (ogn-270) : Power hybride Body/Order ; buffe un allié de sa base puis le déplace sur un champ (effets `buff-unit` et `move-to-battlefield`).
- Mask of Foresight (ogn-060) : gear ; une unité alliée seule de son camp au combat a +1 Might (portée de gear `alone-in-combat`).
- Windswept Hillock (ogn-297) : champ ; les unités présentes ont Ganking (`grantsGanking`, pris en compte par `hasKeyword`).
- Vilemaw's Lair (ogn-295) : champ ; aucune unité ne peut se déplacer d'ici vers une base, par mouvement ou par sort (`noMoveToBase`).
- Back-Alley Bar (ogn-277) : champ ; une unité qui s'en déplace gagne +1 Might ce tour (`moveOutMightBonus`, appliqué par `act` avec le compteur de déplacements).
- Grove of the God-Willow (ogn-280) : champ ; le tenir fait piocher 1 via la pile (`holdDraw`, entrée `legend-draw`).
- Altar to Unity (ogn-275) : champ ; le tenir joue une Recrue 1 dans la base du contrôleur via la pile (`holdSummonBase`, effet `summon-base`).
- Aspirant's Climb (ogn-276) : champ ; il faut 1 point de plus pour gagner tant qu'il est en jeu (`victoryTargetBonus`, helper `victoryTarget` désormais utilisé par tous les calculs de victoire et par la table).
- Zaun Warrens (ogn-298) : champ ; le conquérir fait défausser 1 puis piocher 1 via la pile (`conquerLoot`, entrée de loot existante).
- Targon's Peak (ogn-289) : champ ; le conquérir fait redresser 2 runes à la fin du tour, via la pile (`endTurnReadyRunes`, Tap d'abord).
- The Grand Plaza (ogn-293) : champ ; le tenir avec 7 unités alliées ou plus fait gagner la partie (`holdWinUnits`, résultat `GRAND_PLAZA`, appliqué sans pile).
- The Arena's Greatest (ogn-290) : champ ; au début de la première Beginning de chaque joueur, il gagne 1 point (`firstBeginning`, registre `firstBeginningDone`).
- Obelisk of Power (ogn-284) : champ ; au début de la première Beginning de chaque joueur, il canalise 1 rune (`firstBeginning: 'channel'`).
- Navori Fighting Pit (ogn-283) : champ ; le tenir buffe une unité alliée ici via la pile, choisie automatiquement (sans buff d'abord) (`holdBuffHere`).
- Scrapheap (ogn-182) : gear ; posé, défaussé ou détruit, son propriétaire pioche 1 (`drawOnPlayDiscardOrKill`, appliqué par `act` sans pile).
- Iron Ballista (ogn-017) : gear qui entre Tap (`entersExhausted`) ; Tap : 2 dégâts à une unité sur un champ, via la pile. Nouveau mécanisme `tapAbility` des gears (cible, coût éventuel, effet ciblé ; à son tour hors Showdown), énuméré par les actions légales et proposé dans la table en sélectionnant le gear.
- Orb of Regret (ogn-090) : gear ; Tap — une unité a -1 Might ce tour, minimum 1 (`tapAbility` `modify-might`).
- Arena Bar (ogn-124) : gear ; Tap — buffe une unité alliée Tap (`tapAbility` avec cible `exhausted`).
- The Syren (ogn-184) : gear ; 1 énergie + Tap — déplace une unité alliée d'un champ vers sa base (`tapAbility` avec coût et effet `move-to-base`).
- The Syren (ogn-184) : gear ; 1 énergie + Tap — déplace une unité alliée d'un champ vers sa base (`tapAbility` avec coût et effet `move-to-base`).
- Blind Monk (ogn-257) : légende ; 1 énergie + Tap — buffe une unité alliée. Les légendes peuvent désormais porter une `tapAbility` (même action `activate-gear`), cliquable dans la table et couchée quand elle est Tap.
- Bounty Hunter (ogn-267) : légende ; Tap — une unité gagne Ganking ce tour (effet ciblé `grant-ganking`, effet temporaire `ganking`).
- Herald of the Arcane (ogn-265) : légende ; 1 énergie + Tap — joue une Recrue 1 dans sa base (capacité Tap sans cible `summon-base`).
- Hand of Noxus (ogn-253) : légende ; Tap — Réaction, Legion : ajoute 1 énergie, sans pile (`resourceAbility` de légende avec condition `legion`) ; cliquable dans la table comme un gear de ressource.
- Loose Cannon (ogn-251) : légende ; au début de sa Beginning, pioche 1 via la pile s'il a 1 carte ou moins en main (`beginningDrawIfHandAtMost`).
- Nine-Tailed Fox (ogn-255) : légende ; quand l'adversaire attaque un champ qu'il contrôle, les attaquants ont -1 Might ce tour, minimum 1, via la pile (`weakenAttackers`, mode d'attaque `weaken-enemies-here`).
- Relentless Storm (ogn-249) : légende ; quand son propriétaire joue une unité Mighty (Might imprimée 5+), elle se couche (si Ready) pour canaliser 1 rune Tap via la pile (`mightyPlayChannel`, utilisée automatiquement).
- Clockwork Keeper (ogn-044) : en la jouant, peut payer 1 Power Calm en plus pour piocher 1 via la pile (`optionalCost` d'unité, champ d'action `optionalCost`, variantes proposées par les actions légales et la table).
- Wallop (ogn-146) : Action ; redresse une unité ; peut dépenser le buff d'une unité alliée pour ignorer tout le coût (`spendBuffForFreeCast`, champ d'action `spendBuffUnitId`, helper `castCost`).
- Call to Glory (ogn-207) : Réaction ; +3 Might à une unité ce tour, gratuit en dépensant un buff allié (`spendBuffForFreeCast`).
- Wildclaw Shaman (ogn-147) : à la mise en jeu, peut dépenser le buff d'une unité alliée pour se buffer et se redresser (`onPlayTargetEffect` avec filtres `buffed`/`optional`, effet `spend-buff-empower-self`).
- Poro Herder (ogn-061) : à la mise en jeu, s'il contrôle un Poro, se buffe et pioche 1 (`buff-self` avec `ifControlTag` et `draw`).
- Eclipse Herald (ogn-059) : quand son propriétaire étourdit une unité ennemie, se redresse et gagne +1 Might ce tour (`onEnemyStunned`, détecté par `act` sur les unités nouvellement Stun).
- Radiant Dawn (ogn-261) : légende ; quand son propriétaire étourdit des ennemis, il buffe une unité alliée (choisie automatiquement, sans pile) (`buffOnEnemyStunned`).
- Solari Shrine (ogn-072) : gear ; quand son propriétaire tue une unité ennemie Stun, il se couche (s'il est Ready) pour piocher 1 (`drawOnStunnedEnemyKill`, accepté automatiquement, sans pile).
- Wraith of Echoes (ogn-118) : la première mort d'une unité alliée de chaque tour fait piocher 1 à son propriétaire (`drawOnFirstAllyDeath`, registre `allyDeathThisTurn`).
- Viktor (ogn-246, Order) : quand une autre unité alliée non-Recrue meurt, joue une Recrue 1 dans la base (`recruitOnAllyDeath`, sans pile).
- Viktor (ogn-117, Mind) : quand son propriétaire joue une carte pendant le tour adverse, joue une Recrue 1 dans sa base (`recruitOnOffTurnPlay`, sans pile).
- Volibear (ogn-158, Body) : Shield 3, Tank ; quand une unité adverse se déplace vers un autre champ que le sien, son propriétaire pioche 1 (`drawOnEnemyMoveElsewhere`, sans pile).
- Miss Fortune (ogn-193, Chaos) : peut être jouée sur un champ libre, et les unités alliées aussi tant qu'elle est en jeu (`alliesCanPlayToOpenBattlefield`).
- Mageseeker Warden (ogn-070) : sur un champ, les adversaires ne jouent leurs unités qu'en base et leurs unités ne peuvent pas être redressées par sorts et capacités (`wardenLockdown`, helper `wardenAgainst` ; aucun effet ne redresse encore de gear).
- Blitzcrank (ogn-067) : Tank ; joué sur un champ, peut y attirer une unité ennemie (`pull-here`, filtre `onlyToBattlefield`) ; quand il tient, retourne dans la main de son propriétaire via la pile (`onHoldReturnToHand`).
- Caitlyn (ogn-068) : reçoit les dégâts de combat en dernier (`backline` copié à la mise en jeu) ; Tap, seulement sur un champ : inflige sa Might à une unité sur un champ. Les unités peuvent désormais porter une `tapAbility` (même action `activate-gear`, condition `requiresBattlefield`, effet `might-damage`).
- Stacked Deck (ogn-183) : Action ; regarde les 3 cartes du dessus, en garde 1 en main et recycle les autres. Nouveau choix privé `pendingPick` (action `choose-pick`), proposé par la table comme les autres choix du moteur.
- Sigil of the Storm (ogn-287) : champ ; le conquérant recycle une de ses runes (Tap d'abord, sans choix) via la pile (`conquerRecycleRune`, effet `recycle-rune`).
- Correction Deflect : toute seconde cible (frappe, duel, Dragon's Rage, Convergent Mutation, Zenith Blade…) et toute sélection d'unités d'un sort sont comptées pour la taxe Deflect (`spellChosenUnits` générique).
- The Dreaming Tree (ogn-292) : champ ; la première fois du tour qu'un joueur choisit avec un sort une unité alliée présente ici, il pioche 1 (`drawOnFirstFriendlySpellChoice`, registre `dreamingTreeUsed`, sans pile).
- Monastery of Hirana (ogn-282) : champ ; le conquérant dépense un buff allié (s'il en a, automatiquement) pour piocher 1 via la pile (`conquerSpendBuffDraw`, effet `spend-buff-draw`).
- Reckoner's Arena (ogn-286) : champ ; quand son contrôleur le tient, les effets de conquête de pioche (`onConquerDraw`) des unités alliées présentes se déclenchent via la pile (`holdActivatesConquer`). Les autres effets de conquête d'unité seront branchés au fil de leur implémentation.
- Qiyana (ogn-155) : Deflect ; à la conquête, pioche 1 ou canalise 1 rune Tap au choix (`onConquerChoice`, entrée de pile `mode-choice`, choix `pendingModeChoice` / action `choose-mode`, proposé au panneau de la table). Capacités de conquête d'unité regroupées dans `unitConquerEntries` (conquête et Reckoner's Arena).
- Cruel Patron (ogn-208) : coût supplémentaire obligatoire, tuer une unité alliée (`sacrificeCost`, champ d'action `sacrificeUnitId`, une option par unité sacrifiable ; la mort suit la mise en jeu, effets de mort compris).
- Get Excited! (ogn-008) : Action ; défausse une carte de la main (choisie au lancement, hypothèse documentée : champ `discardCardId`) et inflige son coût en énergie à une unité sur un champ (effet `discard-for-damage`).
- Brazen Buccaneer (ogn-002) : coût supplémentaire facultatif, défausser une autre carte de sa main pour 2 énergie de moins (`discardDiscount`, champ d'action `discardCardId` de play-unit).
- Treasure Trove (ogn-186) : gear ; 1 Power Chaos + Tap : se détruit (capacité Tap sans cible `kill-self`) ; quand il est détruit, son propriétaire pioche 1 puis canalise 1 rune Tap (`onLeaveDrawChannel`, sans pile comme Scrapheap).
- Pakaa Cub (ogn-135) et mécanique Hidden : action `hide-card` (son tour, état ouvert, carte Hidden de la main, champ contrôlé sans carte cachée, 1 Power de n'importe quel domaine) ; carte `facedown` (fresh jusqu'au tour suivant) ; jouée ensuite à vitesse Réaction, gratuitement, sur son champ, choix d'unités limités à ce champ ; perdue (cimetière) si son propriétaire ne contrôle plus le champ hors Showdown. Table : dos de carte sur le champ, bouton « Cacher sur Champ N ».
- Consult the Past (ogn-083) : Hidden ; Réaction ; pioche 2.
- Fight or Flight (ogn-168) : Hidden ; Action ; renvoie une unité d'un champ dans la base de son propriétaire (`move-unit` avec `baseOnly`).
- Hidden Blade (ogn-213) : Hidden ; Action ; tue une unité sur un champ, son contrôleur pioche 2 (`kill-unit` avec `controllerDraws`).
- Block (ogn-057) : Hidden ; Action ; une unité gagne Shield 3 et Tank jusqu'à la fin du tour (effet `grant-shield-tank`, effets temporaires `shield` / `tank`, helper `isTank`).
- Sprite Call (ogn-094) : Hidden ; Action ; joue un jeton Sprite 3 Ready et Temporary (base ou champ contrôlé, via `summon-recruits`).
- Teemo (Chaos, ogn-197) : Hidden ; à la mise en jeu, +3 Might jusqu'à la fin du tour (`onPlayEffect: self-might`).
- Blastcone Fae (ogn-097) : Hidden ; à la mise en jeu, -2 Might à une unité jusqu'à la fin du tour (minimum 1). Correction Hidden : le choix de cible à la mise en jeu tient compte de la gratuité depuis facedown.
- Facebreaker (ogn-220) : Hidden ; Action ; étourdit une unité alliée et une unité ennemie du même champ (effet `stun-with-enemy-here`, helper `enemyHere`).
- Fox-Fire (ogn-256) : Hidden ; Action ; tue des unités d'un même champ dont la Might totale est au plus 4 (effet `kill-selected-total-might`, sélection revérifiée à la résolution).
- Stand United (ogn-053) : Hidden ; Action ; buffe une unité alliée ; ce tour, les buffs des unités du lanceur donnent +1 Might de plus (effet `empower-buffs`, registre `buffBonus` vidé en fin de tour).
- Ember Monk (ogn-167) : quand son propriétaire joue une carte depuis Hidden, +2 Might ce tour (`mightOnHiddenPlay`, sans pile comme les autres déclencheurs simples).
- Bandle Tree (ogn-278) : champ ; une carte Hidden supplémentaire peut y être cachée (`extraHiddenSlots`).
- Noxus Saboteur (ogn-018) : les cartes cachées des adversaires sur son champ ne peuvent pas être jouées (`blocksEnemyHidden`).
- Kinkou Monk (ogn-141) : à la mise en jeu, buffe jusqu'à deux autres unités alliées (`onPlayBuffOthers`, champ d'action `onPlaySelectedIds` choisi sans ordre, aussi au clic dans la table).
- Sett (ogn-164) : se buffe quand il est joué et quand il conquiert (`onConquerBuffSelf`) ; « dépenser mon buff » : +4 Might ce tour via la pile (action `spend-buff-ability`, `buffSpendMight`, à son tour en état ouvert comme les capacités Tap).
- Adaptatron (ogn-056) : à la conquête, peut détruire un gear (choix à la résolution parmi les gears en jeu, ou rien) et, si oui, se buffe (`onConquerKillGearBuff`, modes `skip` / `kill-gear:<id>` du choix de mode).
- Overt Operation (ogn-153) : Action ; chaque unité alliée Tap et buffée dépense son buff pour se redresser, puis toutes les unités alliées sont buffées (effet `spend-buffs-ready-then-buff-all`).
- Albus Ferros (ogn-230) : à la mise en jeu, dépense les buffs des unités alliées choisies (sans ordre) et canalise 1 rune Tap par buff dépensé (`onPlaySpendBuffsChannel`, sélection `onPlaySelectedIds` généralisée).
- Super Mega Death Rocket! (ogn-252) : inflige 5 à une unité ; au cimetière, quand son propriétaire conquiert, il peut défausser 1 carte pour la reprendre en main (`returnOnConquerDiscard`, choix de mode `discard-return:<id>` calculé à la résolution).
- Vayne (ogn-035) : Assault 3 ; entre Ready si un adversaire contrôle un champ (`entersReadyIfOpponentControls`) ; à la conquête, peut payer 1 énergie pour retourner en main (`onConquerPayReturn`, mode `pay-return` proposé seulement si payable).
- Party Favors (ogn-071) : l'adversaire choisit Cartes (le lanceur et lui piochent 1) ou Runes (chacun canalise 1 rune Tap) (effet `party-favors`, choix de mode appartenant à l'adversaire, `partnerId`).
- Cull the Weak (ogn-209) : chaque joueur, le lanceur d'abord, choisit et tue une de ses unités (effet `each-player-kills`, choix de mode `kill-own:<id>` enchaînés, joueur sans unité passé).
- Acceptable Losses (ogn-179) : Action ; chaque joueur, le lanceur d'abord, détruit un de ses gears (`each-player-kills` sur les gears).
- Whirlwind (ogn-187) : en commençant par l'adversaire, chaque joueur peut renvoyer une unité dans la main de son propriétaire (effet `each-player-may-return-unit`, modes `skip` / `return-unit:<id>`).
- King's Edict (ogn-237) : l'adversaire choisit une de ses unités (non contrôlée par le lanceur), qui meurt (`each-player-kills` avec `opponentsOnly`).
- Mindsplitter (ogn-192) : à la mise en jeu, la main adverse est révélée et son propriétaire y choisit une carte, défaussée (`onPlayEffect: opponent-hand-pick`, modes `discard-opp:<id>`).
- Sabotage (ogn-156) : la main adverse est révélée et le lanceur y choisit une carte non-unité, recyclée sous le deck de son propriétaire (`opponent-hand-pick`, modes `recycle-opp:<id>`).
- Shen (ogn-241) : unité Réaction (jouable avec la priorité pendant une pile, un Showdown ou le tour adverse, `reactionTiming`), Shield 2, Tank.
- Mushroom Pouch (ogn-101) : gear ; au début de la Beginning de son propriétaire, s'il a une carte cachée sur un champ, il pioche 1 via la pile (`beginningDrawIfFacedown`).
- Shakedown (ogn-033) : Réaction ; le contrôleur de l'unité ennemie choisie choisit qu'elle subisse 6 ou que le lanceur pioche 2 (effet `damage-unless-draw`, choix de mode `suffer:<id>` / `let-draw`).
- Fading Memories (ogn-180) : une unité sur un champ ou un gear gagne Temporary (cible `battlefield-unit-or-gear`, effet `grant-temporary`) ; les gears Temporary sont détruits au début de la Beginning de leur propriétaire.
- Vanguard Helm (ogn-228) : gear ; quand une unité alliée buffée meurt, une autre unité alliée est buffée (`buffOnBuffedAllyDeath`).
- Gemcraft Seer (ogn-100) : Vision ; tant qu'elle est en jeu, les autres unités alliées jouées ont Vision (`alliesHaveVision`).
- Commander Ledros (ogn-231) : Deflect, Ganking ; peut tuer des unités alliées en coût supplémentaire, chacune retirant 1 Power Order (`unitCostReduction` kind sacrifice, champ d'action `costUnitIds`).
- Kraken Hunter (ogn-150) : Accelerate, Assault ; peut dépenser des buffs alliés en coût supplémentaire, chacun retirant 1 Power Body (`unitCostReduction` kind spend-buff).
- Time Warp (ogn-122) : son lanceur joue un tour supplémentaire après celui-ci (`extraTurns`, prioritaire sur l'ordre normal) ; la carte est bannie à la résolution (`banishOnResolve`).
- Possession (ogn-203) : Action ; prend le contrôle d'une unité ennemie sur un champ et la rappelle dans la base du lanceur (effet `steal-and-recall`) ; nouveau champ d'unité `cardOwnerId` : une unité contrôlée par un autre joueur retourne au cimetière / à la main de son propriétaire.
- The Harrowing (ogn-198) : joue une unité de son cimetière dans sa base (Tap), sans son coût en énergie (effet `play-from-trash`).
