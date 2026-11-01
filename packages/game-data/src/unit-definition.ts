import { printedMetadata, type PrintedMetadata } from './printed-metadata.js';
/** Coût imprimé : énergie incolore + quantités de Power indexées par couleur.
 * Une couleur absente coûte zéro. Le paiement et les réserves appartiennent au moteur. */
export interface CardCost {
  /** Power supplémentaire payable dans ces couleurs, un symbole par défaut. */
  readonly powerChoice?: readonly string[];
  /** Nombre de symboles flexibles à payer, 1 par défaut ; entier positif. */
  readonly powerChoiceAmount?: number;
  readonly energy: number;
  readonly power: Readonly<Record<string, number>>;
}

/** Données communes à tous les exemplaires d'une carte unité.
 * `id` correspond au `definitionId` de ses instances. Might 0 est une valeur valide.
 * Propriétaire, zone, Ready/Tap et dégâts appartiennent à chaque instance en partie. */
export interface UnitDefinition extends PrintedMetadata {
  /** Bonus continu par instance de dégâts des sorts et capacités du propriétaire. */
  /** Exception de mise en jeu : champ entièrement vide en plus des destinations ordinaires. */
  readonly canPlayToOpenBattlefield?: boolean;
  /** Tant qu'elle est en jeu, les unités alliées peuvent être jouées sur un champ libre. */
  readonly alliesCanPlayToOpenBattlefield?: boolean;
  /** Sur un champ : adversaires limités à jouer leurs unités en base ; leurs unités ne
   * peuvent pas être redressées par sorts et capacités (Mageseeker Warden). */
  readonly wardenLockdown?: boolean;
  /** Tant qu'elle est Mighty (5+ Might) : Deflect, Ganking et Shield 1 (Fiora). */
  readonly mightyKeywords?: boolean;
  /** Ne subit aucun dégât après s'être déplacé au moins ce nombre de fois ce tour (Kayn). */
  readonly noDamageAfterMoves?: number;
  /** Au troisième déplacement du tour, son propriétaire marque 1 point (sans pile). */
  readonly scoreOnThirdMove?: boolean;
  /** Legion : « when you play me, ready me » si une autre carte a été jouée ce tour.
   * Hypothèse de prototype : appliqué à l'entrée en jeu, sans passer par la pile. */
  readonly legionReady?: boolean;
  /** Première mort d'une unité alliée du tour : son propriétaire pioche 1 (sans pile). */
  readonly drawOnFirstAllyDeath?: boolean;
  /** Mort d'une autre unité alliée non-Recrue : jeton de cette définition dans la base. */
  readonly recruitOnAllyDeath?: string;
  /** Carte jouée par son propriétaire pendant le tour adverse : jeton dans sa base. */
  readonly recruitOnOffTurnPlay?: string;
  /** Une unité adverse se déplace vers un autre champ que le sien : pioche 1 (sans pile). */
  readonly drawOnEnemyMoveElsewhere?: boolean;
  /** Ganking tant que l'unité est buffée (Bilgewater Bully). */
  readonly buffedGanking?: boolean;
  /** Se buffe quand son propriétaire joue une autre unité (hypothèse : sans pile). */
  readonly buffOnAllyPlayed?: boolean;
  /** Sur un champ : les autres unités alliées buffées de ce champ ont ce bonus (Lee Sin). */
  readonly otherBuffedAlliesHereMight?: number;
  /** Sur un champ : +Might par unité alliée buffée de ce champ, elle comprise (Sett). */
  readonly mightPerBuffedAllyHere?: number;
  /** Might supplémentaire tant que l'unité est buffée (Wizened Elder). */
  readonly buffedExtraMight?: number;
  /** +Might par carte du cimetière de son propriétaire (Dr. Mundo). */
  readonly mightPerTrashCard?: number;
  /** Au début de la Beginning de son propriétaire, recycle ce nombre de cartes de son
   * cimetière (les plus anciennes, sans choix ; hypothèse de prototype). */
  readonly recycleTrashAtBeginning?: number;
  /** Sur un champ en fin de tour de son propriétaire : redresse ce nombre de runes
   * alliées (Tap d'abord, sans choix), via la pile (Sona). */
  readonly readyRunesAtEndAtBattlefield?: number;
  /** Mots-clés tant que son propriétaire a défaussé une carte ce tour (Raging Soul). */
  readonly ifDiscardedThisTurn?: {
    readonly assault: number;
    readonly ganking: boolean;
  };
  /** Temporary imprimé (jetons Sprite) : l'unité entre en jeu avec Temporary. */
  readonly temporary?: boolean;
  /** Quand son propriétaire joue sa deuxième carte du tour : bonus de Might ce tour et
   * redressement (hypothèse : appliqué immédiatement, sans pile). */
  readonly onSecondCardPlayed?: {
    readonly might: number;
    readonly ready: boolean;
  };
  /** Quand son propriétaire défausse (une fois par action) : bonus de Might ce tour et
   * redressement (Jinx Chaos ; hypothèse : sans pile). */
  readonly onOwnerDiscard?: { readonly might: number; readonly ready: boolean };
  /** Quand une unité ennemie devient Stun (une fois par action) : bonus de Might ce tour et
   * redressement (Eclipse Herald ; hypothèse : sans pile, l'étourdisseur est l'adversaire). */
  readonly onEnemyStunned?: { readonly might: number; readonly ready: boolean };
  /** Se redresse quand son propriétaire joue un gear (hypothèse : sans passer par la pile). */
  readonly readyOnGearPlayed?: boolean;
  /** Entre Ready si un adversaire est à ce nombre de points ou moins de sa victoire. */
  readonly entersReadyIfOpponentWithin?: number;
  /** Les unités ennemies Stun de sa zone perdent cette Might, sans descendre sous 1. */
  readonly stunnedEnemiesHereMalus?: number;
  /** Tant qu'elle est en jeu, les autres unités alliées (jetons compris) entrent Ready. */
  readonly otherAlliesEnterReady?: boolean;
  /** Legion : énergie en moins si une autre carte a été jouée ce tour (plancher 0). */
  readonly legionEnergyReduction?: number;
  /** Coût supplémentaire facultatif (1 Power de cette couleur) : pioche via la pile. */
  readonly optionalCost?: { readonly power: string; readonly draw: number };
  /** Énergie en moins par carte du cimetière de son propriétaire (plancher 0). */
  readonly energyReductionPerTrashCard?: number;
  /** Les unités Dragon de son propriétaire coûtent autant d'énergie en moins (minimum 1). */
  readonly dragonEnergyReduction?: number;
  /** Peut être joué sur un champ occupé par des unités ennemies (Showdown à l'arrivée). */
  readonly canPlayToOccupiedEnemyBattlefield?: boolean;
  /** Déplacement vers un champ : invoquer ce jeton ici via la pile, sans condition de contrôle. */
  readonly onMoveSummonHere?: string;
  /** Après tout déplacement : défausser une carte disponible puis piocher, via la pile. */
  readonly onMoveLoot?: boolean;
  readonly tank?: boolean;
  /** Reçoit les dégâts de combat en dernier. */
  readonly backline?: boolean;
  /** Capacité « Tap : effet » de l'unité (même action et vocabulaire que les gears). */
  readonly tapAbility?: import('./gear-definition.js').GearTapAbility;
  readonly deflect?: boolean;
  /** Capacité « When you play me » visant une unité choisie à la mise en jeu, via la pile.
   * allegiance relative au joueur ; zone 'battlefield' exclut les bases ; excludeSelf exclut
   * l'unité jouée. Sans cible légale, la capacité reste sans effet. */
  readonly onPlayTargetEffect?: {
    /** Legion : capacité seulement si une autre carte a été jouée ce tour. */
    readonly legion?: boolean;
    /** Seules les unités buffées sont ciblables. */
    readonly buffed?: boolean;
    /** « You may » : jouer sans cible reste possible même si une cible existe. */
    readonly optional?: boolean;
    /** Capacité seulement si l'unité est jouée sur un champ. */
    readonly onlyToBattlefield?: boolean;
    readonly allegiance?: 'friendly' | 'enemy';
    readonly zone?: 'battlefield';
    readonly excludeSelf?: boolean;
    readonly effect:
      | {
          readonly type: 'modify-might';
          readonly amount: number;
          readonly minimum?: number;
        }
      | { readonly type: 'damage'; readonly amount: number }
      | { readonly type: 'stun' }
      /** L'unité jouée et la cible s'infligent leur Might (sans effet si l'une a disparu). */
      | { readonly type: 'fight' }
      /** Tue la cible si elle est Stun à la résolution, sinon la Stun. */
      | { readonly type: 'kill-if-stunned-else-stun' }
      /** Buffe la cible (+1 Might permanent si elle n'a pas déjà de buff). */
      | { readonly type: 'buff' }
      /** Ganking jusqu'à la fin du tour. */
      | { readonly type: 'grant-ganking' }
      /** Dépense le buff de la cible, puis la source se buffe et se redresse. */
      | { readonly type: 'spend-buff-empower-self' }
      /** Déplace la cible vers le lieu de la source (Blitzcrank). */
      | { readonly type: 'pull-here' }
      /** Dégâts de capacité égaux à la Might actuelle de la source. */
      | { readonly type: 'might-damage' }
      | { readonly type: 'kill' }
      | { readonly type: 'return-to-hand' };
  };
  readonly onPlayReadyOther?: boolean;
  readonly onPlayMoveToBase?: boolean;
  readonly onPlayVision?: boolean;
  readonly onPlaySummonHere?: string;
  /** Nombre de jetons onPlaySummonHere (1 par défaut). */
  readonly onPlaySummonHereCount?: number;
  /** Legion : jetons seulement si une autre carte a été jouée ce tour. */
  readonly onPlaySummonHereLegion?: boolean;
  readonly spellEnergyReductionAtBattlefield?: number;
  /** Effet de mise en jeu, empilé avant résolution. */
  readonly onPlayEffect?:
    | {
        readonly type: 'channel-exhausted' | 'draw';
        readonly count: number;
      }
    /** Défausse `count` cartes choisies (autant que possible), puis pioche `draw` (0 par
     * défaut) ; legion : seulement si une autre carte a été jouée ce tour. */
    | {
        readonly type: 'discard';
        readonly count: number;
        readonly draw?: number;
        readonly legion?: boolean;
      }
    /** Pioche 1 par unité alliée Mighty (5+ Might) à la résolution. */
    | { readonly type: 'draw-per-mighty' }
    /** Les adversaires ne peuvent plus jouer de carte jusqu'à la fin du tour. */
    | { readonly type: 'lock-opponents' }
    /** Se buffe ; alliesHere : puis buffe les autres alliés de son champ (pas en base) ;
     * legion : seulement si une autre carte a été jouée ce tour. */
    | {
        readonly type: 'buff-self';
        readonly legion?: boolean;
        readonly alliesHere?: boolean;
        /** Condition à la résolution : contrôler une unité portant ce tag. */
        readonly ifControlTag?: string;
        /** Pioches supplémentaires quand l'effet s'applique. */
        readonly draw?: number;
      }
    /** Le prochain sort joué ce tour coûte `energy` de moins (plancher 0). */
    | { readonly type: 'next-spell-discount'; readonly energy: number }
    /** L'unité jouée gagne cette Might jusqu'à la fin du tour (Teemo Chaos). */
    | { readonly type: 'self-might'; readonly amount: number }
    /** L'adversaire révèle sa main ; le joueur y choisit une carte qui est défaussée
     * (Mindsplitter) ou recyclée, hors unités (Sabotage). */
    | {
        readonly type: 'opponent-hand-pick';
        readonly action: 'discard' | 'recycle-non-unit';
      }
    /** Modificateur de Might jusqu'à la fin du tour à toutes les unités ennemies. */
    | {
        readonly type: 'weaken-enemies';
        readonly amount: number;
        readonly minimum?: number;
      };
  /** En attaque avec un ennemi Ready ici : bonus temporaire via la pile, condition revérifiée. */
  readonly onAttackReadyEnemyMightBonus?: number;
  readonly onAttackDamage?: number;
  /** « When I conquer » : son propriétaire pioche ce nombre de cartes, via la pile. */
  readonly onConquerDraw?: number;
  /** Coût supplémentaire facultatif : défausser 1 carte pour cette énergie en moins. */
  readonly discardDiscount?: number;
  /** Hidden : peut être cachée pour 1 Power puis jouée gratuitement plus tard. */
  readonly hidden?: boolean;
  /** Son propriétaire joue une carte depuis Hidden : +Might ce tour (Ember Monk, sans pile). */
  readonly mightOnHiddenPlay?: number;
  /** Les cartes cachées des adversaires sur son champ ne peuvent pas être jouées. */
  readonly blocksEnemyHidden?: boolean;
  /** Réaction : jouable comme une Réaction (pile, Showdown, tour adverse) avec la priorité. */
  readonly reactionTiming?: boolean;
  /** À la mise en jeu : buffe jusqu'à ce nombre d'autres unités alliées (onPlaySelectedIds). */
  readonly onPlayBuffOthers?: number;
  /** « When I conquer » : se buffe, via la pile (Sett). */
  readonly onConquerBuffSelf?: boolean;
  /** Entre Ready si un adversaire contrôle un champ (Vayne). */
  readonly entersReadyIfOpponentControls?: boolean;
  /** « When I conquer, you may pay 1 énergie to return me to my owner's hand » (Vayne). */
  readonly onConquerPayReturn?: boolean;
  /** À la mise en jeu : dépense les buffs des unités choisies (onPlaySelectedIds) et
   * canalise 1 rune Tap par buff dépensé (Albus Ferros). */
  readonly onPlaySpendBuffsChannel?: boolean;
  /** « When I conquer, you may kill a gear. If you do, buff me » (Adaptatron). */
  readonly onConquerKillGearBuff?: boolean;
  /** « Spend my buff » : +Might jusqu'à la fin du tour, via la pile (Sett). */
  readonly buffSpendMight?: number;
  /** Coût supplémentaire obligatoire : tuer une unité alliée à la mise en jeu. */
  readonly sacrificeCost?: boolean;
  /** « When I conquer » : son propriétaire choisit l'un de ces modes à la résolution. */
  readonly onConquerChoice?: readonly ('draw' | 'channel-exhausted')[];
  /** En attaquant : effet sur une unité ennemie de ce champ, choisie avant réactions.
   * stun : Stun jusqu'à la fin du tour ; might-damage : dégâts égaux à la Might de la source
   * à la résolution. */
  readonly onAttackTargetEffect?:
    | { readonly type: 'stun' | 'might-damage' }
    /** weaken : -amount Might jusqu'à la fin du tour, sans descendre sous minimum ;
     * defendToo : se déclenche aussi quand l'unité défend (Ahri). */
    | {
        readonly type: 'weaken';
        readonly amount: number;
        readonly minimum: number;
        readonly defendToo?: boolean;
      };
  /** Les autres unités alliées de sa zone ont Assault de cette valeur (cumulable). */
  readonly otherAlliesHereAssault?: number;
  /** Les autres unités alliées de sa zone ont Shield de cette valeur (cumulable). */
  readonly otherAlliesHereShield?: number;
  /** Bonus continu de Might par point de son propriétaire. */
  readonly mightPerOwnPoint?: number;
  /** Accelerate : 1 énergie + 1 Power de cette couleur en plus pour arriver Ready. */
  readonly accelerate?: { readonly power: string };
  /** « When I hold » : points d'effet de carte quand son propriétaire tient son champ. */
  readonly onHoldScore?: number;
  /** « When I hold » : retourne dans la main de son propriétaire, via la pile. */
  readonly onHoldReturnToHand?: boolean;
  /** En attaquant : dégâts de capacité à toutes les unités ennemies du champ, via la pile. */
  readonly onAttackDamageEnemiesHere?: number;
  /** En attaquant : tue toutes les unités ennemies blessées du champ, via la pile. */
  readonly onAttackKillDamagedEnemiesHere?: boolean;

