# Suivi des cartes OGS — Proving Grounds

Source locale : `ListeCartes/OGS - Proving Grounds/cartes.json`, 24 cartes.
Seul ce JSON a été lu, aucune image analysée. Les identifiants OGS distinguent les
différentes cartes portant le même nom. Les fichiers bruts restent hors de ces commits.

## Cartes terminées

| Carte                          | Implémentation                                                        | Vérification                                                                                                     | Interface                         |
| ------------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| OGS-016/024 Vanguard Attendant | 6 Énergie, 1 Power jaune, 5 Might ; `entersReady`                     | Coût réel, arrivée Ready base/champ contrôlé, déplacement immédiat, refus coût/couleur/destination               | Pas encore dans les decks de démo |
| OGS-005/024 Zephyr Sage        | 6 Énergie, 1 Power vert, 6 Might ; Shield 1                           | Bonus en défense pendant Combat Showdown seulement, dégâts/seuil létal, survie puis soin et disparition du bonus | Pas encore dans les decks de démo |
| OGS-007/024 Garen (Body)       | 6 Énergie, 1 orange, 5 Might ; Assault 2 / Shield 2                   | Combat attaque/défense, non-cumul, absence en Open, coût et Tap                                                  | Hors decks de démo                |
| OGS-009/024 Master Yi (Body)   | 7 Énergie, 1 orange, 6 Might ; Ready et Ganking                       | Champ à champ, Ready/Tap, contrôle au départ, Open/combat/renfort, registre des scores et actions légales        | Hors decks de démo                |
| OGS-020/024 Highlander         | Réaction, 4 Énergie ; prochaine mort remplacée par rappel Tap et soin | Cible alliée, conservation effets/équipement, usage unique, expiration, jeton, dégâts simultanés                 | Hors decks de démo                |
| OGS-004/024 Master Yi (Calm)   | 5 Énergie, 1 vert, 4 Might ; +4 avec 8 runes en jeu                   | Seuil 7/8/9, Ready/Tap, exclusions, recyclage Power, coût, combat                                                | Hors decks de démo                |
| OGS-013/024 Garen (Order)      | 6 Énergie, 1 jaune, 5 Might ; +1 aux autres alliés ici                | Base/champ, exclusions, cumul, déplacement, coût, mort et soin en combat                                         | Hors decks de démo                |

Définitions exportées : `vanguardAttendant`, `zephyrSage`, `garenBody`, `garenOrder`, `masterYiBody`, `masterYiCalm`, `highlander`, dans `packages/game-data/src/ogs`.
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
  jusqu'à la clôture. Shield et Assault sont implémentés.

## Reprise

17 cartes restent à implémenter. Procéder carte par carte en TDD et commit/push après
chaque carte validée, en mettant ce tableau à jour. Demander les précisions propres
à chaque mécanique lors de sa tranche, sans préconstruire tous les systèmes.
L'arrivée Ready est une propriété statique de mise en jeu, pas un effet mis sur la pile.
Prochaine carte envisagée : Incinerate OGS-003, dégâts de sort et morts hors combat.
