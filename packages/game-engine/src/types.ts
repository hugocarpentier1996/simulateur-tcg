import type {
  AttackDamageTrigger,
  AttackDamageEntry,
} from './effects/attack-targets.js';
import type { PlayEffectEntry } from './effects/play-effect.js';
import type { AttackEntry } from './effects/attack-triggers.js';
import type { MovementEntry } from './effects/movement-triggers.js';
import type {
  LegendBlueprint,
  LegendEntry,
  ReadyRunesEntry,
} from './legend-types.js';
import type { ReturnSpellEntry } from './effects/return-spell.js';
import type { UnitPlayEntry } from './effects/unit-play.js';
import type { SpellPlayEntry } from './effects/expensive-spell.js';
import type { SpellBlueprint, SpellEntry } from './spell-types.js';
import type { GearBlueprint, GearState } from './gear-types.js';
import type { DeathEffect, DeathEntry, DeathTrigger } from './death-types.js';

/**
 * État de la simulation fourni à `act`, puis retourné après une action acceptée.
 * Les identifiants relient joueurs, unités et zones : ils doivent être uniques
 * dans leur collection et les références doivent désigner des éléments existants.
 * L'appelant fournit un état cohérent ; ce prototype ne valide pas un JSON externe.
 * Les étapes automatiques conduisent jusqu'à Main, sans effets de cartes personnalisés.
 */
