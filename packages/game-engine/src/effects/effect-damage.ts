import { battlefieldDefinition } from './battlefield.js';
import type { GameState, UnitState, ActionResult } from '../types.js';
import { spellAbilityDamageBonus } from './damage-bonus.js';
export type EffectDamageSource =
  | { kind: 'spell'; cardId: string; playerId: string }
  | { kind: 'ability'; sourceId: string; playerId: string };
/** Cibles validées -> dégâts simultanés de sort/capacité avec bonus, sans traiter les morts.
 * Ne sert jamais au combat ni aux dégâts directs entre unités. Montant invalide refusé. */
export function dealEffectDamage(
  state: GameState,
  source: EffectDamageSource,
  targets: readonly UnitState[],
  baseAmount: number,
): Extract<ActionResult, { ok: true }> {
  if (!Number.isFinite(baseAmount) || baseAmount < 0)
    throw new RangeError('Dégâts invalides.');
  const amount = baseAmount + spellAbilityDamageBonus(state, source.playerId);
  const ids = new Set(targets.map((u) => u.id));
  const damage = (id: string) =>
    amount +
    (battlefieldDefinition(state, state.units.find((u) => u.id === id)!.zoneId)
      ?.effectDamageBonus ?? 0);
  return {
    ok: true,
    state: {
      ...state,
      units: state.units.map((u) =>
        ids.has(u.id) ? { ...u, damage: u.damage + damage(u.id) } : u,
      ),
    },
    events: [...ids].map((unitId) =>
      source.kind === 'spell'
        ? {
            type: 'spell-damage',
            cardId: source.cardId,
            unitId,
            amount: damage(unitId),
          }
        : {
            type: 'ability-damage',
            sourceId: source.sourceId,
            unitId,
            amount: damage(unitId),
          },
    ),
  };
}
