import type {
  GameState,
  GameAction,
  DamageAllocation,
  UnitState,
} from '../types.js';
import { combatPower, lethalDamage } from '../combat/allocation.js';
import { canSummonAt } from '../actions/unit-destination.js';

/** Choix de dégâts ou d'effets de mort -> candidats complets. La validation finale reste act.
 * Énumération combinatoire : prévue pour les petits plateaux du prototype, sans troncature cachée. */
export function* resolutionChoices(
  state: GameState,
  playerId: string,
): Generator<GameAction> {
  if (state.pendingDeaths) {
    if (state.pendingDeaths.playerOrder[0] !== playerId) return;
    const sources = state.pendingDeaths.triggers
      .filter((t) => t.ownerId === playerId)
      .map((t) => t.sourceId);
    const zones = state.zones
      .filter((z) => canSummonAt(state, playerId, z.id))
      .map((z) => z.id);
    function* choose(
      left: string[],
      selected: { sourceId: string; destinationId: string }[],
    ): Generator<GameAction> {
      if (!left.length) {
        yield { type: 'queue-death-effects', playerId, effects: selected };
        return;
      }
      for (const sourceId of left)
        for (const destinationId of zones)
          yield* choose(
            left.filter((id) => id !== sourceId),
            [...selected, { sourceId, destinationId }],
          );
    }
    yield* choose(sources, []);
    return;
  }
  const combat = state.showdown;
  if (
    combat?.kind !== 'combat' ||
    combat.stage !== 'damage' ||
    combat.assignments[playerId]
  )
    return;
  const units = state.units.filter((u) => u.zoneId === combat.battlefieldId);
  const power = combatPower(
    units.filter((u) => u.ownerId === playerId),
    state,
  );
  function* allocate(
    remaining: number,
    targets: UnitState[],
    allocations: DamageAllocation[],
  ): Generator<GameAction> {
    if (remaining === 0 || targets.length === 0) {
      yield { type: 'assign-damage', playerId, allocations };
      return;
    }
    for (const target of targets) {
      const amount = Math.min(remaining, lethalDamage(target, state));
      if (amount <= 0) continue;
      yield* allocate(
        remaining - amount,
        targets.filter((t) => t.id !== target.id),
        [...allocations, { targetId: target.id, amount }],
      );
    }
  }
  yield* allocate(
    power,
    units.filter((u) => u.ownerId !== playerId),
    [],
  );
}

/** Préparation -> choix du joueur (pas les dés, qui restent une entrée serveur). */
export function* setupChoices(
  state: GameState,
  playerId: string,
): Generator<GameAction> {
  const setup = state.setup;
  if (setup?.stage === 'choose-battlefield')
    for (const field of setup.options[playerId] ?? [])
      yield { type: 'choose-battlefield', playerId, battlefieldId: field.id };
  if (setup?.stage === 'choose-first')
    for (const p of state.players)
      yield { type: 'choose-first-player', playerId, firstPlayerId: p.id };
  if (setup?.stage === 'mulligan') {
    const hand = state.cards.filter(
      (c) =>
        c.ownerId === playerId &&
        state.zones.some((z) => z.id === c.zoneId && z.kind === 'hand'),
    );
    yield { type: 'mulligan', playerId, cardIds: [] };
    for (const a of hand) {
      yield { type: 'mulligan', playerId, cardIds: [a.id] };
      for (const b of hand)
        if (a.id !== b.id)
          yield { type: 'mulligan', playerId, cardIds: [a.id, b.id] };
    }
  }
}
