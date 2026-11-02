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
- Relentless Storm (hypothèse) : le « you may » est accepté automatiquement quand la légende est Ready ; Mighty évalué sur la Might imprimée de l'unité jouée.
- Déclencheurs simples appliqués sans pile (hypothèse de prototype, à confirmer) : Cithria of Cloudfield, Jinx (Chaos), Eclipse Herald, Radiant Dawn, Solari Shrine, Scrapheap, Yasuo (Chaos), Back-Alley Bar, The Grand Plaza. Les « you may » de Solari Shrine et Relentless Storm sont acceptés automatiquement ; Radiant Dawn choisit l'unité buffée (sans buff d'abord).
- Eclipse Herald / Radiant Dawn : l'étourdissement est attribué à l'adversaire du propriétaire de l'unité étourdie (le moteur ne trace pas encore la source du Stun).
- Get Excited! (hypothèse) : la carte à défausser est choisie au lancement du sort, puis défaussée à la résolution (aucun effet si elle a quitté la main entre-temps).
- Hidden (hypothèses) : une seule carte cachée par champ (tous joueurs confondus) ; le nettoyage d'un champ perdu est appliqué après chaque action plutôt qu'au Cleanup ; jouer depuis facedown ignore tout le coût imprimé (énergie et Power), les coûts supplémentaires (Deflect…) restent dus.
- Overt Operation (hypothèse) : le « you may » est accepté automatiquement pour chaque unité alliée Tap et buffée (jamais pour une unité déjà Ready).
- Vanguard Helm (hypothèse) : sans pile ; l'unité buffée est choisie automatiquement (sans buff d'abord).
- The Harrowing (hypothèses) : le Power de l'unité jouée est payé avec le sort au lancement ; l'unité arrive dans la base, Tap, sans déclencher ses effets « when you play me ».
- Soulgorger / Spectral Matron (hypothèses) : l'unité sortie du cimetière arrive dans la base, Tap, sans ses effets « when you play me » ; le Power dû (Soulgorger) est payé avec l'unité qui la fait revenir.
- Portal Rescue (hypothèse) : l'unité rejouée arrive Tap et sans déclencher ses effets « when you play me ».
- Garbage Grabber (hypothèse) : les 3 cartes recyclées sont les plus anciennes du cimetière, sans choix (comme Dr. Mundo).
- Pirate's Haven (hypothèses) : sans pile ; le redressement d'Awaken (début de tour) et l'entrée en jeu Ready ne comptent pas.
- Mistfall (hypothèses) : sans pile ; le « you may » est accepté automatiquement dès que le gear est Ready et le Power payable (réserve ou runes).
- Reaver's Row (hypothèse) : le renvoi en base n'est pas traité comme un déplacement (aucun déclencheur de mouvement).
- Reinforce (hypothèses) : le reste du coût de l'unité est payé automatiquement (réserve puis runes) ; seules les unités payables sont proposées ; l'unité arrive dans la base, Tap, sans ses effets « when you play me ».
- Gears Hidden (hypothèse) : posés depuis facedown directement dans la base (la règle les place sur le champ puis les rappelle au Cleanup).
- The Boss (hypothèses) : le « you may » est accepté automatiquement dès que la légende est Ready et le Power payable ; le redressement à la conquête se fait sans pile.
- Légendes surnuméraires OGN-299 à OGN-310 (versions alternatives des légendes 247 à 269) : non ajoutées comme cartes distinctes (pas d'image locale) ; à confirmer si elles doivent l'être.
- Immortal Phoenix (hypothèse) : « tuer avec un sort » = au moins une unité meurt pendant l'action où un sort du joueur se résout (dégâts ou destruction).
- Malzahar (hypothèse) : il ne peut pas se tuer lui-même pour payer sa propre capacité.
- Icathian Rain (hypothèses) : les six cibles sont choisies une à une à la résolution (et non au lancement) ; la répartition du coût en Power (3) entre Fury et Mind n'est pas dans les données : 2 Fury + 1 Mind retenus.
- Karthus (hypothèse) : il compte s'il est en jeu juste avant les morts, y compris s'il meurt en même temps.
- Nocturne (limite) : seul le regard d'une Vision le déclenche pour l'instant (pas Reinforce, Baited Hook, The Candlelit Sanctum ni Stacked Deck).
- Karma (hypothèses) : sans pile ; l'unité buffée est choisie automatiquement (sans buff d'abord) ; les recyclages internes au deck autres que la Vision (Reinforce, The Candlelit Sanctum…) ne sont pas encore détectés.
- Ava Achiever (limite) : les sorts Hidden ne sont pas proposés (choix de cibles non géré dans ce cadre) ; l'unité jouée arrive Tap, sans ses effets « when you play me ».
- Heimerdinger (limite) : seules les capacités Tap à effet sont copiées, pas les capacités ADD de ressource.
- Mystic Reversal (limite) : « you may make new choices » n'est pas proposé, les choix d'origine sont conservés.
- Blind Fury (limite) : un gear ou un sort à cibles révélé reste banni sans être joué.
- Kai'Sa (Mind) (limite) : seuls les sorts sans cible individuelle sont proposés.
- Divine Judgment (hypothèse) : ordre des choix = lanceur puis adversaire, chacun voit les choix précédents ; les gears attachés à une unité recyclée restent en jeu détachés ; les unités adverses contrôlées (`cardOwnerId`) retournent au deck de leur propriétaire.
- Promising Future (hypothèse/limite) : une carte dont le Power est impayable, ou un sort à cibles, est recyclée sous le deck ; les unités jouées n'ont pas leurs effets « when you play me ».

