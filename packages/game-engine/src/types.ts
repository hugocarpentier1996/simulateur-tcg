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
  /** Fin de tour suspendue jusqu'à résolution des capacités, morts et Showdowns induits. */
  pendingTurnEnd?: boolean;
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
            defenderId: string;
            stage: 'priority' | 'damage' | 'effects';
            assignments: Record<string, readonly DamageAllocation[]>;
          }
      ))
    | null;
}

/** Définition structurelle acceptée par le moteur ; compatible avec le catalogue game-data. */
export interface UnitBlueprint {
  readonly spellAbilityDamageBonus?: number;
  /** Capacité ADD : épuiser cette unité Ready pour produire cette énergie réservée aux sorts. */
  readonly spellEnergyAbility?: number;
  /** Capacité déclenchée à la mise en jeu : dégâts à toutes les unités sur les champs. */
  readonly onPlayBattlefieldDamage?: number;
  /** À la mise en jeu, récupérer le sort choisi de son cimetière via la pile. */
  readonly onPlayReturnSpell?: boolean;
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
    | { type: 'stun' }
    | { type: 'recall-on-death' }
  )[];
  id: string;
  ownerId: string;
  zoneId: string;
  ready: boolean;
  definitionId: string;
  might: number;
  damage: number;
  tank?: boolean;
  backline?: boolean;
  stunned?: boolean;
  cannotDealDamage?: boolean;
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
  | { type: 'activate-spell-energy'; playerId: string; unitId: string }
  | {
      type: 'queue-death-effects';
      playerId: string;
      effects: readonly { sourceId: string; destinationId: string }[];
    }
  | {
      type: 'play-gear';
      playerId: string;
      cardId: string;
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
      payment: PaymentPlan;
    }
  | {
      type: 'play-unit';
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
      type: 'legend-effect-queued' | 'legend-effect-resolved';
      sourceId: string;
    }
  | { type: 'spell-returned'; playerId: string; cardId: string }
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
      context: 'duel';
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
  | { winnerId: string; loserId: string; reason: 'DECK_EXHAUSTION' };
