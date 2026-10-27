import type { CardInstance, UnitBlueprint } from './types.js';

/** Catalogue de confiance : effets ordonnés compatibles avec game-data, sans dépendance d'exécution. */
export interface SpellBlueprint {
  readonly id: string;
  readonly type: 'spell';
  readonly timing: 'normal' | 'action' | 'reaction';
  readonly cost: UnitBlueprint['cost'];
  readonly target:
    | { readonly kind: 'battlefield' }
    | {
        readonly zone?: 'battlefield';
        readonly allegiance?: 'friendly';
        readonly kind: 'unit';
        readonly combatRole: 'any' | 'attacker';
      };
  readonly effects: readonly (
    | {
        readonly type: 'damage-enemies-at-battlefield';
        readonly amount: number;
      }
    | { readonly type: 'kill-unit' }
    | { readonly type: 'duel' }
    | { readonly type: 'damage'; readonly amount: number }
    | { readonly type: 'recall-on-death'; readonly duration: 'end-of-turn' }
    | {
        readonly type: 'move-unit';
        readonly requiresReady: false;
        readonly exhaustsUnit: false;
      }
    | {
        readonly type: 'modify-might';
        readonly amount: number;
        readonly duration: 'end-of-turn';
      }
    | { readonly type: 'stun'; readonly duration: 'end-of-turn' }
    | {
        readonly type: 'draw';
        readonly count: number;
        readonly player: 'caster';
      }
  )[];
}

/** Sort payé en attente : cible et destination choisies au lancement, revérifiées à la résolution. */
export interface SpellEntry {
  card: CardInstance;
  definition: SpellBlueprint;
  casterId: string;
  targetId: string;
  /** Adversaire du duel choisi au lancement ; requis pour l'effet duel. */
  secondaryTargetId?: string;
  destinationId?: string;
}