  readonly spellAbilityDamageBonus?: number;
  /** Capacité ADD : épuiser cette unité Ready pour produire cette énergie réservée aux sorts. */
  readonly spellEnergyAbility?: number;
  /** Capacité déclenchée à la mise en jeu : dégâts à toutes les unités sur les champs. */
  readonly onPlayBattlefieldDamage?: number;
  /** À la mise en jeu, récupérer le sort choisi de son cimetière via la pile. */
  readonly onPlayReturnSpell?: boolean;
  /** À la mise en jeu, récupérer l'unité choisie de son cimetière (champ returnSpellId). */
  readonly onPlayReturnUnit?: boolean;
  /** Au lancement d'un sort de coût imprimé suffisant : bonus personnel pour le tour, via la pile. */
  readonly onExpensiveSpell?: {
    readonly minimumEnergy: number;
    readonly mightBonus: number;
  };
  /** Aura locale : bonus aux autres unités alliées dans la zone de cette unité. */
  readonly otherAlliesHereMightBonus?: number;
  /** Bonus statique selon le nombre de runes en jeu du propriétaire, Ready ou Tap. */
  readonly runeMightBonus?: {
    readonly minimum: number;
    readonly amount: number;
  };
  /** Autorise le mouvement basique entre deux champs distincts, avec Ready puis Tap. */
  readonly ganking?: boolean;
  /** Bonus de Might uniquement en attaque sur le champ du Combat Showdown. */
  readonly assault?: number;
  /** Bonus personnel continu quand seul allié attaquant ou défenseur sur le champ du combat. */
  readonly aloneCombatMightBonus?: number;
  /** Bonus de Might uniquement en défense sur le champ du Combat Showdown. */
  readonly shield?: number;
  /** Exception imprimée : arrivée Ready au lieu de Tap ; false/absent garde Tap. */
  readonly entersReady?: boolean;
  /** Métadonnées d'affichage, jamais chargées par le moteur. */
  readonly imageUrl?: string;
  readonly text?: string;
  /** Deathknell ; voir DeathEffect du moteur pour la résolution de chaque type. */
  readonly onDeath?:
    | { readonly type: 'summon-token'; readonly definitionId: string }
    | { readonly type: 'draw'; readonly count: number }
    | { readonly type: 'recycle-self-ready-runes' }
    | {
        readonly type: 'discard-draw';
        readonly discard: number;
        readonly draw: number;
      }
    | {
        readonly type: 'channel-exhausted';
        readonly count: number;
        readonly draw?: number;
      }
    | {
        readonly type: 'summon-tokens-base';
        readonly definitionId: string;
        readonly count: number;
      }
    | { readonly type: 'damage-here'; readonly amount: number };
  readonly id: string;
  readonly name: string;
  readonly type: 'unit';
  readonly cost: CardCost;
  readonly might: number;
}

