import type { GameState, PaymentPlan, UnitBlueprint } from '../types.js';
import { payCost } from '../cost/payment.js';

/** Coût -> un paiement déterministe sans production superflue, ou null si impayable.
 * purpose='spell' permet la réserve réservée aux sorts ; ordinary l'exclut.
 * Power : runes Tap d'abord. Énergie : Ready, y compris celles recyclées dans ce paiement.
 * Ne prétend pas énumérer toutes les stratégies de paiement ; act accepte les autres plans valides. */
export function findPayment(
  state: GameState,
  playerId: string,
  cost: UnitBlueprint['cost'],
  purpose: 'ordinary' | 'spell' = 'ordinary',
): PaymentPlan | null {
  if (cost.powerChoice) {
    const floating = state.resources[playerId]?.power ?? {};
    const colors = [...cost.powerChoice].sort(
      (a, b) =>
        Number((floating[b] ?? 0) > (cost.power[b] ?? 0)) -
        Number((floating[a] ?? 0) > (cost.power[a] ?? 0)),
    );
    for (const color of colors) {
      const plan = findPayment(
        state,
        playerId,
        {
          energy: cost.energy,
          ...(cost.genericPower ? { genericPower: cost.genericPower } : {}),
          ...((cost.powerChoiceAmount ?? 1) > 1
            ? {
                powerChoice: cost.powerChoice,
                powerChoiceAmount: (cost.powerChoiceAmount ?? 1) - 1,
              }
            : {}),
          power: { ...cost.power, [color]: (cost.power[color] ?? 0) + 1 },
        },
        purpose,
      );
      if (plan) return plan;
    }
    return null;
  }
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
  const produced = { ...floating.power };
  for (const id of powerRunes) {
    const color = runes.find((r) => r.id === id)!.color!;
    produced[color] = (produced[color] ?? 0) + 1;
  }
  for (const [color, n] of Object.entries(cost.power))
    produced[color] = (produced[color] ?? 0) - n;
  const needed = Math.max(
    0,
    (cost.genericPower ?? 0) -
      Object.values(produced).reduce((a, b) => a + b, 0),
  );
  const genericRunes = runes
    .filter((r) => !powerRunes.includes(r.id))
    .sort((a, b) => Number(a.ready === true) - Number(b.ready === true));
  if (genericRunes.length < needed) return null;
  powerRunes.push(...genericRunes.slice(0, needed).map((r) => r.id));
  const count = Math.max(
    0,
    Math.ceil(
      cost.energy -
        floating.energy -
        (purpose === 'spell' ? (floating.spellEnergy ?? 0) : 0),
    ),
  );
  const ready = runes.filter((r) => r.ready === true);
  if (ready.length < count) return null;
  const payment = {
    energyRunes: ready.slice(0, count).map((r) => r.id),
    powerRunes,
  };
  return payCost(state, playerId, cost, payment, purpose).ok ? payment : null;
}
