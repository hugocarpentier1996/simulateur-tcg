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