## Réponses du 1er novembre 2026 — à implémenter plus tard

Réponses de l'utilisateur aux 29 questions de la quatrième fournée. Rien n'est encore
implémenté ; chaque point deviendra une correction testée et commitée séparément.

### Options d'ergonomie à créer (communes à toutes les cartes)

- **Refus automatique des réactions** : case à cocher qui passe automatiquement toutes les
  fenêtres de réaction (pour tous les déclencheurs, pas seulement ceux listés au point 7).
- **« You may » sans coût** : acceptés automatiquement par défaut ; case à cocher commune
  pour être consulté à chaque fois. Un « you may » avec un coût est **toujours** demandé.
- **Deflect** : par défaut le coût Deflect est payé ; option (désactivée par défaut) pour
  pouvoir refuser de le payer.
- **Choix manuel de Sona** : option sur la carte pour choisir les runes à la main ; par défaut
  automatique.

### Réponses point par point

1. **« Here » suit la carte** : si la source est déplacée (Flash, autre champ…), « here »
   désigne sa nouvelle position (Noxian Drummer, Faithful Manufactor, Crackshot Corsair).
2. **Traveling Merchant** : choix de la carte à défausser à la résolution (comportement actuel).
3. **Get Excited!** : la carte à défausser est choisie à la **résolution**, pas au lancement.
   La cible du sort, elle, est choisie au lancement.
4. **Sorts à instructions multiples** : cibles choisies au lancement. La même cible peut être
   choisie plusieurs fois, sauf texte contraire (Singularity : « up to 2 units » = 2 unités
   distinctes, différent de « 2 times »).
5. **Icathian Rain** : même réponse que pour le point 4 → cibles choisies au lancement
   (corriger le choix à la résolution actuel). Répartition du coût Power : **au choix du
   joueur**, comme pour tous les sorts multicolores (le coût de 3 Power accepte n'importe
   quelle combinaison de Fury et de Mind) — à généraliser aux autres sorts multicolores.
6. **Divine Judgment** : confirmé. Précision : les gears attachés qui restent sur le terrain
   **comptent** dans les 2 gears gardés.
