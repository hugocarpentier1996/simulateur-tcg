# Simulateur TCG

Moteur TypeScript pur, table de jeu locale et tests Vitest dans un environnement reproductible.
Le serveur réseau sera ajouté progressivement.

Pour reprendre le développement : lire [le suivi du projet](docs/suivi.md), les
[règles confirmées](docs/regles.md) et les [consignes de développement](AGENTS.md).

## Démarrer

Prérequis : Git et Docker Desktop démarré avec les conteneurs Linux.
Depuis PowerShell, dans le dossier du projet :

```powershell
docker compose up --build
```

Cette commande construit l'environnement Node 24, installe les versions du fichier
`pnpm-lock.yaml` et démarre les tests en surveillance.
Les résultats apparaissent dans le terminal. Ctrl+C arrête le service.

## Ouvrir la table de jeu

Avec Docker Desktop démarré, depuis le dossier du projet :

```powershell
docker compose run --rm --service-ports dev sh -c "pnpm install --frozen-lockfile --store-dir /pnpm/store && pnpm dev --host 0.0.0.0"
```

Ouvrir **http://127.0.0.1:5173/**. Le port Docker est publié uniquement sur la machine locale.
Avec Node et pnpm déjà installés : `pnpm install --frozen-lockfile`, puis `pnpm dev`.
Si le port 5173 est occupé par une table déjà lancée, utiliser celle-ci ou arrêter son terminal.

La table est partagée sur le même écran : le joueur actif est en bas et sa main est visible.
Glisser une unité de la main ou le chosen champion vers une zone éclairée pour la jouer.
Alternative clavier/tactile : sélectionner la carte, puis « Poser ici » dans sa destination.
Le moteur propose un paiement réalisable et le vérifie à nouveau au dépôt ; aucun coût
n'est dépensé lors d'un refus. Les runes utilisées sont choisies automatiquement ; cette
première interface ne permet pas de modifier cette stratégie de paiement.

« Terminer le tour » exécute les étapes automatiques et passe au joueur suivant.
Une unité Ready en base peut être glissée vers un champ libre ou allié éclairé (ou
sélectionnée puis déplacée par clic). Elle devient Tap, sans coût supplémentaire.
Sur un champ libre, un Open Showdown s'ouvre : cliquer « Passer » pour chacun des deux
joueurs prioritaires. Le contrôle et le point de conquête sont attribués à la clôture.
Au début de son prochain tour, le contrôleur gagne automatiquement le point de tenue
(holding), selon les règles de score du moteur. Le journal distingue ces deux gains.
Le bouton « Annuler l’action », au-dessus du plateau, permet de revenir jusqu'à dix
actions réussies en arrière, avec leur paiement et leurs effets automatiques. Le compteur
indique les retours encore disponibles ; les refus et simples sélections ne comptent pas.
Les piles, runes de couleur, bases et champs sont disposés en miroir ; la main forme un
éventail. Le nombre de colonnes des champs suit celui fourni par le moteur.
La légende est entre la base et le chosen champion, à droite pour le joueur actif.

