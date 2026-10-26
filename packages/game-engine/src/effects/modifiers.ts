import type { UnitState } from '../types.js';

/** Unité -> Might actuelle, sans modifier sa valeur imprimée. */
export function effectiveMight(unit: UnitState): number {
  return Math.max(
    0,
    unit.might +
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