7. **Déclencheurs** : tous passent par la pile et ouvrent une fenêtre de réaction (supprimer
   les applications immédiates : Darius, Pit Crew, Ekko, Dr. Mundo, Cithria, Jinx Chaos,
   Eclipse Herald, Radiant Dawn, Solari Shrine, Scrapheap, Yasuo Chaos, Back-Alley Bar,
   The Grand Plaza, Vanguard Helm, Pirate's Haven, Mistfall, Karma, The Boss…).
   Darius Fury : l'effet fonctionne aussi s'il est lui-même la deuxième carte jouée.
8. **« You may »** : voir options ci-dessus (auto sans coût, toujours demandé avec coût).
9. **Sona** : automatique par défaut, option de choix manuel.
10. **Dr. Mundo / Garbage Grabber** : le joueur choisit les cartes recyclées.
11. **Navori Fighting Pit, Radiant Dawn, Vanguard Helm, Karma** : le joueur choisit l'unité
    buffée.
12. **Reinforce** : confirmé (paiement auto, seules les unités payables proposées).
13. **Unité jouée par un effet** : elle est bel et bien **jouée** et déclenche ses effets
    « when you play me » (The Harrowing, Soulgorger, Spectral Matron, Portal Rescue,
    Reinforce, Ava Achiever, Promising Future, Blind Fury…). Elles arrivent **Tap**, sauf
    indication contraire (ex. : Accelerate payé en supplément, ou entrée Ready imprimée).
14. **Assault / Shield** : cumulables (Assault + Assault = Assault 2). Confirmé.
15. **Sorts contrés** : confirmé (cimetière, pas « joués »).
16. **Stun** : tracer le **joueur** qui a étourdi (pas l'unité) ; Eclipse Herald / Radiant
    Dawn utilisent ce joueur.
17. **Mighty** : évalué sur la Might **réelle** (bonus compris), pas imprimée.
18. **Hidden** :
    - une carte cachée par champ, et seulement sur un champ que le joueur contrôle ;
    - le contrôle d'un champ n'est perdu qu'à la fin du showdown s'il y en a un, sinon quand
      il ne reste aucune carte visible du joueur sur le champ **en état ouvert** (ex. : un
      Deathknell qui réinvoque une unité sur place empêche la perte, même si le champ a été
      vide un instant) ;
    - jouer depuis facedown ignore le coût imprimé, mais **pas** Deflect, et applique les
      effets « here » sur ce champ, sauf texte contraire (Tide Turner vise explicitement un
      autre champ) ;
    - gears cachés posés en base : confirmé, sauf instruction contraire.
19. **Reaver's Row** : à la fin d'un combat à égalité ou d'un effet Zhonya, le retour en base
    n'est pas un déplacement ; mais le joueur ne peut pas revenir **manuellement** en base
    depuis ce champ.
20. **Immortal Phoenix** : l'unité doit mourir **des dégâts du sort** (Stupefy sur une unité
    déjà blessée : ce ne sont pas les dégâts de Stupefy qui la tuent → ne compte pas).
    Le Phoenix peut se ressusciter lui-même s'il est l'unité alliée tuée par le sort
    (ex. Cull the Weak).
21. **Malzahar** : peut se sacrifier lui-même pour payer sa capacité, l'effet se résout
    normalement.
22. **Karthus** : confirmé (compte s'il meurt en même temps).
23. **Deflect** : si le coût Deflect ne peut pas ou ne veut pas être payé, seul l'effet qui
    cible cette unité fizzle. Par défaut on paie ; option de refus désactivée par défaut.
24. **Nocturne / Karma** : tous les effets qui regardent ou recyclent le deck les déclenchent
    (Vision, Reinforce, Baited Hook, Candlelit Sanctum, Stacked Deck…). Karma : une seule
    fois par effet.
25. **Heimerdinger** : peut copier les capacités ADD ; il ne peut simplement pas copier une
    rune.
26. **Mystic Reversal** : le sort volé peut être relancé avec de nouveaux choix, tant qu'ils
    sont valides.
27. **Blind Fury** : n'importe quelle carte révélée est jouable (gears, sorts à cibles…).
28. **Kai'Sa (Mind), Ava Achiever, Promising Future** : tous les sorts et unités sont
    jouables ; les cibles sont choisies à la mise sur la pile (pas à la résolution).
29. **Légendes 299-310** : mêmes cartes que les légendes de même nom, avec un autre visuel
    (images locales présentes) → à gérer plus tard comme **skin alternatif** lors de la
    création du deck, pas comme cartes distinctes.

### Points à reconfirmer après la mise en œuvre (novembre 2026)

- **19 / Reaver's Row** : compris ainsi — le renvoi accordé par Reaver's Row **est** un
  déplacement (il déclenche les effets de mouvement), contrairement au rappel d'égalité et à
  Zhonya. « Le joueur ne peut revenir manuellement en base sur ce bf » est lu comme : hors de
  cet effet, aucun retour manuel en base pendant le showdown (règle déjà appliquée).