Sélectionner un sort (ou une unité dont la mise en jeu demande une cible) affiche dans le
panneau la liste complète des choix légaux fournis par le moteur : cibles, destinations
des jetons et paiement automatique. Aucune cible n'est choisie implicitement. Le sort est
empilé puis résolu après les passes ; la main affichée est celle du joueur qui doit agir
(réaction, Vision, défausse, effets de mort ou capacités d'attaque).

Limites de cette tranche : préparation fixe sans écran de dés/mulligan, pas encore de
commandes de gear. Les champs neutres restent interdits à la mise en jeu depuis la main.
Pas de sauvegarde :
recharger la page ou démarrer une nouvelle partie remet la démo à zéro.
`pnpm build` crée `apps/table/dist` ; `pnpm check` vérifie aussi cette construction.

Pour exécuter toutes les vérifications puis quitter :

```powershell
docker compose run --rm dev sh -c "pnpm install --frozen-lockfile --store-dir /pnpm/store && pnpm check"
```

Le code est partagé avec le conteneur. Les dépendances Linux restent dans un volume Docker,
séparé des dépendances éventuellement installées sur Windows.

## Développer dans VS Code

Ouvrir ce dossier, puis la palette de commandes (Ctrl+Shift+P) et choisir
**Dev Containers: Reopen in Container**. L'installation est automatique.
Dans le terminal du conteneur :

| Commande                                                     | Rôle                                                      |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| `pnpm test:watch`                                            | Relance les tests pendant le développement                |
| `pnpm test`                                                  | Exécute les tests une fois                                |
| `pnpm typecheck`                                             | Détecte les incohérences de types                         |
| `pnpm lint`                                                  | Vérifie les conventions et certaines frontières du moteur |
| `pnpm format`                                                | Corrige le formatage                                      |
| `pnpm check`                                                 | Exécute toutes les vérifications                          |
| `pnpm exec vitest run packages/game-engine/src/game.test.ts` | Cible le premier scénario                                 |

Les versions de Node et pnpm sont fixées dans Docker et la CI. Les dépendances directes
ont des versions exactes ; le lockfile fixe aussi les dépendances transitives.
Après modification des dépendances, committer ensemble `package.json` et `pnpm-lock.yaml`.

## Organisation

- `packages/game-engine` : état, actions, événements et règles, sans réseau ni UI.
- `packages/game-data` : futur contenu des cartes.
- `packages/shared` : futurs contrats réseau et vues filtrées.
- `packages/test-utils` : futurs helpers de scénarios.
- `apps/table` : première interface locale TypeScript/Vite (voir son README).
- `apps/client` et `apps/server` : emplacements réservés aux futurs clients/réseau.
- `tests/e2e` : futurs parcours Playwright multijoueurs.
- `docs/regles.md` : règles conservées depuis la conception.
- `.github/workflows/ci.yml` : vérifications à chaque push et pull request une fois le dépôt hébergé sur GitHub.

## Première tranche du moteur

Le code est réparti par responsabilité :

| Fichier dans `packages/game-engine/src` | Rôle                                                     |
| --------------------------------------- | -------------------------------------------------------- |
| `index.ts`                              | Expose l'interface publique du package                   |
| `types.ts`                              | Décrit les entrées, sorties et événements                |
| `act.ts`                                | Vérifie le joueur et dirige l'action vers son traitement |
| `actions/move.ts`                       | Valide puis applique un mouvement                        |
| `actions/pass.ts`                       | Passe la priorité ou demande la clôture du Showdown      |
| `showdown/resolve-open.ts`              | Applique la conquête à la clôture de l'Open Showdown     |
| `game.test.ts`                          | Vérifie les comportements via l'interface publique       |

Pour ajouter une action, définir son entrée dans `GameAction`, créer son traitement
dans `actions/`, puis la relier dans le `switch` de `act`. Le contrôle exhaustif
de TypeScript signale une action déclarée mais non reliée. Les sous-fonctions restent
privées à leur module lorsqu'elles n'ont pas besoin d'être utilisées ailleurs.

La fin de tour utilise `actions/end-turn.ts` pour vérifier la demande et
`turn/progression.ts` pour sélectionner le joueur suivant. Les contrats de transition
sont vérifiés dans `turn.test.ts`.

`act(state, action)` retourne soit un refus avec sa raison, soit le nouvel état et
les événements produits. L'état d'entrée reste inchangé. Le serveur fournira plus tard
l'identité authentifiée du joueur : un identifiant envoyé par le navigateur ne suffira pas.

Le scénario actuel couvre le déplacement d'une unité Ready depuis sa base vers un champ
vide, son Tap, l'Open Showdown, les passes successives et un point de conquête.
Le registre des champs déjà scorés empêche un second point sur le même champ pendant le tour.

L'action `end-turn` termine la Main du joueur actif, uniquement hors Showdown.
Elle passe au joueur suivant selon l'ordre de `players`, revient au premier après le
dernier et vide le registre des champs scorés pour tous les joueurs, sans effacer les
points acquis. Le moteur exécute automatiquement les étapes puis rend le contrôle en Main :

| Étape       | Traitement                                                                   | Module dans `src/turn/`       |
| ----------- | ---------------------------------------------------------------------------- | ----------------------------- |
| Fin du tour | Vide Énergie et Power de tous les joueurs                                    | `resources.ts`                |
| Awaken      | Redresse les unités et cartes Ready/Tap en jeu du nouveau joueur             | `awaken.ts`                   |
| Beginning   | +1 par champ tenu, source HOLD et registre de score actualisés               | `beginning.ts`                |
| Channel     | Transfère jusqu'à deux runes du sommet de la pile, Ready                     | `supplies.ts`                 |
| Draw        | Transfère une carte du sommet du deck dans la main, puis vide les ressources | `supplies.ts`, `resources.ts` |
| Main        | Rend la main au joueur actif                                                 | `progression.ts`              |

`automatic-turn.test.ts` vérifie l'ordre, les résultats, les piles insuffisantes et
plusieurs tours successifs. `phase-started` rend les étapes observables dans les événements.
Il n'y a pas d'action client pour avancer manuellement ces étapes, ni encore de traitement
des effets personnalisés ou choix de cibles pendant Beginning.

Les instances de cartes sont dans `cards` avec ID, ID de définition, propriétaire et zone.
Les unités en jeu restent dans `units` ; une même instance ne doit pas figurer dans les deux
collections. Jouer une unité la transfère dans `units` ; mourir la remet dans `cards`
au cimetière, avec le même ID et la même définition. Dans une pile,
l'ordre des instances filtrées par zone correspond au sommet vers le dessous : le moteur
ne mélange que lors du recyclage du deck. `ready` absent signifie que la carte n'utilise pas Ready/Tap.
Les runes portent une couleur ; les réserves flottantes sont dans `resources`, distinctes
des runes physiques. Les noms des six couleurs ne sont pas encore fixés dans le contenu.

Pile de runes vide ou insuffisante : prendre uniquement ce qui reste, sans pénalité.
Deck vide lors d'une demande de pioche : recycler sa défausse (`graveyard`), mélanger
et donner un point à l'adversaire, puis piocher si la partie continue. Si le point atteint
le seuil de victoire, le moteur arrête immédiatement la résolution. Si deck et défausse
sont vides, il accorde directement les points manquants à l'adversaire et termine la partie.
Cette agrégation évite une boucle ; les futurs effets déclenchés par des points devront
tenir compte de cette règle. Le seuil est `victoryTarget` du bénéficiaire, 8 par défaut.
Cette attribution concerne le 1v1 ; le destinataire de la pénalité en FFA reste à définir.

`turn/draw.ts` traite la pioche, `turn/deck-penalty.ts` les points et la fin de partie,
`random/shuffle.ts` le mélange. `randomState` conserve l'état du hasard déterministe
(graine 1 si omise dans un petit scénario). Une partie réelle devra recevoir sa graine
du serveur. Le mélange est injectable dans le traitement de pioche. Le journal
`deck-recycled` contient l'ordre obtenu : il est interne, jamais à envoyer aux adversaires.
`deck-penalty` conserve la source OTHER et le montant ; `game-ended` identifie le vainqueur.
`result` bloque ensuite les actions avec `GAME_OVER` et empêche d'entrer en Main.

Une pile absente équivaut à une pile vide. Une destination manquante pour un transfert
effectif est une erreur d'état. Les zones personnelles de même type doivent être uniques.
Le redressement exclut la main, les piles, le cimetière et le bannissement ; les effets
empêchant le redressement viendront avec les premières cartes représentatives.

Ce moteur reste un prototype : les capacités déclenchées sont limitées à la première
invocation de jeton à la mort. Les autres effets et les équipes restent à implémenter.
La victoire à 8 points est appliquée à la tenue, à la conquête autorisée et aux pénalités
de deck. Le dernier point par conquête exige d'avoir déjà scoré tous les autres champs
ce tour. Sinon, le conquérant pioche une carte et le champ compte comme scoré sans
accorder de point. Le contrôle est acquis dans les deux cas.
Ne pas utiliser ce prototype pour arbitrer une partie complète.
Les structures utilisent des listes de joueurs ; seul le mode 1v1 est actuellement accepté.
Le mouvement pris en charge part de la base vers un champ. Le déplacement entre champs
et le mouvement groupé restent à ajouter lorsque leurs règles seront précisées.

## Jouer une unité et combattre

Fournir les définitions de confiance dans `state.unitDefinitions` (par exemple `testUnits`
du package game-data). Le coût et la Might sont lus dans ce catalogue. La carte doit être
dans la main ou la zone champion du joueur actif, en Main et hors Showdown. Elle entre
Tap dans sa base par défaut ; `destinationId` permet de choisir un champ contrôlé.

```ts
act(state, {
  type: 'play-unit',
  playerId: 'alice',
  cardId: 'instance-du-garde',
  payment: {
    energyRunes: ['rune-1', 'rune-2'],
    powerRunes: ['rune-2'],
  },
});
```

Le moteur utilise les ressources flottantes plus les runes choisies. Les runes d'Énergie
doivent être Ready ; les runes de Power peuvent être Tap et vont sous leur pile dans
l'ordre fourni. La même rune peut produire Énergie puis Power. Les doublons dans une
même liste sont refusés. Le paiement est atomique : un refus ne consomme rien ; le surplus
produit reste flottant. `cost/payment.ts` traite le coût, `actions/play-unit.ts` la mise en jeu.

Entrer sur un champ adverse ouvre un Combat Showdown, priorité à l'attaquant. Le défenseur
reste contrôleur jusqu'à la clôture. Après une passe de chaque joueur, `stage: 'damage'`
attend les deux répartitions ; aucune carte ni aucun mouvement n'est alors autorisé.

```ts
act(state, {
  type: 'assign-damage',
  playerId: 'alice',
  allocations: [
    { targetId: 'tank-adverse', amount: 2 },
    { targetId: 'autre-unite', amount: 1 },
  ],
});
```

Chaque joueur soumet une fois, dans l'ordre de son choix. Une attribution vide est requise
si son camp inflige zéro dégât. Les choix enregistrés sont internes au serveur et ne doivent
pas être révélés à l'adversaire avant la résolution. Le moteur vérifie Tank, Backline,
les dégâts létaux avant de changer de cible, et l'utilisation de tous les dégâts possibles.
La dernière cible peut recevoir un reliquat non létal ; l'excédent est omis si toutes sont mortes.
Stun et `cannotDealDamage` empêchent la contribution aux dégâts, sans empêcher de les subir.
Brise-assaut accorde désormais un Stun temporaire ; `cannotDealDamage` reste une propriété d'unité.

Les deux répartitions sont appliquées simultanément. Might 0 exige au moins un dégât pour
mourir. Les morts sont identifiés avant le soin global, puis transférés au cimetière.
Si seul l'attaquant reste, il conquiert ; si les deux camps restent, il retourne en base
sans être redressé ; si personne ne reste, le champ n'a plus de contrôleur.
Le contrôle et le score attendent tous les effets de mort et leurs Réactions. Si le défenseur
a été éliminé puis remplacé et que les deux camps sont présents, un nouveau combat démarre
sans conquête ni point intermédiaire. Sinon, le résultat normal s'applique.

Les modules `combat/allocation.ts` et `combat/resolve.ts` vérifient les choix et résolvent
le résultat. `play-unit.test.ts` couvre aussi un parcours complet depuis une carte réelle
du catalogue jusqu'à la conquête, en passant par paiement et redressement au tour suivant.

## Créer une partie

`createGame(config)` construit les zones, les cartes et l'état de préparation.
Chaque entrée de `config.players` fournit `id`, `deck` (39 instances), `runes` (12),
`legend` (avec `colors`), `champion` et `battlefields` (3 candidats). Une instance
contient `id` et `definitionId` ; les runes ont aussi `color`. Les identifiants d'instances
doivent être uniques même si plusieurs cartes utilisent la même définition.
Les couleurs de runes acceptées ici sont `rouge`, `vert`, `bleu`, `orange`, `violet`, `jaune`.
Les anciennes cartes de test utilisent encore `color-1`/`color-2` : adapter leurs coûts
et leurs runes ensemble avant de les intégrer à une configuration de partie réelle.

Les decks arrivent dans leur ordre déjà mélangé par l'appelant de confiance. Le moteur
ne fait aucun appel à une horloge ou à `Math.random`. Pour les champs BO1, `randomState`
alimente le hasard reproductible du prototype (défaut : 1). Comme pour le recyclage,
le hasard de production devra être produit par le serveur et rester privé.

- **BO1** (défaut, ou `match: { format: 'bo1' }`) : sélection d'un champ par joueur,
  puis `recordOpeningRoll(state, { alice: 17, bob: 8 })`. Les résultats de d20 viennent
  du serveur ; ce n'est pas une action libre du client. Une égalité laisse les dés ouverts.
- **BO3, manche 1** : `match: { format: 'bo3', gameNumber: 1 }`. Les joueurs utilisent
  `choose-battlefield` avec `battlefieldId` avant que les dés soient autorisés.
- **BO3, manches 2/3** : ajouter `previousLoserId` au contexte de la manche. Après les
  choix de champs, ce joueur choisit le premier sans lancer de dés. Pour une série complète,
  utiliser le gestionnaire BO3 ci-dessous, qui calcule cette information automatiquement.

Le décideur utilise `act(state, { type: 'choose-first-player', playerId, firstPlayerId })`.
Le moteur distribue quatre cartes chacun et attend deux actions `mulligan`, avec
`playerId` et `cardIds` (0, 1 ou 2 identifiants de sa main). Les cartes vont sous le deck
dans l'ordre donné puis les remplaçantes sont piochées. Chaque joueur décide une seule fois.
Le premier tour démarre après les deux décisions : deux runes, puis la cinquième carte.
Le second joueur reçoit trois runes à son premier Channel, puis le bonus est consommé.

`setup.stage` décrit l'attente : `choose-battlefield`, `roll`, `choose-first` ou `mulligan`.
Les actions ordinaires sont bloquées pendant cette préparation. Les mains, les choix
intermédiaires et le hasard font partie de l'état serveur ; ne pas transmettre l'état
complet aux clients. Les modules de `src/setup/` documentent les entrées, sorties et refus.
Les tags Champion/légende, limites de copies et effets propres aux battlefields restent
à valider ou implémenter lorsque les catalogues correspondants seront disponibles.

## Suivre une série BO3

`createBo3(config)` crée la série à 0–0 et sa première partie. Utiliser ensuite
`actBo3(series, action)` et `rollBo3(series, rolls)` à la place des entrées de partie
seule : elles conservent la partie dans `series.game` et enregistrent automatiquement
son résultat. Les points d'une partie restent dans `game.players`, les victoires de
manches dans `wins`. `completedGames` conserve les résultats, et `winnerId` désigne
le vainqueur de la série dès sa deuxième victoire.

Après une manche, `startNextBo3Game(series, config)` crée une partie neuve et transmet
le dernier perdant au choix du départ. Le serveur fournit à nouveau les decks mélangés.
Cette opération refuse une manche encore active ou une série gagnée, et ne permet pas
de remplacer les joueurs ou leurs trois définitions de battlefield. Les autres règles
de changement de deck entre manches ne sont pas définies par ce gestionnaire.

Les champs utilisés sont suivis par joueur dans `usedBattlefields`, par `definitionId`.
Ils sont retirés des options de préparation suivantes ; changer l'identifiant d'instance
ne permet pas de rejouer le même battlefield. Le joueur adverse conserve ses propres
choix. La série s'arrête à 2–0 ou 2–1, sans compter deux fois une manche terminée.

Les fonctions renvoient `{ ok: true, state, events }` ou `{ ok: false, reason }` et
ne modifient pas leurs entrées. Les événements de partie sont complétés par
`match-game-recorded` et `match-ended`. Les refus propres à la série incluent
`MATCH_OVER`, `GAME_NOT_RECORDED`, `MATCH_PLAYERS_CHANGED`, `INVALID_BATTLEFIELD_POOL`
et `BATTLEFIELD_POOL_CHANGED`. `bo3.test.ts` illustre les séries complètes.

L'état de série est un état serveur de confiance : ne pas exposer aux clients une
possibilité de modifier directement `game`, `wins` ou l'historique. Pour conserver
le suivi BO3, toujours remplacer la série par l'état renvoyé par ces fonctions.

## Score et victoire

`scoring/battlefield.ts` reçoit l'état, le joueur, le champ et la source (`HOLD` ou
`CONQUEST`). Il renvoie l'état et les événements : point, pioche de remplacement,
ou aucun gain si le champ a déjà été scoré. Une victoire fixe `state.result` avec
`reason: 'POINTS'` ; `act` refuse ensuite les actions avec `GAME_OVER`.
Les étapes automatiques s'arrêtent dès la victoire, notamment au Beginning.

