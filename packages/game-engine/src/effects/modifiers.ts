import type { GameState, UnitState } from '../types.js';
import { gearMightBonus } from './gear-bonus.js';
import { combatMightBonus } from './combat-bonus.js';
import { runeMightBonus } from './rune-bonus.js';

/** Unité + état -> Might actuelle avec auras/équipement et Assault/Shield, sans modifier la valeur imprimée.
 * Sans état : seulement Might de base et modificateurs temporaires (compatibilité des anciens appels). */
export function effectiveMight(unit: UnitState, state?: GameState): number {
  return Math.max(
    0,
    unit.might +
      (state ? gearMightBonus(unit, state) : 0) +
      (state ? combatMightBonus(unit, state) : 0) +
      (state ? runeMightBonus(unit, state) : 0) +
      (unit.temporaryEffects ?? []).reduce(
        (sum, effect) =>
          sum + (effect.type === 'modify-might' ? effect.amount : 0),
        0,
      ),
  );
}
/** Unité -> présence d'un Stun actif. */
export function isStunned(unit: UnitState): boolean {
  return (
    !!unit.stunned ||
    !!unit.temporaryEffects?.some((effect) => effect.type === 'stun')
  );
}
