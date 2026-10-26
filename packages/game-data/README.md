# Données

Définitions des cartes et du contenu. Aucun cas particulier de carte dans le moteur par son nom.

`src/test-units.ts` contient cinq unités de test sans capacités :

| Carte          | Énergie | Power                 | Might |
| -------------- | ------- | --------------------- | ----- |
| Éclaireur      | 1       | 1 color-1             | 1     |
| Garde          | 2       | 1 color-2             | 3     |
| Colosse        | 4       | 2 color-1             | 6     |
| Relique animée | 1       | 1 color-2             | 0     |
| Dualiste       | 3       | 1 color-1 + 1 color-2 | 4     |

Les couleurs sont des identifiants provisoires. Ces coûts servent à tester les paiements,
sans prétention d'équilibrage. `defineUnit` valide les valeurs non négatives et finies,
puis produit une définition figée. Might 0 n'est ni une valeur manquante ni une mort automatique.

Une définition décrit une carte ; plusieurs instances peuvent référencer son `id`
via leur `definitionId`. Les zones, propriétaires, dégâts et états Ready/Tap sont propres
aux instances. Fournir `testUnits` à `GameState.unitDefinitions` permet au moteur de jouer
ces cartes avec `play-unit`. Le catalogue est fourni par le serveur, jamais par le client.

Depuis le Dev Container : `pnpm exec vitest run packages/game-data/src/units.test.ts`.

## Sorts de test

`src/test-spells.ts` définit quatre sorts. Timings et coûts sont proposés pour les tests :

| Sort                   | Timing   | Énergie | Power     | Effets                                                          |
| ---------------------- | -------- | ------- | --------- | --------------------------------------------------------------- |
| Redéploiement          | Action   | 1       | 1 color-1 | Déplacer une unité sans exiger Ready et sans la Tap             |
| Regain de force        | Réaction | 1       | 1 color-1 | +2 Might jusqu'à la fin du tour                                 |
| Affaiblissement lucide | Normal   | 1       | 1 color-2 | −1 Might jusqu'à la fin du tour, puis le lanceur pioche 1 carte |
| Brise-assaut           | Réaction | 1       | 1 color-2 | Stun une unité attaquante jusqu'à la fin du tour                |

Une unité Tap déplacée par effet reste Tap ; une unité Ready reste Ready. Le bonus,
le malus et le Stun expirent à la fin du tour courant. Le ciblage de Brise-assaut exclut
les défenseurs et les unités de l'attaquant qui ne participent pas au combat.

`spell-definition.ts` documente le contrat et valide les données ; `spells.test.ts`
vérifie la validation et le catalogue. Fournir `testSpells` dans `GameState.spellDefinitions`
permet de lancer les instances en main avec `cast-spell`. Les tests de partie dans
`game-engine/src/spells.test.ts` couvrent paiement, pile, fenêtres de Réaction,
ciblage à la résolution, combat et expiration en fin de tour.

## Gears de test

`testGears` fournit deux définitions validées et figées par `defineGear` :

| Carte                  | ID       | Pose      | Équipement                  | Effet continu                        |
| ---------------------- | -------- | --------- | --------------------------- | ------------------------------------ |
| Bannière de ralliement | `banner` | 2 Énergie | —                           | +1 Might à toutes les unités alliées |
| Lame renforcée         | `blade`  | 1 Énergie | 1 Énergie + 1 Power color-1 | +2 Might au porteur                  |

Les coûts sont provisoires pour tester les mécaniques. Fournir ce catalogue dans
`gearDefinitions`, puis jouer avec `play-gear` et attacher avec `equip-gear`. Les effets
de Might sont continus, sans expiration de fin de tour. Les exceptions gear-unité ne sont
pas encore représentées. `gears.test.ts` vérifie les données ; les scénarios du moteur
vérifient les paiements, les bonus, les déplacements du porteur et son décès.

## Première capacité de mort

`deathTestUnits` fournit le Gardien du dernier souffle (`reborn`, 1 Might, coût 1 Énergie)
et l'Esprit gardien (`spirit`, jeton de 3 Might). `onDeath` référence la définition à invoquer.
Fournir les deux au moteur : il demandera une destination légale après le transfert des
morts au cimetière, puis ouvrira une fenêtre de Réaction. Le coût imprimé zéro du jeton
sert à sa définition ; l'invocation ne demande aucun paiement. Les valeurs de cette carte
sont destinées aux tests, sans équilibrage définitif.