export interface GameState {
  /** Beginning suspendu : reprendre Channel/Draw une seule fois après la pile et les choix. */
  pendingTurnStart?: boolean;
  pendingHoldChannel?:
    import('./effects/hold-channel.js').HoldChannelEntry | null;
  pendingDefenseShield?:
    import('./effects/defense-shield.js').DefenseShieldTrigger | null;
  battlefieldDefinitions?: readonly import('./battlefield-types.js').BattlefieldBlueprint[];
  /** Fin de tour suspendue jusqu'à résolution des capacités, morts et Showdowns induits. */
  pendingTurnEnd?: boolean;
  /** Cibles des capacités d’attaque à annoncer avant les réactions. */
  pendingAttackChoices?: AttackDamageTrigger[] | null;
  /** Joueurs dont les nouvelles unités entrent Ready jusqu’à la fin du tour courant. */
  readyEntryPlayers?: readonly string[];
  /** Réduction d'énergie du prochain sort de chaque joueur ce tour (Raging Firebrand). */
  nextSpellDiscount?: Readonly<Record<string, number>>;
  /** Imperial Decree : dégâts de chaque unité au moment du décret ; toute unité dont les
   * dégâts dépassent ensuite cette valeur (0 si absente) meurt. Effacé en fin de tour. */
  damageBaseline?: Readonly<Record<string, number>> | null;
  /** Dégâts de sort et de capacité empêchés jusqu'à la fin du tour (Unyielding Spirit). */
  effectDamagePrevented?: boolean;
  /** Joueurs dont au moins une unité ennemie est morte ce tour (Spoils of War). */
  enemyDeathsThisTurn?: readonly string[];
  /** Dégâts bonus du prochain sort de chaque joueur ce tour (Ravenborn Tome), puis ceux
   * acquis par chaque sort lancé, par id de carte. */
  nextSpellBonusDamage?: Readonly<Record<string, number>>;
  spellBonusDamage?: Readonly<Record<string, number>>;
  /** Joueurs pour qui cacher une carte est gratuit ce tour (Guerilla Warfare). */
  freeHidePlayers?: readonly string[];
  /** Chosen Champion de chaque joueur (carte placée en zone champion à la création). */
  chosenChampions?: Readonly<Record<string, string>>;
  /** Joueurs dont la prochaine unité jouée ce tour arrive Ready (Sun Disc). */
  nextUnitReady?: readonly string[];
  /** Tours supplémentaires en attente, dans l'ordre (Time Warp). */
  extraTurns?: readonly string[];
  /** Might supplémentaire donnée ce tour par les buffs des unités de chaque joueur. */
  buffBonus?: Readonly<Record<string, number>>;
  /** Joueurs ayant déjà pioché grâce à The Dreaming Tree ce tour. */
  dreamingTreeUsed?: readonly string[];
  /** Joueurs dont une unité est déjà morte ce tour (Wraith of Echoes). */
  allyDeathThisTurn?: readonly string[];
  /** Joueurs ayant défaussé au moins une carte ce tour (événements card-discarded). */
  discardedThisTurn?: readonly string[];
  /** Runes à redresser en fin de tour par joueur (Targon's Peak), via la pile. */
  endTurnReadyRunes?: Readonly<Record<string, number>>;
  /** Joueurs ayant déjà commencé leur première Beginning (champs « first Beginning »). */
  firstBeginningDone?: readonly string[];
  /** Joueurs qui ne peuvent plus jouer de carte ce tour (Brynhir Thundersong). */
  playLockedPlayers?: readonly string[];
  /** Cartes jouées (unités, sorts, gears) par joueur depuis le début du tour (Legion). */
  cardsPlayedThisTurn?: Readonly<Record<string, number>>;
  /** Choix privé : cartes regardées du dessus du deck, une seule ira en main (Stacked Deck). */
  pendingPick?: {
    playerId: string;
    sourceId: string;
    cardIds: string[];
  } | null;
  /** Choix de mode en attente (« pioche 1 ou canalise 1 », Qiyana). */
  pendingModeChoice?: import('./effects/mode-choice.js').ModeChoiceEntry | null;
  /** État serveur privé : sommet connu uniquement du joueur de Vision. */
  pendingVision?: { playerId: string; sourceId: string; cardId: string } | null;
  /** Choix obligatoire pendant une résolution ; aucune réaction entre défausse et pioche. */
  /** Choix de défausse en attente. remaining absent : loot (1 défausse puis 1 pioche).
   * Sinon : encore `remaining` cartes à défausser, puis `draw` pioches (0 par défaut). */
  pendingDiscard?: {
    playerId: string;
    sourceId: string;
    remaining?: number;
    draw?: number;
  } | null;
  activePlayerId: string;
  phase: TurnPhase;
  /** Second joueur : une rune supplémentaire à son premier Channel, puis null. */
  initialChannelBonusPlayerId?: string | null;
  /** Préparation ; activePlayerId n'a pas d'autorité de jeu avant la fin du mulligan. */
  setup?:
    | { stage: 'roll' }
    | { stage: 'choose-first'; chooserId: string }
    | { stage: 'mulligan'; completedPlayerIds: string[] }
    | {
        stage: 'choose-battlefield';
        options: Record<
          string,
          readonly { id: string; definitionId: string }[]
        >;
        selections: Record<string, { id: string; definitionId: string }>;
        nextChooserId: string | null;
      }
    | null;
  /** Ordre des tours ; après le dernier joueur, on revient au premier. */
  /** victoryTarget : seuil de points, 8 par défaut (surcharge pour les scénarios de test). */
  players: { id: string; score: number; victoryTarget?: number }[];
  /** État du hasard reproductible, initialisé côté serveur (défaut prototype : 1). */
  randomState?: number;
  /** Absent pendant la partie ; une fois fixé, bloque toute nouvelle action. */
  result?: GameResult;
  /** Zones parentes ; les côtés des battlefields sont des BattlefieldSide dérivés (champ + joueur). */
  zones: { id: string; kind: ZoneKind; ownerId?: string }[];
  units: UnitState[];
  /** Catalogue de confiance fourni par le serveur, jamais par une intention client. */
  legendDefinitions?: readonly LegendBlueprint[];
  unitDefinitions?: readonly UnitBlueprint[];
  spellDefinitions?: readonly SpellBlueprint[];
  gearDefinitions?: readonly GearBlueprint[];
  gears?: GearState[];
  /** Pile du bas vers le haut : sorts payés, bonus déclenchés au lancement et effets de mort. */
  stack?: {
    entries: (
      | import('./effects/hold-channel.js').HoldChannelEntry
      | import('./effects/hold-units.js').HoldUnitEntry
      | import('./effects/mode-choice.js').ModeChoiceEntry
      | import('./effects/defense-shield.js').DefenseShieldEntry
      | AttackDamageEntry
      | PlayEffectEntry
      | AttackEntry
      | MovementEntry
      | SpellEntry
      | DeathEntry
      | SpellPlayEntry
      | UnitPlayEntry
      | ReturnSpellEntry
      | LegendEntry
      | ReadyRunesEntry
    )[];
    initiatorId: string;
    priorityPlayerId: string;
    consecutivePasses: number;
  } | null;
  /** Choix des effets après transfert de tous les morts, attaquant puis défenseur. */
  pendingDeaths?: { playerOrder: string[]; triggers: DeathTrigger[] } | null;
  /** Conquête/retraite suspendues jusqu'à la fin des réactions aux morts. */
  combatAftermath?: { defenderEliminated: boolean } | null;
  nextTokenId?: number;
  /** Priorité après une chaîne hors Showdown ; une passe la rend au joueur actif. */
  priorityPlayerId?: string;
  /** Arrivées par effet à traiter après la chaîne et le Showdown courant. */
  pendingShowdowns?: { battlefieldId: string; initiatorId: string }[];
  /** Cartes hors permanents en jeu. Une instance ne figure jamais aussi dans `units` ou `gears`.
   * Dans chaque zone ordonnée, leur ordre ici va du sommet au dessous de la pile. */
  cards: CardInstance[];
  /** Réserves flottantes par joueur ; un Power absent de la table vaut zéro. */
  resources: Record<
    string,
    {
      energy: number;
      power: Record<string, number>;
      /** Réserve réservée au lancement de sorts, effacée avec les ressources flottantes. */ spellEnergy?: number;
      /** Power de n'importe quel domaine réservé aux sorts (Daughter of the Void). */
      spellPower?: number;
    }
  >;
  battlefields: {
    zoneId: string;
    definitionId?: string;
    controllerId: string | null;
  }[];
  /** Par joueur, IDs des champs ayant déjà donné un point de tenue/conquête ce tour. */
  scoredBattlefields: Record<string, string[]>;
  /** `null` hors Showdown ; participants dans l'ordre de priorité.
   * En combat, stage sépare la fenêtre des passes et celle des répartitions.
   * assignments contient des choix privés jusqu'à l'application simultanée des dégâts. */
  showdown:
    | ({
        battlefieldId: string;
        initiatorId: string;
        participants: string[];
        priorityPlayerId: string;
        consecutivePasses: number;
      } & (
        | { kind: 'open' }
        | {
            kind: 'combat';
            shieldBonuses?: Record<string, number>;
            defenderId: string;
            stage: 'priority' | 'damage' | 'effects';
            assignments: Record<string, readonly DamageAllocation[]>;
          }
      ))
    | null;
}

