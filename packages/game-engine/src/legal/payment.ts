import type { GameState, PaymentPlan, UnitBlueprint } from '../types.js';
import { payCost } from '../cost/payment.js';

/** Coût -> un paiement déterministe sans production superflue, ou null si impayable.
 * Power : runes Tap d'abord. Énergie : Ready, y compris celles recyclées dans ce paiement.
 * Ne prétend pas énumérer toutes les stratégies de paiement ; act accepte les autres plans valides. */
export function findPayment(
  state: GameState,
  playerId: string,
  cost: UnitBlueprint['cost'],
): PaymentPlan | null {
  const runes = state.cards.filter(
    (c) =>
      c.ownerId === playerId &&
      c.color &&
      state.zones.some(
        (z) =>
          z.id === c.zoneId && z.kind === 'runes' && z.ownerId === playerId,
      ),
  );
  const floating = state.resources[playerId] ?? { energy: 0, power: {} };
  const powerRunes: string[] = [];
  for (const [color, amount] of Object.entries(cost.power)) {
    const required = Math.max(
      0,
      Math.ceil(amount - (floating.power[color] ?? 0)),
    );
    const candidates = runes
      .filter((r) => r.color === color)
      .sort((a, b) => Number(a.ready === true) - Number(b.ready === true));
    if (candidates.length < required) return null;
    powerRunes.push(...candidates.slice(0, required).map((r) => r.id));
  }
  const count = Math.max(0, Math.ceil(cost.energy - floating.energy));
  const ready = runes.filter((r) => r.ready === true);
  if (ready.length < count) return null;
  const payment = {
    energyRunes: ready.slice(0, count).map((r) => r.id),
    powerRunes,
  };
  return payCost(state, playerId, cost, payment).ok ? payment : null;
}