Exemple à 7 points sur trois champs A/B/C : conquérir A fait piocher et marque A ;
conquérir B fait piocher et marque B ; conquérir C permet alors de gagner à 8 points.
Les champs tenus au Beginning comptent aussi dans ce registre, remis à zéro à chaque
nouveau tour. Le registre de l'adversaire ne contribue pas à cette condition.

L'événement `conquest-point-replaced` explique la pioche sans prétendre qu'un point
a été gagné. La pioche utilise les règles habituelles de recyclage et de pénalité :
elle peut donc faire gagner l'adversaire. `victory.test.ts` couvre ces parcours.
Les futurs effets accordant directement des points restent à raccorder quand leurs
cartes seront ajoutées ; ils ne seront pas soumis à la restriction de conquête.

## Gears et équipements

Fournir `testGears` de game-data dans `gearDefinitions` (configuration de partie ou état).
`play-gear` reçoit `playerId`, `cardId` et `payment`, comme la pose d'une unité. Le gear
quitte `cards` pour `gears`, Ready en base, sans entrer dans `units`.

```ts
act(state, {
  type: 'equip-gear',
  playerId: 'alice',
  gearId: 'instance-de-la-lame',
  unitId: 'unite-alliee',
  payment: { energyRunes: ['rune-1'], powerRunes: ['rune-1'] },
});
```