/** Définition structurelle acceptée par le moteur ; compatible avec le catalogue game-data. */
export interface UnitBlueprint {
  /** Tags imprimés (région, espèce, champion), distincts des capacités comme Shield. */
  readonly tags?: readonly string[];
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
  readonly tapAbility?: import('./gear-types.js').GearBlueprint['tapAbility'];
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
      /** La source et la cible échangent leurs lieux, deux déplacements (Tideturner). */
      | { readonly type: 'swap-places' }
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
  /** Premier déplacement du tour : peut redresser autre chose de Tap (Miss Fortune, pile). */
  readonly onFirstMoveReadyOther?: boolean;
  /** Une unité alliée quitte sa zone en se déplaçant : peut la suivre (Stealthy Pursuer). */
  readonly followsAllies?: boolean;
  /** En attaquant : révèle puis recycle la rune du dessus ; effet selon son domaine
   * (Twisted Fate, capacité sur la pile). */
  readonly onAttackRuneFate?: boolean;
  /** Deflect N : taxe de N Power (1 par défaut). */
  readonly deflectAmount?: number;
  /** En attaquant : ces dégâts répartis entre les ennemis ici (Volibear, pile). */
  readonly onAttackSplitDamage?: number;
  /** Quand il défend ou est joué depuis Hidden : révèle ce nombre de cartes du dessus, 1 dégât
   * réparti entre les ennemis ici par carte Hidden révélée, puis les recycle (Teemo Mind). */
  readonly hiddenRevealDamage?: number;
  /** Défaussée : peut être jouée depuis le cimetière en payant 1 Power de cette couleur
   * (Flame Chompers, capacité sur la pile). */
  readonly playOnDiscard?: { readonly power: string };
  /** Un sort de son propriétaire tue une unité : peut payer ce coût pour la jouer depuis le
   * cimetière (Immortal Phoenix, capacité sur la pile). */
  readonly playOnSpellKill?: UnitBlueprint['cost'];
  /** Tant qu'elle est en jeu, les autres unités alliées ont Vision (Gemcraft Seer). */
  readonly alliesHaveVision?: boolean;
  /** À la mise en jeu, peut jouer une unité de son cimetière (returnSpellId) : gratuitement
   * sous les plafonds (Spectral Matron) ou en payant son Power (payPower, Soulgorger). */
  readonly onPlayFromTrash?: {
    readonly maxEnergy?: number;
    readonly maxPower?: number;
    readonly payPower?: boolean;
  };
  /** Coût supplémentaire facultatif sur des unités alliées choisies (costUnitIds) : les tuer
   * (Commander Ledros) ou dépenser leur buff (Kraken Hunter), -1 Power de la couleur chacune. */
  readonly unitCostReduction?: {
    readonly kind: 'sacrifice' | 'spend-buff';
    readonly power: string;
  };
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
  /** « Recycle 1 from your trash » : +Might jusqu'à la fin du tour, via la pile (Vi). */
  readonly trashRecycleMight?: number;
  /** Coût supplémentaire obligatoire : tuer une unité alliée (sacrificeUnitId). */
  readonly sacrificeCost?: boolean;
  /** « When I conquer » : son propriétaire choisit l'un de ces modes à la résolution. */
  readonly onConquerChoice?: readonly import('./effects/mode-choice.js').EffectMode[];
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
  readonly otherAlliesHereMightBonus?: number;
  readonly runeMightBonus?: {
    readonly minimum: number;
    readonly amount: number;
  };
  /** Autorise le mouvement basique de champ à champ ; ne dispense pas de Ready. */
  readonly ganking?: boolean;
  /** Bonus de Might en attaque, uniquement sur le champ du Combat Showdown. */
  readonly assault?: number;
  /** Bonus personnel continu quand seul allié attaquant ou défenseur sur le champ du combat. */
  readonly aloneCombatMightBonus?: number;
  /** Bonus de Might en défense, uniquement sur le champ du Combat Showdown. */
  readonly shield?: number;
  /** Arrivée Ready lors de la mise en jeu ; absent ou false signifie Tap. */
  readonly entersReady?: boolean;
  readonly onDeath?: DeathEffect;
  readonly id: string;
  readonly type: 'unit';
  readonly cost: {
    /** Supplément de Power payable dans toute couleur, après coûts imprimés. */
    readonly genericPower?: number;
    readonly powerChoice?: readonly string[];
    /** Nombre de symboles flexibles à payer, 1 par défaut ; entier positif. */
    readonly powerChoiceAmount?: number;
    readonly energy: number;
    readonly power: Readonly<Record<string, number>>;
  };
  readonly might: number;
}

