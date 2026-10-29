# Règles de référence

Ce document conserve les décisions de conception. Il décrit davantage que le prototype
actuel ; le README précise ce qui est implémenté. Les cas particuliers des cartes seront
introduits par des tests concrets.

## Début de partie

Chaque joueur prépare 39 cartes dans son main deck, un chosen champion séparé
(la quarantième carte), une légende constante et 12 runes. Les runes peuvent avoir
au maximum deux couleurs, exclusivement celles de la légende : rouge, vert, bleu,
orange, violet ou jaune. Légende et chosen champion sont sélectionnés avant les dés.

Chaque joueur apporte trois battlefields. En BO1, un est choisi aléatoirement par joueur.
En BO3, chacun choisit son battlefield avant de connaître le résultat des dés de la
première manche, puis à nouveau avant chaque manche. Deux champs sont donc en jeu.

En BO1 et à la première manche d'un BO3, chaque joueur lance un d20. En cas d'égalité,
les deux relancent ; sinon le plus haut résultat choisit qui commence. Aux manches
2 et 3 d'un BO3, le perdant de la manche précédente choisit qui commence, sans dés.

Un BO3 est remporté dès deux victoires de manche : 2–0 ou 2–1. Il n'y a pas de
troisième manche après un 2–0. Chaque joueur conserve ses trois battlefields distincts
pendant la série et ne peut utiliser chacun qu'une seule fois dans ce BO3. Cette limite
est propre au joueur : elle n'interdit pas la copie de la même carte chez son adversaire.

Les joueurs reçoivent quatre cartes et peuvent effectuer un mulligan de deux cartes
au maximum. Les cartes remplacées sont recyclées sous le deck, sans mélange, puis
le joueur pioche autant de remplaçantes. La légende et le champion restent séparés.
La pioche habituelle au début du premier tour porte donc la main à cinq cartes.
Le premier joueur Channel deux runes ; le second en Channel trois à son premier tour
uniquement. Ensuite, chacun en Channel deux.

## Tour

