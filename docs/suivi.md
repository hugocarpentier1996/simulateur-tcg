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
