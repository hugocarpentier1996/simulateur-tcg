# Questions regroupées — Origins

## Réponses de la première fournée, implémentées dans la deuxième

1. **Gust — confirmé le 28 octobre 2026.** Toute sortie du terrain remet l'unité
   à zéro : dégâts, bonus/malus et Stun supprimés, équipements détachés en base.
   Un jeton quittant le terrain disparaît. Gust revérifie la Might à la résolution :
   si elle dépasse 3, le sort fizzle (aucun retour en main).
2. **Noxian Drummer — confirmé.** « Here » impose l'invocation de la Recrue sur
   le battlefield d'arrivée, même ennemi/non contrôlé. Aucun choix de destination.
   Précision supplémentaire : si Gust retire Noxian du terrain, « here » n'a plus
   de destination et aucune Recrue n'est invoquée. Test corrigé en conséquence.
3. **Traveling Merchant — confirmé.** Si la main est vide, on pioche sans défausser.
4. **Dune Drake — confirmé.** Vérifier la présence d'un ennemi Ready à l'attaque
   puis à la résolution de la capacité déclenchée, après les réactions et avant les
   dégâts du combat. Il ne s'agit pas d'une vérification à la fin du combat.
5. **Stupefy — confirmé.** Une unité déjà à 0 Might reste à 0 ; la pioche a lieu.

Les cinq comportements sont maintenant implémentés et testés.

## Questions après la deuxième fournée

1. **Noxian Drummer déplacé en réaction sans quitter le terrain.** Si Flash le
   ramène en base, ou si un effet le déplace vers un autre battlefield, « here »
   suit-il sa nouvelle position, ou l'invocation échoue-t-elle ? La correction Gust
   couvre la sortie du terrain. Pour un déplacement interne, le moteur conserve
   provisoirement le champ d'arrivée initial tant que la source est en jeu.
2. **Traveling Merchant — moment du choix.** La carte à défausser est actuellement
   choisie à la résolution, après les réactions, parmi les cartes alors en main.
   Confirmer ce moment ou demander un choix annoncé à l'empilement.

Ces deux choix provisoires ne sont pas ajoutés aux règles confirmées.

## Déjà confirmé pour le lot

- Open battlefield = champ entièrement vide, en plus des destinations normales.
- Eager Apprentice : Lux et Lady vérifient toujours le coût imprimé.
- Deflect : 1 Power quelconque pour chaque choix adverse, pas de supplément pour
  des dégâts de zone sans choix individuel.

Les mécaniques non listées seront traitées à partir du texte imprimé et des règles
existantes ; seuls les nouveaux doutes utiles rejoindront le prochain lot de questions.

## Questions ajoutées pendant la troisième fournée

- Deflect : si aucune cible de capacité obligatoire ne peut être payée, le prototype autorise la mise en jeu sans cible (capacité sans effet). Confirmer ce comportement.
- Le cas « here » après déplacement interne concerne aussi Faithful Manufactor ; son lieu initial est conservé provisoirement, comme Noxian.

- Crackshot Corsair : « here » conserve également le champ annoncé tant que sa source reste en jeu ; sa sortie du terrain annule les dégâts. Même question de déplacement interne que Noxian/Manufactor.
- Captain Farron / Taric (hypothèse) : un Assault ou Shield accordé par une autre unité s'ajoute à la valeur imprimée de l'unité qui le reçoit.
- Darius (hypothèse) : Legion « ready me » est appliqué à l'entrée en jeu, sans passer par la pile ni ouvrir de fenêtre de réaction.
- Falling Star / instructions multiples (hypothèse) : chaque instruction choisit sa cible au lancement ; la même unité peut être choisie plusieurs fois.
- Contre (Wind Wall, Defy) : le sort contré va au cimetière de son propriétaire et n'est pas « joué » (aucun déclenchement de sort joué).
- Ekko (hypothèse) : « Recycle me to ready your runes » est appliqué automatiquement (coût toujours accepté) tant que la carte est au cimetière.
- Pit Crew (hypothèse) : « When you play a gear, ready me » est appliqué immédiatement à la pose du gear, sans passer par la pile.
- Darius Fury (hypothèse) : le déclencheur « second card » s'applique immédiatement quand la carte est jouée (avant sa résolution), sans pile.
- Sona (hypothèse) : les 4 runes redressées sont choisies automatiquement (Tap d'abord) plutôt que par le joueur.
- Dr. Mundo (hypothèse) : les 3 cartes recyclées sont les plus anciennes du cimetière, sans choix du joueur ; l'effet s'applique sans pile au début de la Beginning.
- Navori Fighting Pit (hypothèse) : l'unité buffée est choisie automatiquement parmi les alliées présentes (non buffée d'abord) ; la carte dit « a unit here ».
