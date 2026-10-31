import type { CardInstance, UnitBlueprint } from './types.js';

/** Catalogue de confiance : effets ordonnés compatibles avec game-data, sans dépendance d'exécution. */
export interface SpellBlueprint {
  readonly id: string;
  readonly type: 'spell';
  readonly optionalExhaustAlly?: boolean;
  readonly timing: 'normal' | 'action' | 'reaction';
  readonly cost: UnitBlueprint['cost'];
  readonly target:
    | { readonly kind: 'graveyard-unit' }
    | { readonly kind: 'caster' }
    | { readonly kind: 'battlefield' }
    | {
        readonly zone?: 'battlefield';
        readonly maximumMight?: number;
        readonly allegiance?: 'friendly';
        readonly kind: 'unit';
        readonly combatRole: 'any' | 'attacker';
      };
  readonly effects: readonly (
    | {
        readonly type: 'summon-recruits';
        readonly definitionId: string;
        readonly count: number;
      }
    | {
        readonly type: 'boost-selected-allies';
        readonly count: 2;
        readonly amount: number;
        readonly duration: 'end-of-turn';
      }
    | { readonly type: 'move-up-to-two-allies-to-base' }
    | {
        readonly type: 'boost-allies';
        readonly amount: number;
        readonly duration: 'end-of-turn';
      }
    | {
        readonly type: 'damage-enemies-at-battlefield';
        readonly amount: number;
      }
    | { readonly type: 'damage-enemies-in-combat'; readonly amount: number }
    /** Dégâts de sort à toutes les unités sur tous les champs (alliées comprises). */
    | { readonly type: 'damage-all-at-battlefields'; readonly amount: number }
    /** Épuise toutes les unités alliées du lanceur. */
    | { readonly type: 'exhaust-allies' }
    /** Assault temporaire (+amount en attaque) jusqu'à la fin du tour. */
    | {
        readonly type: 'grant-assault';
        readonly amount: number;
        readonly duration: 'end-of-turn';
      }
    | { readonly type: 'return-graveyard-unit' }
    | {
        readonly type: 'channel-exhausted';
        readonly count: number;
        /** Pioche 1 si moins de `count` runes ont pu être canalisées. */
        readonly drawIfShort?: boolean;
      }
    | { readonly type: 'units-enter-ready' }
    | {
        readonly type: 'damage-selected-units';
        readonly maximum: 2;
        readonly amount: number;
      }
    | { readonly type: 'return-unit-to-hand' }
    | { readonly type: 'kill-unit' }
    | { readonly type: 'duel' }
    | {
        readonly type: 'damage';
        readonly drawIfKilled?: number;
        readonly amount: number;
      }
    | { readonly type: 'recall-on-death'; readonly duration: 'end-of-turn' }
    | {
        readonly type: 'move-unit';
        readonly requiresReady: false;
        readonly exhaustsUnit: false;
      }
    | {
        readonly type: 'modify-might';
        /** Bonus supplémentaire si aucune autre unité alliée n'est dans cette zone à la résolution. */
        readonly aloneBonus?: number;
        /** Limite de cette réduction au moment de sa résolution, sans relever une Might déjà inférieure. */
        readonly minimum?: number;
        readonly amount: number;
        readonly duration: 'end-of-turn';
      }
    | { readonly type: 'stun'; readonly duration: 'end-of-turn' }
    | {
        readonly type: 'draw';
        readonly countIfExhausted?: number;
        readonly count: number;
        readonly player: 'caster';
      }
  )[];
}

/** Sort payé en attente : cible et destination choisies au lancement, revérifiées à la résolution.
 * targetId désigne une unité, un champ, ou le lanceur pour un effet global sans cible individuelle. */
export interface SpellEntry {
  /** Coût supplémentaire déjà payé ; reste vrai si l’unité quitte ensuite le terrain. */
  exhaustedForCost?: boolean;
  /** Copie des destinations annoncées pour les Recrues. */
  tokenDestinations?: readonly string[];
  card: CardInstance;
  definition: SpellBlueprint;
  casterId: string;
  targetId: string;
  /** Flash : sélection de 0 à 2 unités alliées, copiée au lancement. */
  selectedUnitIds?: readonly string[];
  /** Adversaire du duel choisi au lancement ; requis pour l'effet duel. */
  secondaryTargetId?: string;
  destinationId?: string;
}