Le gear doit avoir un `equipCost` dans son catalogue et être libre. Le coût d'attachement
est payé séparément de la pose. Pose et équipement exigent sa Main, la priorité, aucune
pile et aucun Showdown. Le gear conserve son Ready/Tap ; le porteur n'a pas besoin d'être
Ready. Un équipement attaché ne peut pas être réassigné tant que le porteur vit.

Pour afficher ou utiliser la Might totale, appeler **`effectiveMight(unit, state)`**.
L'état est nécessaire pour inclure les auras et les équipements ; l'ancien appel avec
l'unité seule ne calcule que sa base et ses modificateurs temporaires. Les dégâts et
seuils de mort du combat utilisent bien l'état complet. Les effets continus s'additionnent
aux modificateurs temporaires avant le plancher zéro, sans modifier `unit.might`.

Les événements `gear-played`, `gear-equipped`, `gear-followed` et `gear-detached` expliquent
les changements. Après un déplacement, une retraite ou une mort, le moteur synchronise
les attachements. À la mort, le gear revient en base sans modifier Ready/Tap et devient
réutilisable. Les gears ne contribuent pas aux dégâts, ne peuvent pas en recevoir et ne
contrôlent pas de champ. Awaken redresse aussi les gears du joueur.

Cette tranche couvre les bonus continus de Might. Les exceptions gear-unité, destruction
de gear et capacités déclenchées restent à ajouter avec des cartes concrètes. La pose et
l'attachement sont immédiats ici ; aucune nouvelle fenêtre de Réaction spécifique n'est
modélisée pour ces opérations. Les règles de bannissement d'un porteur restent à préciser.