Awaken (Ready des cartes du joueur, runes comprises), Beginning (tenue et effets prévus),
Channel (2 runes utilisables), Draw (1 carte), Main (cartes et mouvements dans l'ordre choisi),
fin de tour. Énergie et Power flottants sont remis à zéro à la fin de Draw et du tour.
Une unité doit normalement être Ready pour un mouvement basique et devient Tap en bougeant.
Elle peut aller de sa base vers un champ, ou d’un champ vers sa propre base, sans coût.
Ce retour volontaire ne soigne pas les dégâts et conserve les autres états de l’unité.
Ganking autorise également le mouvement entre deux champs distincts, en conservant ces
conditions Ready/Tap. Quitter un champ sans y laisser d'unité lui fait perdre son contrôle,
sans effacer les points déjà scorés ce tour. « I enter ready » remplace l'arrivée Tap.
Une unité jouée entre Tap, uniquement dans sa base ou sur un battlefield contrôlé.
Le chosen champion peut être joué depuis sa zone, avec les mêmes coûts et restrictions
que depuis la main ; il quitte alors sa zone de champion.

Une pile de runes vide n'a aucune conséquence : prendre seulement les runes disponibles.
Si une pioche est demandée dans un deck vide, recycler toute sa défausse (cimetière)
dans le deck, mélanger, piocher et accorder un point à l'adversaire.
Si deck et défausse sont vides, le processus donnerait tous les points manquants à
l'adversaire : le joueur qui doit piocher perd la partie.

## Ressources et préparation

Correspondance des domaines : Fury = rouge, Calm = vert, Mind = bleu, Body = orange,
Chaos = violet, Order = jaune. Un coût de Power bicolore peut être payé avec n'importe
quelle combinaison des deux couleurs de la carte (ex. deux de la même ou une de chaque).

Six couleurs de runes. Tap une rune produit 1 énergie incolore ; renvoyer une rune sous
sa pile produit 1 Power de sa couleur. Les coûts peuvent demander les deux ressources.
Une rune déjà Tap peut être recyclée pour son Power. Une rune Ready peut donc produire
de l'Énergie puis être recyclée pour du Power dans le même paiement.
La légende a deux couleurs qui déterminent les couleurs autorisées ; elle peut Tap/Ready
et ne peut normalement pas être détruite. Le champion initial doit avoir le tag Champion
et partager au moins un tag avec la légende.

Zones prévues : main, deck, base, cimetière, bannissement, légende, champion, runes.
Les champs sont dynamiques : deux initialement en 1v1, un par joueur selon le format,
mais des effets peuvent en ajouter ou les remplacer.

## Gears et équipements

Les gears sont des permanents distincts des unités, sauf précision de carte. Ils arrivent
Ready, dans la base par défaut. Ils ne subissent pas de dégâts et ne se déplacent pas
de manière autonome. Ils peuvent avoir un effet passif, par exemple +1 Might pour toutes
les unités alliées, y compris en base et sur les champs.

Un gear équipement est d'abord posé, puis son coût d'équipement supplémentaire permet
de l'attacher à une unité alliée. Pose et équipement se font pendant sa Main hors Showdown,
avec paiement en Énergie/Power, sans épuiser le gear. Un bonus d'équipement comme +2 Might
dure tant que l'équipement est attaché et ne s'expire pas en fin de tour.

L'équipement suit les déplacements de son porteur. Tant que celui-ci est vivant,
il ne peut pas être rééquipé sur une unité, même en payant à nouveau. À la mort du porteur,
il revient en base, détaché, et peut être équipé à nouveau contre son coût.

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

Si une conquête devrait fournir le huitième point sans satisfaire cette condition,
le joueur pioche une carte à la place et reste à sept points. Le champ est néanmoins
inscrit comme scoré pour ce joueur ce tour : il compte pour la condition des autres
conquêtes et ne peut plus donner de point ni de pioche de remplacement ce tour.
Cette règle s'applique aux conquêtes après Open comme après Combat Showdown.
Atteindre le seuil par un gain autorisé termine immédiatement la partie.

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
Exception : les capacités de type ADD produisant des ressources ne permettent aucune
Réaction (notamment Lux OGS-014). Ce n'est pas une fenêtre de pile ordinaire.
Open/closed state est distinct du type Open/Combat Showdown.

Pour les quatre sorts de test, bonus et malus de Might ainsi que Stun durent jusqu'à
la fin du tour courant. Le déplacement par sort ou capacité ignore Ready et conserve
l'état Ready/Tap de l'unité. Le sort de Stun cible uniquement une unité attaquante,
jamais une unité défendant le champ.

## Combat et mort

Gentlemen's Duel : les deux unités sont choisies au lancement (une alliée, une ennemie).
Le +3 Might jusqu'à la fin du tour est appliqué avant les dégâts réciproques, calculés
sur leurs Might actuelles. Stun ne bloque pas ces dégâts : il bloque ceux de combat.
Les unités infligent elles-mêmes les dégâts du duel, hors combat. Ce ne sont des dégâts
ni de sort ni de capacité : les futures préventions réservées à ces sources ne s'y appliquent pas.

Highlander protège une unité alliée jusqu'à la fin du tour courant. Sa prochaine mort
est remplacée par un rappel Tap en base : ses dégâts sont soignés immédiatement,
ses équipements, bonus, malus et Stun sont conservés. Ce rappel n'est pas un déplacement
et ne déclenche pas de capacité de mort. La protection est consommée par ce rappel.
Implémentation actuelle : morts de combat, dégâts de sort, baisse de Might et mort
directe avec Blast of Power. « Kill » tue sans infliger de dégâts.
Pour Blast of Power, la cible doit encore être sur un battlefield à la résolution.
Si elle est revenue en base, le sort ne la tue pas ; le coût reste payé et le sort
rejoint le cimetière. Ce cas est testé avec Flash joué en réaction à Blast of Power.
Flash déplace jusqu'à deux unités alliées en base en conservant leur état Ready/Tap,
leurs modificateurs et leurs dégâts : ce déplacement ne soigne pas.

Shield N donne +N Might uniquement à une unité qui défend sur le champ d'un Combat
Showdown. Assault N applique le bonus uniquement à une unité attaquante dans ce même
contexte. Sans nombre, le bonus vaut 1. Aucun bonus dans un Open Showdown, en base
ou sur un autre champ. Le bonus dure jusqu'à la clôture du Combat Showdown.

Dégâts simultanés égaux à la Might contributive. Stun et d'autres effets peuvent empêcher
une unité de contribuer. Chaque joueur distribue ses dégâts aux adversaires : assigner
de quoi tuer une cible avant de passer à la suivante, et assigner tous les dégâts possibles,
sauf excédent quand toutes les cibles seraient mortes. Une dernière cible peut recevoir un
reliquat non mortel. Pas de buff/debuff joué pendant l'application des dégâts.

Tank doit être traité en priorité, ordre libre entre Tanks. Backline après les cibles
non Backline. Tank + Backline peut être ciblé avec les Tanks ou ignoré jusque derrière les
unités normales ; les cas plus complexes seront fixés avec des cartes représentatives.

Les dégâts atteignant la Might tuent ; Might 0 exige au moins un dégât.
Plus généralement, une unité meurt si ses dégâts sont non nuls et supérieurs ou égaux
à sa Might actuelle. Une baisse de Might après des dégâts peut donc la tuer.
Les dégâts non mortels, y compris ceux des sorts, restent jusqu'au soin global de fin
de combat ou de fin de tour ; la résolution d'un sort ne soigne pas par elle-même.
Les morts sont irréversibles mais restent temporairement sur le terrain.
Toutes les unités survivantes de la partie sont soignées, même hors du combat.
Les effets de mort se déclenchent ensuite juste avant le transfert au cimetière.
Toutes les morts concernées sont au cimetière avant le choix des cibles des effets.

Première carte de test : le Gardien du dernier souffle invoque à sa mort un jeton de
3 Might. Le propriétaire choisit sa base ou un champ qu'il contrôle. Le défenseur peut
donc invoquer sur le champ du combat dont il conserve le contrôle ; l'attaquant ne peut
pas invoquer sur ce champ adverse. Le jeton entre Tap et disparaît à sa mort, sans carte
au cimetière. Aucun point n'est attribué entre le combat initial et sa relance éventuelle.

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

## Choix des cartes OGS

Annie Chaos : le sort récupéré est choisi à l’empilement de sa capacité, avant les réactions.
Recruit the Vanguard : les destinations des quatre Recrues sont choisies à l’empilement
du sort, avant les réactions. Ces choix sont revérifiés à la résolution.

## Portée des dégâts de zone

Un battlefield comprend deux zones en 1v1 : le côté allié et le côté ennemi du même
battlefield. Cette distinction doit pouvoir servir à la portée des effets futurs.
Les dégâts de zone peuvent avoir un traitement distinct des dégâts ciblant une unité,
en indiquant la ou les zones concernées : battlefield entier ou côté concerné.
Les règles de dégâts, bonus et mort restent celles applicables à la source de l'effet.

Représentation moteur : un côté est référencé par le battlefield et le joueur
(`BattlefieldSide`). La position structurée est dérivée de la zone parente et du
propriétaire de l'unité ; le contrôle du battlefield ne change pas l'identité des côtés.
Une union de plusieurs zones décrit la portée d'un même effet de dégâts de zone.

Les légendes sont toujours présentes, sans points de vie ; leurs passifs restent actifs
même Tap. Les futures capacités activées pourront demander Tap et un coût supplémentaire.
Dark Child : choix des runes avant les réactions, puis passage au tour suivant après la pile.
Might of Demacia : seuil de quatre unités vérifié à la conquête et à la résolution.

Pour les unités autorisées sur un « open battlefield », le champ doit être entièrement
vide ; base propre et champs contrôlés restent autorisés. La réduction d’énergie
d’Eager Apprentice ne modifie pas le coût imprimé utilisé par Lux et Lady of Luminosity.

## Sortie du terrain et Gust

Une unité qui quitte le terrain pour la main ou toute autre zone hors terrain perd
ses dégâts, bonus, malus et Stun. Ses équipements se détachent et retournent en base.
Un jeton quittant le terrain disparaît. Le passage d'un battlefield à la base reste
un déplacement sur le terrain et ne relève pas de cette remise à zéro.
Gust revérifie ses restrictions de cible à la résolution : si la Might de la cible
dépasse 3 après les réactions, le sort fizzle et ne renvoie pas l'unité en main.

## Précisions Origins — capacités et conditions

- Noxian Drummer : « here » impose l'invocation du jeton sur le battlefield d'arrivée,
  même non contrôlé ou ennemi ; le joueur ne choisit pas une autre destination.
- Noxian Drummer retiré du terrain par Gust avant résolution : « here » n’a plus
  de destination ; aucune Recrue n’est invoquée.
- Traveling Merchant : si la main est vide, la pioche s'effectue sans défausse.
- Dune Drake : présence d'un ennemi Ready vérifiée à l'attaque et à la résolution
  de sa capacité déclenchée, après les réactions, avant les dégâts de combat.
  Cette seconde vérification n'attend pas la résolution ou la fin du combat.
- Stupefy : une cible déjà à 0 Might reste à 0 ; la pioche indépendante a lieu.

## Validation des déplacements

Le joueur peut préparer les déplacements de plusieurs unités Ready, puis les valider
ensemble avant l'ouverture d'un Showdown. Les unités qui attaquent le même champ
arrivent donc ensemble, avant les capacités d'attaque et les réactions.

## Préparation de la démonstration Proving Grounds

À chaque nouvelle partie BO1 de cette démo, chaque joueur reçoit au hasard l'une des
quatre listes fournies. Le chosen champion est choisi parmi les champions appropriés
présents dans sa liste ; son exemplaire est retiré des 40 cartes avant le mélange
et la pioche. La démo utilise directement le battlefield unique indiqué par la liste,
exception confirmée au choix normal parmi trois. Les runes sont également mélangées.