/** Instance en jeu : définition, Might et dégâts explicites, même lorsque leur valeur est zéro. */
export interface UnitState {
  token?: boolean;
  temporaryEffects?: (
    | { type: 'modify-might'; amount: number }
    /** Assault accordé jusqu'à la fin du tour, compté seulement en attaque. */
    | { type: 'assault'; amount: number }
    /** Shield accordé jusqu'à la fin du tour, compté seulement en défense. */
    | { type: 'shield'; amount: number }
    /** Tank accordé jusqu'à la fin du tour. */
    | { type: 'tank' }
    | { type: 'stun' }
    | { type: 'recall-on-death' }
    /** Ganking accordé jusqu'à la fin du tour. */
    | { type: 'ganking' }
  )[];
  id: string;
  ownerId: string;
  zoneId: string;
  ready: boolean;
  definitionId: string;
  might: number;
  damage: number;
  /** Propriétaire de la carte quand un autre joueur la contrôle (ownerId = contrôleur). */
  cardOwnerId?: string;
  tank?: boolean;
  backline?: boolean;
  stunned?: boolean;
  cannotDealDamage?: boolean;
  /** Noxian Guillotine : meurt dès que ses dégâts dépassent cette valeur (fin de tour : effacé). */
  killOnDamageAbove?: number;
  /** Buff : +1 Might permanent tant qu'elle reste en jeu ; au plus un buff. */
  buffed?: boolean;
  /** Temporary : tuée au début de la Beginning de son contrôleur, avant le score. */
  temporary?: boolean;
  /** Déplacements effectués ce tour (événements unit-moved), remis à zéro en fin de tour. */
  movesThisTurn?: number;
}

/** Choix du joueur : runes tap pour l'énergie, puis recyclées pour le Power.
 * Une rune peut figurer une fois dans chaque liste (Tap puis recyclage). */
export interface PaymentPlan {
  readonly energyRunes: readonly string[];
  readonly powerRunes: readonly string[];
}
/** Attribution ordonnée : une cible doit recevoir des dégâts létaux avant la suivante. */
export interface DamageAllocation {
  targetId: string;
  amount: number;
}

/** Étapes observables dans le journal ; le joueur agit normalement en Main. */
export type TurnPhase =
  'setup' | 'awaken' | 'beginning' | 'channel' | 'draw' | 'main' | 'end';
export type ZoneKind =
  | 'base'
  | 'battlefield'
  | 'deck'
  | 'hand'
  | 'rune-pile'
  | 'runes'
  | 'legend'
  | 'champion'
  | 'graveyard'
  | 'banished';

/** Instance identifiable : la définition de carte sera fournie par game-data.
 * `ready` absent signifie que la carte n'utilise pas Ready/Tap ; `color` identifie
 * la couleur d'une rune, sans fixer ici les noms des six couleurs du jeu. */
export interface CardInstance {
  id: string;
  definitionId: string;
  ownerId: string;
  zoneId: string;
  ready?: boolean;
  color?: string;
  /** Carte cachée face cachée sur le champ zoneId ; fresh : cachée ce tour, pas encore jouable. */
  facedown?: { fresh: boolean };
}

