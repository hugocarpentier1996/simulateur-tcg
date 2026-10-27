import type { ActionResult, GameState, UnitState } from '../types.js';
import { effectiveMight } from './modifiers.js';

/** Deux unités valides + état après bonus -> dégâts réciproques simultanés.
 * Chaque unité est la source : ni dégâts de sort/capacité ni dégâts de combat.
 * Stun n'empêche pas le duel. Pas de déplacement, épuisement, soin ou Showdown.
 * Les morts sont traitées par l'appelant après application des deux montants. */
export function resolveDuel(
  state: GameState,
  first: UnitState,
  second: UnitState,
): Extract<ActionResult, { ok: true }> {
  const hits = [
    { source: first, target: second },
    { source: second, target: first },
  ].map(({ source, target }) => ({
    sourceId: source.id,
    unitId: target.id,
    amount: source.cannotDealDamage ? 0 : effectiveMight(source, state),
  }));
  return {
    ok: true,
    state: {
      ...state,
      units: state.units.map((u) => {
        const hit = hits.find((h) => h.unitId === u.id);
        return hit ? { ...u, damage: u.damage + hit.amount } : u;
      }),
    },
    events: hits.map((hit) => ({
      type: 'unit-damage',
      context: 'duel',
      ...hit,
    })),
  };
}