## Lancer un sort et résoudre une chaîne

Fournir `testSpells` de game-data dans `state.spellDefinitions`, ainsi que les instances
de cartes en main. `cast-spell` reçoit le joueur, la carte, la cible et le plan de paiement.
Pour Redéploiement, fournir aussi `destinationId` (champ de bataille ou base du propriétaire).

```ts
const result = act(state, {
  type: 'cast-spell',
  playerId: 'alice',
  cardId: 'instance-regain-de-force',
  targetId: 'unite-cible',
  payment: { energyRunes: ['rune-1'], powerRunes: ['rune-1'] },
});
if (result.ok) state = result.state;
```

Le coût est payé immédiatement ; la carte quitte la main pour `stack.entries`.
Les effets attendent les passes. Lire `stack.priorityPlayerId` pour savoir qui peut
réagir ou passer. Deux passes résolvent le sommet, puis ouvrent une nouvelle fenêtre
pour le sort suivant. Une Réaction peut répondre à une Réaction. Le sort résolu rejoint
son cimetière après ses effets : il ne peut donc pas se recycler dans sa propre pioche.

Quand la pile est vide, la priorité revient à l'adversaire du premier lanceur. En Main,
celui-ci passe pour rendre la main au joueur actif (`priorityPlayerId`). En Showdown,
les passes reprennent dans la fenêtre d'Action. Les répartitions de dégâts interdisent
tout lancement. Les actions ordinaires sont bloquées pendant une chaîne.