/**
 * Intention en entrée du moteur, sans garantie qu'elle soit autorisée.
 * - move : joueur demandeur, unité concernée, ID de la zone de destination.
 *   Unité Ready de sa base vers un champ vide, allié ou adverse, en Main, en 1v1.
 * - play-unit : carte en main ou zone champion, coût du catalogue et choix de runes.
 *   Entre Tap en base par défaut ou à destinationId si ce champ est contrôlé.
 * - queue-death-effects : liste complète des sources du joueur attendu, dans l'ordre
 *   d'empilement choisi, chacune avec sa destination d'invocation autorisée.
 * - play-gear : carte en main et paiement -> permanent Ready dans la base.
 * - equip-gear : équipement libre, unité alliée et paiement supplémentaire -> attachement.
 *   Ces deux actions exigent sa Main hors Showdown, sans pile en cours.
 * - cast-spell : carte en main, cible et destination pour un déplacement, paiement.
 *   Valide le timing puis empile ; les effets attendent les passes de la fenêtre.
 * - assign-damage : répartition ordonnée des dégâts sur les unités adverses du champ.
 *   Jouable une fois par camp après les deux passes ; les dégâts attendent les deux choix.
 * - pass : joueur qui renonce à agir dans l'Open Showdown où il a la priorité.
 * - end-turn : joueur actif qui termine sa Main, hors Showdown ; le suivant entre
 *   en Main après fin de tour, Awaken, Beginning, Channel et Draw automatiques.
 * `playerId` devra être fourni par le serveur à partir de l'identité authentifiée.
 */
export type GameAction =
  | { type: 'choose-hold-channel'; playerId: string; accept: boolean }
  | {
      type: 'choose-defense-shield';
      playerId: string;
      targetId: string;
      payment: PaymentPlan;
    }
  | {
      type: 'choose-attack-targets';
      playerId: string;
      effects: readonly {
        sourceId: string;
        targetId?: string;
        payment: PaymentPlan;
      }[];
    }
  | { type: 'choose-vision'; playerId: string; recycle: boolean }
  /** Cacher une carte Hidden de sa main face cachée sur un champ contrôlé (1 Power). */
  | {
      type: 'hide-card';
      playerId: string;
      cardId: string;
      battlefieldId: string;
      /** Swift Scout : payer 1 énergie au lieu d'1 Power. */
      payWithEnergy?: boolean;
      payment: PaymentPlan;
    }
  /** Capacité « Spend my buff » d'une unité alliée buffée (buffSpendMight). */
  | { type: 'spend-buff-ability'; playerId: string; unitId: string }
  /** Capacité « Recycle 1 from your trash » d'une unité alliée (trashRecycleMight). */
  | {
      type: 'trash-recycle-ability';
      playerId: string;
      unitId: string;
      cardId: string;
    }
  /** Mode d'une capacité « X ou Y » en attente (pendingModeChoice). */
  | {
      type: 'choose-mode';
      playerId: string;
      mode: import('./effects/mode-choice.js').EffectMode;
    }
  | { type: 'choose-discard'; playerId: string; cardId: string }
  /** Carte gardée parmi celles regardées (pendingPick). */
  | { type: 'choose-pick'; playerId: string; cardId: string }
  | { type: 'activate-spell-energy'; playerId: string; unitId: string }
  /** Capacité ADD d'un gear Ready : Tap et ressource dans la réserve flottante. */
  | {
      type: 'activate-gear';
      playerId: string;
      gearId: string;
      /** Capacité Tap ciblée (tapAbility) : unité choisie et paiement du coût éventuel. */
      targetId?: string;
      /** Champ de destination d'un déplacement depuis la base (move-to-or-from-base). */
      destinationId?: string;
      payment?: PaymentPlan;
    }
  /** Ressource manuelle : Tap d'une rune Ready pour 1 énergie dans la réserve. */
  | { type: 'tap-rune'; playerId: string; runeId: string }
  /** Ressource manuelle : rune sous son deck pour 1 Power (+1 énergie si elle était Ready). */
  | { type: 'recycle-rune'; playerId: string; runeId: string }
  | {
      type: 'queue-death-effects';
      playerId: string;
      effects: readonly { sourceId: string; destinationId: string }[];
    }
  | {
      type: 'play-gear';
      playerId: string;
      cardId: string;
      /** Unité alliée choisie par un effet de pose (onPlayBuffAlly). */
      targetId?: string;
      payment: PaymentPlan;
    }
  | {
      type: 'equip-gear';
      playerId: string;
      gearId: string;
      unitId: string;
      payment: PaymentPlan;
    }
  | { type: 'choose-battlefield'; playerId: string; battlefieldId: string }
  | { type: 'choose-first-player'; playerId: string; firstPlayerId: string }
  | { type: 'mulligan'; playerId: string; cardIds: readonly string[] }
  | {
      type: 'cast-spell';
      exhaustUnitId?: string;
      /** Une destination par Recrue, choisie à l'empilement ; répétitions autorisées. */
      tokenDestinations?: readonly string[];
      playerId: string;
      cardId: string;
      targetId: string;
      /** Flash : liste explicite de 0 à 2 unités alliées distinctes ; targetId = lanceur. */
      selectedUnitIds?: readonly string[];
      /** Duel : seconde unité, ennemie, choisie dès le lancement. */
      secondaryTargetId?: string;
      destinationId?: string;
      /** Coût X (sort variablePower) : Power quelconque supplémentaire, entier >= 0. */
      xPower?: number;
      /** Carte de la main à défausser (discard-for-damage), choisie au lancement. */
      discardCardId?: string;
      /** Unité alliée dont le buff est dépensé pour ignorer le coût (spendBuffForFreeCast). */
      spendBuffUnitId?: string;
      payment: PaymentPlan;
    }
  | {
      type: 'play-unit';
      /** Cible de capacité choisie à la mise en jeu, avant réactions. */
      onPlayTargetId?: string;
      /** Unités choisies à la mise en jeu (onPlayBuffOthers), sans ordre. */
      onPlaySelectedIds?: readonly string[];
      /** Paye le coût supplémentaire Accelerate de l'unité pour qu'elle arrive Ready. */
      accelerate?: boolean;
      /** Paie le coût supplémentaire facultatif de l'unité (optionalCost). */
      optionalCost?: boolean;
      /** Carte de la main défaussée en coût supplémentaire (discardDiscount). */
      discardCardId?: string;
      /** Unités alliées payées en coût (unitCostReduction), sans ordre. */
      costUnitIds?: readonly string[];
      /** Unité alliée tuée comme coût supplémentaire (sacrificeCost, Cruel Patron). */
      sacrificeUnitId?: string;
      /** Annie Chaos : sort choisi avant les réactions ; requis si un sort est récupérable. */
      returnSpellId?: string;
      playerId: string;
      cardId: string;
      destinationId?: string;
      payment: PaymentPlan;
    }
  | {
      type: 'assign-damage';
      playerId: string;
      allocations: readonly DamageAllocation[];
    }
  | {
      type: 'move-group';
      playerId: string;
      moves: readonly { unitId: string; destinationId: string }[];
    }
  | { type: 'move'; playerId: string; unitId: string; destinationId: string }
  | { type: 'pass'; playerId: string }
  | {
      type: 'end-turn';
      playerId: string;
      /** Choix Dark Child, avant réactions. */ readyRuneIds?: readonly string[];
    };

