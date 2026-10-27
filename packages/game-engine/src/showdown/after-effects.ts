import type { GameState } from '../types.js';

/** Chaîne terminée -> Open converti en combat si contesté, ou prochaine arrivée traitée.
 * Ne clôture pas le Showdown actif et ne modifie pas son contrôleur pendant la fenêtre. */
export function afterEffects(state: GameState): GameState {
  if (state.stack || state.pendingDeaths || state.result) return state;
  const current = state.showdown;
  if (current) {
    const defender = state.units.find(
      (u) =>
        u.zoneId === current.battlefieldId && u.ownerId !== current.initiatorId,
    );
    const attacker = state.units.some(
      (u) =>
        u.zoneId === current.battlefieldId && u.ownerId === current.initiatorId,
    );
    return current.kind === 'open' && defender && attacker
      ? {
          ...state,
          showdown: {
            ...current,
            kind: 'combat',
            defenderId: defender.ownerId,
            stage: 'priority',
            assignments: {},
          },
        }
      : state;
  }
  const [arrival, ...remaining] = state.pendingShowdowns ?? [];
  if (!arrival) return state;
  const next = { ...state, pendingShowdowns: remaining };
  if (
    !state.units.some(
      (u) =>
        u.zoneId === arrival.battlefieldId && u.ownerId === arrival.initiatorId,
    )
  )
    return afterEffects(next);
  const field = state.battlefields.find(
    (f) => f.zoneId === arrival.battlefieldId,
  );
  if (field?.controllerId === arrival.initiatorId) return afterEffects(next);
  const defender = state.units.find(
    (u) =>
      u.zoneId === arrival.battlefieldId && u.ownerId !== arrival.initiatorId,
  );
  const common = {
    ...arrival,
    participants: state.players.map((p) => p.id),
    priorityPlayerId: arrival.initiatorId,
    consecutivePasses: 0,
  };
  return {
    ...next,
    priorityPlayerId: state.activePlayerId,
    showdown: defender
      ? {
          ...common,
          kind: 'combat',
          defenderId: defender.ownerId,
          stage: 'priority',
          assignments: {},
        }
      : { ...common, kind: 'open' },
  };
}