`effectiveMight(unit)` et `isStunned(unit)` exposent les valeurs actuelles. La Might
de base reste dans `unit.might` ; `temporaryEffects` conserve les effets qui expirent
ensemble à la fin du tour, y compris ceux des unités hors combat.

Pour déboguer :

- `actions/cast-spell.ts` vérifie le lancement et utilise le paiement commun aux unités.
- `actions/pass-stack.ts` gère les passes et l'ordre de résolution.
- `effects/resolve-spell.ts` applique les instructions du sort.
- `showdown/after-effects.ts` traite les arrivées et la conversion Open vers Combat.
- `spells.test.ts` contient les scénarios de partie à exécuter pas à pas.

Choix provisoires de cette tranche, à distinguer des règles confirmées : la Might effective
est bornée à zéro ; une cible devenue illégale fait ignorer l'effet ciblé sans remboursement,
mais la pioche indépendante reste exécutée. Les instructions d'un même sort se résolvent
ensemble. Un déplacement vers un autre champ pendant un Showdown attend sa clôture avant
d'ouvrir le suivant ; les arrivées sont traitées dans leur ordre de résolution.
La pile accueille aussi la première capacité de mort décrite ci-dessous.

## Mort et invocation de jeton

`deathTestUnits` contient le Gardien du dernier souffle (`reborn`, 1 Might, coût de test
1 Énergie) et son jeton (`spirit`, 3 Might). Fournir les deux définitions au catalogue.
Les dégâts identifient les morts, soignent les survivants et déclenchent les capacités.
Les cartes mortes rejoignent le cimetière avant que `pendingDeaths` demande les choix.

