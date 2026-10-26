# Règles de référence

Ce document conserve les décisions de conception. Il décrit davantage que le prototype
actuel ; le README précise ce qui est implémenté. Les cas particuliers des cartes seront
introduits par des tests concrets.

## Tour

Awaken (Ready des cartes du joueur, runes comprises), Beginning (tenue et effets prévus),
Channel (2 runes utilisables), Draw (1 carte), Main (cartes et mouvements dans l'ordre choisi),
fin de tour. Énergie et Power flottants sont remis à zéro à la fin de Draw et du tour.
Une unité doit normalement être Ready pour un mouvement basique et devient Tap en bougeant.
Une unité jouée depuis la main entre Tap dans sa base.

Une pile de runes vide n'a aucune conséquence : prendre seulement les runes disponibles.
Si une pioche est demandée dans un deck vide, recycler toute sa défausse (cimetière)
dans le deck, mélanger, piocher et accorder un point à l'adversaire.
Si deck et défausse sont vides, le processus donnerait tous les points manquants à
l'adversaire : le joueur qui doit piocher perd la partie.

## Ressources et préparation

Six couleurs de runes. Tap une rune produit 1 énergie incolore ; renvoyer une rune sous
sa pile produit 1 Power de sa couleur. Les coûts peuvent demander les deux ressources.
Une rune déjà Tap peut être recyclée pour son Power. Une rune Ready peut donc produire
de l'Énergie puis être recyclée pour du Power dans le même paiement.
La légende a deux couleurs qui déterminent les couleurs autorisées ; elle peut Tap/Ready
et ne peut normalement pas être détruite. Le champion initial doit avoir le tag Champion
et partager au moins un tag avec la légende.

Zones prévues : main, deck, base, cimetière, bannissement, légende, champion, runes.
Les champs sont dynamiques : deux initialement en 1v1, un choisi par chaque joueur,
mais des effets peuvent en ajouter ou les remplacer.

## Contrôle et score

Le contrôle dépend de la présence d'unités. Pendant un Showdown, le défenseur conserve
temporairement le contrôle même s'il n'a plus d'unité ; le résultat est évalué à la clôture.
Tenir au début de son tour et conquérir donnent normalement un point.
Un joueur ne peut pas scorer de nouveau par tenue/conquête sur le même champ pendant
le même tour, même après l'avoir quitté. Conserver la source des points : CONQUEST,
HOLD, CARD_EFFECT, OTHER.

Victoire normale à 8 points, modifiable par les cartes. Le dernier point par conquête
exige d'avoir conquis ou tenu tous les autres champs pendant ce tour. La tenue et les
effets de cartes peuvent fournir le dernier point. Autres conditions de victoire/défaite possibles.

## Priorité et Showdown

Entrer sur un champ non contrôlé par son joueur ouvre un Showdown.
Open : pas d'unités adverses. Deux passes consécutives ferment la fenêtre.
Si un seul joueur a des unités à la clôture, il conquiert, sous réserve des règles de score.
Si les effets amènent des unités des deux côtés, après leur résolution le Showdown devient
un combat ; le premier arrivé est l'attaquant.

Combat : attaquant prioritaire puis défenseur. Deux passes successives terminent la fenêtre
d'Action et lancent les dégâts. Les cartes normales sont jouables pendant son tour hors
Showdown ; les Actions sont aussi jouables en Showdown avec la priorité ; les Réactions
permettent de répondre avant résolution.

Après une chaîne complète, la priorité normale revient au joueur qui n'a pas joué sa
première carte. Entre les effets de la pile, une nouvelle fenêtre de Réaction s'ouvre.
Sa première priorité revient à l'attaquant (premier arrivé en Open), ou au joueur actif
hors Showdown. Deux passes autorisent la résolution de l'effet au sommet.

Timings des sorts : Normal seulement pendant sa Main hors Showdown ; Action également
avec priorité en open state de Showdown (aucun effet en attente) ; Réaction dans ces
fenêtres et en réponse en closed state. Une Réaction peut répondre à une Réaction.
Tout sort, même Normal, et toute capacité déclenchée ouvrent une fenêtre de Réaction.
Open/closed state est distinct du type Open/Combat Showdown.

Pour les quatre sorts de test, bonus et malus de Might ainsi que Stun durent jusqu'à
la fin du tour courant. Le déplacement par sort ou capacité ignore Ready et conserve
l'état Ready/Tap de l'unité. Le sort de Stun cible uniquement une unité attaquante,
jamais une unité défendant le champ.

## Combat et mort

Dégâts simultanés égaux à la Might contributive. Stun et d'autres effets peuvent empêcher
une unité de contribuer. Chaque joueur distribue ses dégâts aux adversaires : assigner
de quoi tuer une cible avant de passer à la suivante, et assigner tous les dégâts possibles,
sauf excédent quand toutes les cibles seraient mortes. Une dernière cible peut recevoir un
reliquat non mortel. Pas de buff/debuff joué pendant l'application des dégâts.

Tank doit être traité en priorité, ordre libre entre Tanks. Backline après les cibles
non Backline. Tank + Backline peut être ciblé avec les Tanks ou ignoré jusque derrière les
unités normales ; les cas plus complexes seront fixés avec des cartes représentatives.

Les dégâts atteignant la Might tuent ; Might 0 exige au moins un dégât.
Les morts sont irréversibles mais restent temporairement sur le terrain.
Toutes les unités survivantes de la partie sont soignées, même hors du combat.
Les effets de mort se déclenchent ensuite juste avant le transfert au cimetière.
Toutes les morts concernées sont au cimetière avant le choix des cibles des effets.

L'attaquant ordonne et empile ses effets, puis le défenseur les siens. Résolution du dernier
au premier : le défenseur résout les siens avant l'attaquant. Les effets de nouvelles morts
rejoignent le sommet de la pile restante. Des Réactions sont possibles à chaque effet.
Aucune nouvelle fenêtre d'Action après les dégâts dans ce même combat.

Après tous les effets : attaquant seul = conquête éventuelle ; défenseur seul = maintien ;
les deux = retraite de l'attaquant en base ; aucun = champ sans contrôleur.
Exception : si le défenseur a été éliminé puis a reçu de nouvelles unités par effet de mort,
et que les deux camps sont présents après toute la résolution, un nouveau Combat Showdown
commence sans score intermédiaire, avec les mêmes rôles, priorité et déroulement.

## Évolution

1v1 d'abord. FFA et équipes ensuite : listes de joueurs et équipes, relations allié/ennemi,
sans inscrire des règles FFA non confirmées dans le fonctionnement actuel.
