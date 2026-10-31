import { battlefieldDefinition } from '../effects/battlefield.js';
import { settleLethalUnits } from '../effects/lethal-units.js';
import { queueHoldChannel, queueHoldDraw } from '../effects/hold-channel.js';
import { queueHoldUnits } from '../effects/hold-units.js';
import type { ActionResult, GameEvent, GameState } from '../types.js';
import { scoreBattlefield } from '../scoring/battlefield.js';

/** État en Beginning -> +1 par champ contrôlé non encore scoré ce tour.
 * Conserve la source HOLD et inscrit les champs dans le registre partagé avec
 * la conquête. Arrête les gains dès la victoire. Le contrôle fourni fait autorité ;
 * aucun Showdown ne doit être actif. Les champs suivent leur ordre dans l'état. */
export function scoreHolding(
  input: GameState,
): Extract<ActionResult, { ok: true }> {
  let state = input;
  const playerId = state.activePlayerId;
  // Temporary : ses unités meurent avant le score.
  const temporary = new Set(
    state.units
      .filter((u) => u.ownerId === playerId && u.temporary)
      .map((u) => u.id),
  );
  state = recycleTrash(state, playerId);
  const killed = temporary.size
    ? settleLethalUnits(state, temporary)
    : { state, events: [] as GameEvent[] };
  state = killed.state;
  const scored = state.scoredBattlefields[playerId] ?? [];
  const fields = state.battlefields.filter(
    (field) =>
      field.controllerId === playerId && !scored.includes(field.zoneId),
  );
  const events: GameEvent[] = [...killed.events];
  let current = state;
  for (const field of fields) {
    if (current.result) break;
    const needed = battlefieldDefinition(current, field.zoneId)?.holdWinUnits;
    if (
      needed !== undefined &&
      current.units.filter(
        (u) => u.ownerId === playerId && u.zoneId === field.zoneId,
      ).length >= needed
    ) {
      const result = { winnerId: playerId, reason: 'GRAND_PLAZA' as const };
      current = { ...current, result };
      events.push({ type: 'game-ended', ...result });
      break;
    }
    const result = scoreBattlefield(current, playerId, field.zoneId, 'HOLD');
    current = queueHoldChannel(result.state, playerId, field.zoneId);
    current = queueHoldDraw(current, playerId, field.zoneId);
    if (result.events.some((e) => e.type === 'point-scored'))
      current = queueHoldUnits(current, playerId, field.zoneId);
    events.push(...result.events);
  }
  return { ok: true, state: current, events };
}

/** Dr. Mundo : chaque unité du joueur actif recycle ses cartes de cimetière les plus
 * anciennes sous son deck. */
function recycleTrash(state: GameState, playerId: string): GameState {
  const count = state.units.reduce(
    (sum, u) =>
      u.ownerId === playerId
        ? sum +
          (state.unitDefinitions?.find((d) => d.id === u.definitionId)
            ?.recycleTrashAtBeginning ?? 0)
        : sum,
    0,
  );
  const grave = state.zones.find(
    (z) => z.kind === 'graveyard' && z.ownerId === playerId,
  );
  const deck = state.zones.find(
    (z) => z.kind === 'deck' && z.ownerId === playerId,
  );
  if (!count || !grave || !deck) return state;
  const recycled = state.cards
    .filter((c) => c.zoneId === grave.id)
    .slice(0, count);
  if (!recycled.length) return state;
  return {
    ...state,
    cards: [
      ...state.cards.filter((c) => !recycled.includes(c)),
      ...recycled.map((c) => ({ ...c, zoneId: deck.id })),
    ],
  };
}