Le joueur indiqué par `pendingDeaths.playerOrder[0]` soumet `queue-death-effects` avec
`effects: [{ sourceId, destinationId }, ...]`. Il doit fournir tous ses effets une fois,
dans l'ordre d'empilement voulu (le dernier résout le premier). L'attaquant choisit avant
le défenseur ; seuls les joueurs ayant des effets doivent intervenir. Les destinations
sont validées par la même règle que la mise en jeu : base propre ou battlefield contrôlé.

Une fois les choix terminés, la priorité de Réaction revient à l'attaquant. Deux passes
résolvent le sommet ; une nouvelle fenêtre s'ouvre pour le suivant. Le jeton entre Tap,
sans coût supplémentaire, avec un ID déterministe. À sa mort, il disparaît.
`combatAftermath` suspend la conquête. Après toute la chaîne, `combat/finish.ts` décide
du résultat ou émet `combat-restarted` et ouvre un nouveau combat avec les mêmes rôles.

Les tests couvrent victoire et défaite au second combat, absence de huitième point anticipé,
choix d'ordre, Réactions et retraite lorsque des défenseurs avaient survécu au premier combat.
Limites : ce déclenchement est raccordé aux morts du combat ; les futures sources de dégâts
et capacités nécessiteront leurs propres déclencheurs. Si une destination cesse d'être légale
avant résolution, l'invocation est ignorée (choix provisoire du prototype, comme le ciblage des sorts).

