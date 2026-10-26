import type { ActionResult, GameEvent, GameState } from '../types.js';

/** État en Beginning -> +1 par champ contrôlé non encore scoré ce tour.
 * Conserve la source HOLD et inscrit les champs dans le registre partagé avec
 * la conquête. Le contrôle fourni fait autorité ; aucun Showdown ne doit être actif. */
export function scoreHolding(
  state: GameState,
): Extract<ActionResult, { ok: true }> {
  const playerId = state.activePlayerId;
  const scored = state.scoredBattlefields[playerId] ?? [];
  const fields = state.battlefields.filter(
    (field) =>
      field.controllerId === playerId && !scored.includes(field.zoneId),
  );
  const events: GameEvent[] = fields.map((field) => ({
    type: 'point-scored',
    playerId,
    battlefieldId: field.zoneId,
    source: 'HOLD',
  }));
  return {
    ok: true,
    state: {
      ...state,
      players: state.players.map((player) =>
        player.id === playerId
          ? { ...player, score: player.score + fields.length }
          : player,
      ),
      scoredBattlefields: {
        ...state.scoredBattlefields,
        [playerId]: [...scored, ...fields.map((field) => field.zoneId)],
      },
    },
    events,
  };
}
