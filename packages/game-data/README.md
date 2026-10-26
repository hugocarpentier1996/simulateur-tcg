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
