# Suivi des cartes OGS — Proving Grounds

Source locale : `ListeCartes/OGS - Proving Grounds/cartes.json`, 24 cartes.
Seul ce JSON a été lu, aucune image analysée. Les identifiants OGS distinguent les
différentes cartes portant le même nom. Les fichiers bruts restent hors de ces commits.

## Cartes terminées

| Carte                          | Implémentation                                    | Vérification                                                                                                     | Interface                         |
| ------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| OGS-016/024 Vanguard Attendant | 6 Énergie, 1 Power jaune, 5 Might ; `entersReady` | Coût réel, arrivée Ready base/champ contrôlé, déplacement immédiat, refus coût/couleur/destination               | Pas encore dans les decks de démo |
| OGS-005/024 Zephyr Sage        | 6 Énergie, 1 Power vert, 6 Might ; Shield 1       | Bonus en défense pendant Combat Showdown seulement, dégâts/seuil létal, survie puis soin et disparition du bonus | Pas encore dans les decks de démo |

Définitions exportées : `vanguardAttendant` et `zephyrSage`, dans `packages/game-data/src/ogs`.
Texte et URL d'image conservés comme métadonnées ; aucune image téléchargée.
Tests : `packages/game-engine/src/ogs-vanguard-attendant.test.ts`.
Tests Shield : `packages/game-engine/src/ogs-zephyr-sage.test.ts`.

## Confirmations à appliquer aux prochaines cartes

- Fury rouge, Calm vert, Mind bleu, Body orange, Chaos violet, Order jaune.
- Power bicolore : quantité totale payable avec n'importe quelle combinaison des deux
  couleurs de la carte. À implémenter avant Tibbers ou Decisive Strike ; le modèle actuel
  de coûts fixes par couleur ne suffit pas pour ce choix.
- Mort si dégâts non nuls >= Might actuelle, y compris après baisse de Might. Dégâts
  conservés jusqu'aux soins globaux de fin de combat/fin de tour. À raccorder lors des
  cartes de dégâts : ne pas considérer cette confirmation comme déjà entièrement codée.
- Capacités ADD : production sans fenêtre de réaction, à introduire avec Lux OGS-014.
- Shield/Assault : défense/attaque uniquement dans un Combat Showdown, jamais en Open,
  jusqu'à la clôture. Shield est implémenté ; Assault reste à ajouter avec Garen OGS-007.

## Reprise

22 cartes restent à implémenter. Procéder carte par carte en TDD et commit/push après
chaque carte validée, en mettant ce tableau à jour. Demander les précisions propres
à chaque mécanique lors de sa tranche, sans préconstruire tous les systèmes.
L'arrivée Ready est une propriété statique de mise en jeu, pas un effet mis sur la pile.
Prochaine carte simple : Garen OGS-007 (Assault 2 et Shield 2), dont le timing est confirmé.
