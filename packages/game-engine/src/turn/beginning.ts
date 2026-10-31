import { settleLethalUnits } from '../effects/lethal-units.js';
import { queueHoldChannel } from '../effects/hold-channel.js';
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
    const result = scoreBattlefield(current, playerId, field.zoneId, 'HOLD');
    current = queueHoldChannel(result.state, playerId, field.zoneId);
    if (result.events.some((e) => e.type === 'point-scored'))
      current = queueHoldUnits(current, playerId, field.zoneId);
    events.push(...result.events);
  }
  return { ok: true, state: current, events };
}