/** Entrée : définition d'unité. Sortie : copie figée, indépendante des données fournies.
 * Refuse par RangeError les coûts ou la Might négatifs, NaN ou infinis.
 * Aucun effet de carte ni traitement de paiement n'est exécuté ici. */
export function defineUnit(input: UnitDefinition): UnitDefinition {
  if (
    input.cost.powerChoiceAmount !== undefined &&
    (!input.cost.powerChoice?.length ||
      !Number.isInteger(input.cost.powerChoiceAmount) ||
      input.cost.powerChoiceAmount < 1)
  )
    throw new RangeError('Nombre de symboles flexibles invalide.');
  if (
    input.runeMightBonus &&
    (!Number.isInteger(input.runeMightBonus.minimum) ||
      input.runeMightBonus.minimum < 0 ||
      !Number.isFinite(input.runeMightBonus.amount) ||
      input.runeMightBonus.amount < 0)
  )
    throw new RangeError(`${input.id}: bonus conditionnel de runes invalide.`);
  for (const [field, value] of Object.entries({
    energy: input.cost.energy,
    might: input.might,
    shield: input.shield ?? 0,
    assault: input.assault ?? 0,
    aloneCombatMightBonus: input.aloneCombatMightBonus ?? 0,
    otherAlliesHereMightBonus: input.otherAlliesHereMightBonus ?? 0,
    spellAbilityDamageBonus: input.spellAbilityDamageBonus ?? 0,
    spellEnergyAbility: input.spellEnergyAbility ?? 0,
    onPlayBattlefieldDamage: input.onPlayBattlefieldDamage ?? 0,
    minimumSpellEnergy: input.onExpensiveSpell?.minimumEnergy ?? 0,
    spellMightBonus: input.onExpensiveSpell?.mightBonus ?? 0,
    ...Object.fromEntries(
      Object.entries(input.cost.power).map(([color, amount]) => [
        `power.${color}`,
        amount,
      ]),
    ),
  })) {
    if (!Number.isFinite(value) || value < 0)
      throw new RangeError(
        `${input.id}: ${field} doit être un nombre fini positif ou nul.`,
      );
  }
  return Object.freeze({
    ...printedMetadata(input.id),
    ...input,
    ...(input.tags ? { tags: Object.freeze([...input.tags]) } : {}),
    ...(input.onExpensiveSpell
      ? { onExpensiveSpell: Object.freeze({ ...input.onExpensiveSpell }) }
      : {}),
    ...(input.runeMightBonus
      ? { runeMightBonus: Object.freeze({ ...input.runeMightBonus }) }
      : {}),
    ...(input.onDeath ? { onDeath: Object.freeze({ ...input.onDeath }) } : {}),
    cost: Object.freeze({
      ...(input.cost.powerChoice
        ? { powerChoice: Object.freeze([...input.cost.powerChoice]) }
        : {}),
      ...(input.cost.powerChoiceAmount !== undefined
        ? { powerChoiceAmount: input.cost.powerChoiceAmount }
        : {}),
      energy: input.cost.energy,
      power: Object.freeze({ ...input.cost.power }),
    }),
  });
}