/**
 * Faits produits en sortie d'une action acceptée, dans l'ordre de traitement.
 * Les IDs permettent de retrouver les entités ; `from`/`to` sont des IDs de zones.
 * `point-scored` représente exactement +1, avec sa source de conquête ou tenue.
 * Ces événements servent à expliquer le résultat ; ils ne remplacent pas l'état
 * retourné et ne suffisent pas, seuls, à reconstruire toute la simulation.
 */
export type GameEvent =
  | {
      type: 'battlefield-effect-queued' | 'battlefield-effect-resolved';
      battlefieldId: string;
      playerId: string;
    }
  | {
      type: 'attack-effect-queued' | 'attack-effect-resolved';
      sourceId: string;
    }
  | { type: 'card-discarded'; playerId: string; cardId: string }
  | {
      type: 'movement-effect-queued' | 'movement-effect-resolved';
      sourceId: string;
    }
  | { type: 'unit-left-board'; unitId: string; zoneId: string }
  | {
      type: 'legend-effect-queued' | 'legend-effect-resolved';
      sourceId: string;
    }
  | { type: 'spell-returned'; playerId: string; cardId: string }
  /** Points accordés par un effet de carte, hors tenue et conquête. */
  | {
      type: 'points-gained';
      playerId: string;
      amount: number;
      sourceId: string;
      source: 'CARD_EFFECT';
    }
  /** Gear activé pour sa capacité de ressource. */
  | {
      type: 'gear-resource-added';
      playerId: string;
      gearId: string;
      energy: number;
      power: string | null;
    }
  /** Rune utilisée manuellement ; power = couleur gagnée, ou null pour un simple Tap. */
  | {
      type: 'rune-used';
      playerId: string;
      runeId: string;
      energy: number;
      power: string | null;
    }
  | { type: 'ability-damage'; sourceId: string; unitId: string; amount: number }
  | {
      type: 'unit-play-effect-queued' | 'unit-play-effect-resolved';
      sourceId: string;
    }
  | {
      type: 'spell-play-effect-queued' | 'spell-play-effect-resolved';
      sourceId: string;
    }
  | {
      type: 'spell-energy-added';
      playerId: string;
      unitId: string;
      amount: number;
    }
  | { type: 'death-triggered'; sourceId: string; playerId: string }
  | { type: 'death-effects-queued'; playerId: string; sourceIds: string[] }
  | { type: 'death-effect-resolved'; sourceId: string }
  | { type: 'token-summoned'; unitId: string; playerId: string; zoneId: string }
  | { type: 'token-removed'; unitId: string }
  | { type: 'combat-restarted'; battlefieldId: string }
  | { type: 'gear-played'; playerId: string; gearId: string; zoneId: string }
  | { type: 'gear-equipped'; playerId: string; gearId: string; unitId: string }
  | {
      type: 'gear-followed';
      gearId: string;
      unitId: string;
      from: string;
      to: string;
    }
  | { type: 'gear-killed'; gearId: string; ownerId: string }
  | {
      type: 'card-hidden';
      playerId: string;
      cardId: string;
      battlefieldId: string;
    }
  /** Carte facedown d'un champ perdu : révélée et mise au cimetière. */
  | { type: 'facedown-lost'; playerId: string; cardId: string }
  | {
      type: 'spell-countered';
      cardId: string;
      playerId: string;
      sourceId: string;
    }
  | { type: 'gear-detached'; gearId: string; unitId: string; zoneId: string }
  | {
      type: 'battlefield-selected';
      playerId: string;
      battlefieldId: string;
      method: 'random' | 'choice';
    }
  | {
      type: 'opening-dice-rolled';
      rolls: Readonly<Record<string, number>>;
      winnerId: string | null;
    }
  | { type: 'first-player-chosen'; playerId: string; firstPlayerId: string }
  | { type: 'mulligan-completed'; playerId: string; cardIds: string[] }
  | { type: 'conquest-point-replaced'; playerId: string; battlefieldId: string }
  | {
      type: 'spell-cast' | 'spell-resolved';
      playerId: string;
      cardId: string;
      targetId: string;
    }
  | {
      type: 'cost-paid';
      playerId: string;
      cardId: string;
      energy: number;
      power: Readonly<Record<string, number>>;
    }
  | {
      type: 'unit-played';
      playerId: string;
      unitId: string;
      definitionId: string;
      zoneId: string;
    }
  | { type: 'combat-damage-window'; battlefieldId: string }
  | { type: 'damage-assigned'; playerId: string }
  | { type: 'combat-damage'; allocations: readonly DamageAllocation[] }
  | { type: 'unit-died'; unitId: string; zoneId: string }
  | { type: 'unit-retreated'; unitId: string; zoneId: string }
  | { type: 'unit-recalled'; unitId: string; zoneId: string }
  | { type: 'spell-damage'; cardId: string; unitId: string; amount: number }
  /** Dégâts infligés directement par une unité hors combat, distincts d'un sort/capacité. */
  | {
      type: 'unit-damage';
      context: 'duel' | 'strike';
      sourceId: string;
      unitId: string;
      amount: number;
    }
  | { type: 'units-healed'; unitIds: string[] }
  | { type: 'showdown-ended'; battlefieldId: string }
  | { type: 'deck-recycled'; playerId: string; cardIds: string[] }
  | {
      type: 'deck-penalty';
      playerId: string;
      drawingPlayerId: string;
      amount: number;
      source: 'OTHER';
    }
  | ({ type: 'game-ended' } & GameResult)
  | { type: 'phase-started'; playerId: string; phase: TurnPhase }
  | { type: 'cards-readied'; playerId: string; cardIds: string[] }
  | { type: 'runes-channeled'; playerId: string; cardIds: string[] }
  | { type: 'card-drawn'; playerId: string; cardId: string }
  | { type: 'resources-cleared'; boundary: 'end' | 'draw' }
  | { type: 'turn-ended'; playerId: string }
  | { type: 'turn-started'; playerId: string }
  | { type: 'unit-moved'; unitId: string; from: string; to: string }
  | { type: 'showdown-opened'; battlefieldId: string }
  | { type: 'priority-passed'; playerId: string }
  | { type: 'battlefield-conquered'; playerId: string; battlefieldId: string }
  | {
      type: 'point-scored';
      playerId: string;
      battlefieldId: string;
      source: 'CONQUEST' | 'HOLD';
    };

