import type {
  GameState,
  PaymentPlan,
  UnitBlueprint,
  ActionResult,
} from '../types.js';

/** État + coût de confiance + choix de runes -> paiement entier ou refus sans mutation.
 * Utilise les réserves flottantes et la production choisie. Les surplus restent disponibles.
 * Les runes de Power (même Tap) vont sous la pile dans l'ordre de la sélection. */
export function payCost(
  state: GameState,
  playerId: string,
  cost: UnitBlueprint['cost'],
  plan: PaymentPlan,
): { ok: true; state: GameState } | Extract<ActionResult, { ok: false }> {
  const energyIds = new Set(plan.energyRunes);
  const powerIds = new Set(plan.powerRunes);
  if (
    energyIds.size !== plan.energyRunes.length ||
    powerIds.size !== plan.powerRunes.length
  )
    return { ok: false, reason: 'DUPLICATE_RUNE' };
  const runeZone = state.zones.find(
    (z) => z.ownerId === playerId && z.kind === 'runes',
  );
  const pile = state.zones.find(
    (z) => z.ownerId === playerId && z.kind === 'rune-pile',
  );
  const selected = [...new Set([...energyIds, ...powerIds])].map((id) =>
    state.cards.find((c) => c.id === id),
  );
  if (
    selected.some(
      (c) =>
        !c ||
        !runeZone ||
        c.zoneId !== runeZone.id ||
        c.ownerId !== playerId ||
        !c.color,
    )
  )
    return { ok: false, reason: 'INVALID_RUNE' };
  if (selected.some((c) => c && energyIds.has(c.id) && c.ready !== true))
    return { ok: false, reason: 'RUNE_NOT_READY' };
  if (powerIds.size && !pile) return { ok: false, reason: 'MISSING_RUNE_PILE' };
  const previous = state.resources[playerId] ?? { energy: 0, power: {} };
  const power = { ...previous.power };
  const energy = previous.energy + energyIds.size;
  for (const card of selected)
    if (card && powerIds.has(card.id))
      power[card.color!] = (power[card.color!] ?? 0) + 1;
  if (
    energy < cost.energy ||
    Object.entries(cost.power).some(
      ([color, amount]) => (power[color] ?? 0) < amount,
    )
  )
    return { ok: false, reason: 'INSUFFICIENT_RESOURCES' };
  for (const [color, amount] of Object.entries(cost.power))
    power[color] = (power[color] ?? 0) - amount;
  const recycled = plan.powerRunes.map((id) => ({
    ...state.cards.find((c) => c.id === id)!,
    zoneId: pile!.id,
    ready: false,
  }));
  return {
    ok: true,
    state: {
      ...state,
      resources: {
        ...state.resources,
        [playerId]: { energy: energy - cost.energy, power },
      },
      cards: [
        ...state.cards
          .filter((c) => !powerIds.has(c.id))
          .map((c) => (energyIds.has(c.id) ? { ...c, ready: false } : c)),
        ...recycled,
      ],
    },
  };
}
