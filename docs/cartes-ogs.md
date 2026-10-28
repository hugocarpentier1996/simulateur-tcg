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
| OGS-003/024 Incinerate         | Action, 2 Énergie, 2 dégâts à une unité sur un champ                  | Ciblage, persistance, mort, Highlander, effets de mort et absence de score prématuré                             | Hors decks de démo                |
| OGS-022/024 Final Spark        | Action, 8 Énergie, 8 dégâts à une unité                               | Cible en base/champ, coût, refus à 7 énergie, dégâts létaux/non létaux                                           | Hors decks de démo                |
| OGS-008/024 Gentlemen's Duel   | Action, 6 Énergie + 1 orange ; +3 Might puis duel                     | Deux cibles, dégâts simultanés d'unités hors combat, Stun, réactions, Highlander                                 | Hors decks de démo                |
| OGS-012/024 Blast of Power     | Action, 6 Énergie + 1 jaune ; tue une unité sur un champ              | Mort sans dégâts, ciblage, coût, Highlander, jeton et capacité de mort                                           | Hors decks de démo                |

Définitions exportées : `vanguardAttendant`, `zephyrSage`, `garenBody`, `garenOrder`, `masterYiBody`, `masterYiCalm`, `highlander`, `incinerate`, `finalSpark`, `gentlemensDuel`, `blastOfPower`, dans `packages/game-data/src/ogs`.
Firestorm OGS-002 est également exporté (`firestorm`) : sort Normal, 6 Énergie + 1 rouge,
3 dégâts simultanés aux ennemis d'un champ. Tests de portée, timing, morts et bonus Annie.
Hors decks de démo.

Texte et URL d'image conservés comme métadonnées ; aucune image téléchargée.
Tests : `packages/game-engine/src/ogs-vanguard-attendant.test.ts`.
Tests Shield : `packages/game-engine/src/ogs-zephyr-sage.test.ts`.

## Confirmations à appliquer aux prochaines cartes

- Fury rouge, Calm vert, Mind bleu, Body orange, Chaos violet, Order jaune.
- Power bicolore : quantité totale payable avec n'importe quelle combinaison des deux
  couleurs de la carte. Un symbole flexible est implémenté pour Decisive Strike ;
  les deux symboles de Tibbers sont pris en charge par `powerChoiceAmount`.
- Mort si dégâts non nuls >= Might actuelle, y compris après baisse de Might. Dégâts
  conservés jusqu'aux soins globaux de fin de combat/fin de tour. Raccordé avec Incinerate,
  y compris la perte d'une aura ou du bonus de Master Yi lors d'un paiement.
- Capacités ADD : production sans fenêtre de réaction, implémentée avec Lux OGS-014.
- Shield/Assault : défense/attaque uniquement dans un Combat Showdown, jamais en Open,
  jusqu'à la clôture. Shield et Assault sont implémentés.

### Annie Fury OGS-001 — sorts et capacités raccordés

5 Énergie, 1 rouge, 4 Might, arrivée Tap. Bonus continu de +1 par instance de dégâts
de sort, cumulable, toutes zones. Tests : coût, Ready/Tap/Stun, cumul, départ de source,
instances multiples, exclusion du combat et du duel. Export `annieFury`.
Le calcul partagé est raccordé et testé avec la capacité de dégâts de Tibbers,
y compris le bonus simultané quand Annie meurt dans les mêmes dégâts. Hors decks de démo.

## Reprise

Flash OGS-011 (`flash`) terminé : Réaction à 2 Énergie, déplacement de 0 à 2 alliés
en base sans soin ni épuisement. Tests des sélections, équipements et de la réponse
à Blast of Power. Hors decks de démo.

Decisive Strike OGS-024 (`decisiveStrike`) terminé : 5 Énergie + un Power orange ou
jaune, +2 Might aux alliés présents à la résolution jusqu'à la fin du tour. Paiement,
timing Action, portée et expiration testés. Hors decks de démo.

6 cartes restent à terminer : Annie Chaos, Recruit the Vanguard et les quatre légendes. Procéder carte par carte en TDD et commit/push après
chaque carte validée, en mettant ce tableau à jour. Demander les précisions propres
à chaque mécanique lors de sa tranche, sans préconstruire tous les systèmes.
L'arrivée Ready est une propriété statique de mise en jeu, pas un effet mis sur la pile.
Gentlemen's Duel confirmé : deux cibles au lancement, Stun n'empêche pas le duel,
dégâts directement infligés par les unités (ni sort, ni capacité, ni combat).

### Lux Order OGS-014

Unité 4 Énergie, 2 Might, arrivée Tap. Capacité Réaction : épuiser Lux pour ajouter
2 énergie réservée aux sorts. Production immédiate sans empilement ni transfert de
priorité. Le paiement automatique utilise cette réserve en premier ; unités, gears
et équipement ne peuvent pas la dépenser. Expiration aux frontières End/Draw.
Export `luxOrder`, hors decks de démonstration. 15 cartes complètes et Annie Fury partielle.

### Lux Mind OGS-006

Unité 6 Énergie + 1 bleu, 5 Might, arrivée Tap. Chaque sort allié joué de coût
imprimé 5+ Énergie déclenche +3 Might sur cette Lux jusqu'à la fin du tour.
Le bonus est empilé après le sort, résout avant lui et permet les Réactions.
Cumul, plusieurs Lux, seuil, coût, disparition de la source et expiration testés.
Export `luxMind`, hors decks de démonstration. 16 cartes complètes, Annie Fury partielle.
Ordre provisoire des déclenchements simultanés : ordre des unités de l'état.

### Tibbers OGS-018

8 Énergie, 2 Power rouge/violet, 7 Might, arrivée Tap. Sa mise en jeu empile une capacité
infligeant 3 dégâts simultanés aux unités présentes sur tous les champs à la résolution.
Alliés et Tibbers compris, bases exclues. Réponse Flash, bonus Annie, morts simultanées,
effets de mort et paiements bicolores testés. Export `tibbers`, hors decks de démo.
Bilan courant : 18 cartes complètes, dont Annie Fury désormais raccordée aux capacités.

### Annie Chaos OGS-010

Export `annieChaos` : 4 Énergie + 1 violet, 3 Might, Tap. Récupère un sort du cimetière
choisi avant les réactions, puis revérifié à la résolution. Main/champion et actions
légales raccordés. Sans cible disponible : jouable, effet vide. Hors decks de démo.