## Actions jouables et partie complète

`getLegalActions(state, playerId)` retourne des intentions concrètes acceptées par `act`.
Les phases, priorités, cibles, contrôle des champs et ressources disponibles sont vérifiés
par le moteur lui-même. Les runes Tap restent utilisables pour le Power ; une rune Ready
peut produire Énergie puis Power dans le même paiement. Les ressources flottantes comptent.

Un paiement déterministe sans production superflue est proposé pour chaque choix : cette
liste n'énumère pas toutes les stratégies possibles de recyclage des runes. Le client peut
toujours soumettre un autre paiement à `act`. Les permutations de dégâts et de choix de mort
sont énumérées ; leur coût est combinatoire sur de grands plateaux. Les dés restent une
entrée serveur et ne sont pas présentés comme une action client. En BO3, passer `series.game`
à cette fonction, puis exécuter l'action choisie avec `actBo3` pour conserver le suivi.

`full-game.test.ts` simule un BO1 complet sans modifier artificiellement les scores :
préparation, champions, gear, Réaction, deux combats, puis tenue jusqu'à une victoire **8–1**.
Chaque décision provient des actions jouables. Le replay des mêmes intentions reproduit
exactement l'état final. Lancer `pnpm exec vitest run packages/game-engine/src/full-game.test.ts`.

## TDD et débogage

1. Décrire un comportement et ajouter un test.
2. Lancer ce test et vérifier que son échec correspond au comportement manquant.
3. Implémenter le minimum, relancer le test puis refactorer.
4. Lancer `pnpm check` avant de partager le changement.

Pour reproduire un bug moteur, conserver l'état initial et la liste des actions.
Conserver également `randomState` : il permet de reproduire les mélanges. Aucune horloge
ni génération d'ID implicite n'intervient. Les futurs providers devront préserver cette reproductibilité.

| Symptôme                    | Diagnostic                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------- |
| Docker ne répond pas        | Démarrer Docker Desktop puis lancer `docker version`                                    |
| Installation bloquée        | Vérifier le réseau et consulter `docker compose logs dev`                               |
| Lockfile incohérent         | Dans le conteneur, lancer `pnpm install`, puis vérifier et versionner le lockfile       |
| Test rouge                  | Lire le nom du test et comparer « expected » / « received » ; relancer le fichier ciblé |
| Types incorrects            | Lancer `pnpm typecheck` et suivre le fichier et la ligne indiqués                       |
| Fichier modifié non détecté | Relancer `pnpm test` manuellement ; la surveillance des montages Windows peut varier    |

Pour arrêter les services : `docker compose down`. Cette commande conserve les volumes.
Il n'est normalement pas nécessaire de supprimer les volumes pour corriger le code.