/**
 * Sortie à examiner via `ok` avant de lire les autres champs.
 * - true : `state` est le nouvel état à conserver ; `events` décrit cette action.
 * - false : `reason` explique le refus ; aucun nouvel état ni événement n'est fourni.
 *   L'appelant conserve alors son état précédent.
 *
 * Codes actuels de refus :
 * DEATH_CHOICES_REQUIRED / NO_DEATH_CHOICE / INVALID_DEATH_CHOICES : choix d'effets de mort attendus/refusés.
 * DEATH_EFFECTS_IN_PROGRESS : pas de passe en fenêtre d'Action après les dégâts.
 * INVALID_SUMMON_DESTINATION : mise en jeu hors base propre ou champ contrôlé.
 * INVALID_GAME_CONFIG : composition, couleurs ou identifiants initiaux invalides.
 * SETUP_IN_PROGRESS : terminer la préparation avant les actions de jeu.
 * NO_ROLL_WINDOW / INVALID_DICE_ROLL : étape incorrecte ou résultats de d20 invalides.
 * NO_FIRST_PLAYER_CHOICE / NOT_DICE_WINNER : choix de départ hors fenêtre ou mauvais décideur.
 * NO_BATTLEFIELD_CHOICE / BATTLEFIELD_ALREADY_CHOSEN / INVALID_BATTLEFIELD_CHOICE : choix de champ refusé.
 * NO_MULLIGAN_WINDOW / MULLIGAN_ALREADY_DONE / INVALID_MULLIGAN : mulligan refusé.
 * UNKNOWN_PLAYER : joueur absent de la partie.
 * GAME_OVER : la partie est terminée.
 * MOVEMENT_WINDOW_CLOSED : mauvais joueur actif, phase incompatible ou Showdown en cours.
 * INVALID_UNIT : unité absente ou appartenant à un autre joueur.
 * UNIT_NOT_READY : unité Tap.
 * UNSUPPORTED_DESTINATION : origine/destination invalide ou déplacement non pris en charge.
 * UNSUPPORTED_MODE : déplacement demandé dans un mode autre que 1v1.
 * NO_PRIORITY : pas de Showdown ou priorité détenue par un autre joueur.
 * INVALID_PARTICIPANTS : impossible de déterminer le prochain participant.
 * NOT_ACTIVE_PLAYER : seul le joueur actif peut terminer son tour.
 * NOT_MAIN_PHASE : la fin volontaire du tour exige la phase Main.
 * SHOWDOWN_IN_PROGRESS : terminer le Showdown avant de terminer le tour.
 * PLAY_WINDOW_CLOSED / CARD_NOT_IN_HAND / UNKNOWN_UNIT_DEFINITION / MISSING_BASE : mise en jeu impossible.
 * PLAY_LOCKED : le joueur ne peut plus jouer de carte ce tour (Brynhir Thundersong).
 * PICK_CHOICE_REQUIRED / NO_PICK_CHOICE : choix de carte regardée en attente ou absent.
 * DUPLICATE_RUNE / INVALID_RUNE / RUNE_NOT_READY / MISSING_RUNE_PILE : plan de paiement invalide.
 * INSUFFICIENT_RESOURCES : coût non couvert, aucun paiement partiel.
 * DAMAGE_ASSIGNMENT_REQUIRED / NO_DAMAGE_WINDOW : mauvaise fenêtre de combat.
 * DAMAGE_ALREADY_ASSIGNED / INVALID_DAMAGE_ALLOCATION : répartition refusée.
 * STACK_IN_PROGRESS : seuls les Réactions, les capacités ADD et les passes sont possibles.
 * NO_RESOURCE_ABILITY / ABILITY_WINDOW_CLOSED : capacité ADD absente ou fenêtre/priorité fermée.
 * SPELL_WINDOW_CLOSED : timing ou priorité incompatible avec le sort.
 * UNKNOWN_SPELL_DEFINITION / INVALID_TARGET / MISSING_GRAVEYARD : sort ou contexte invalide.
 * UNKNOWN_GEAR_DEFINITION / INVALID_GEAR : définition ou gear en jeu absent/non possédé.
 * NOT_EQUIPMENT / GEAR_ALREADY_ATTACHED : coût d'équipement absent ou porteur encore attaché.
 */
export type ActionResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; reason: string };

/** Victoire par seuil de points, ou défaite par épuisement avec perdant explicite. */
export type GameResult =
  | { winnerId: string; reason: 'POINTS' }
  /** The Grand Plaza : tenue avec 7 unités ou plus. */
  | { winnerId: string; reason: 'GRAND_PLAZA' }
  | { winnerId: string; loserId: string; reason: 'DECK_EXHAUSTION' };
