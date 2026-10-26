import type { GameState, GameEvent, ActionResult } from '../types.js';

/**
 * Entrée : Showdown à clore, avec au plus un camp présent sur le champ.
 * Appelé après les passes en Open, ou après résolution des morts en combat.
 * Sortie : Showdown fermé, conquête et éventuellement +1 point, avec leurs événements.
 * L'état fourni n'est pas modifié ; la restriction du dernier point reste à ajouter.
 */
export function resolveOpenShowdown(
  state: GameState,
  showdown: NonNullable<GameState['showdown']>,
): Extract<ActionResult, { ok: true }> {
  const events: GameEvent[] = [];
  const battlefieldId = showdown.battlefieldId;
  const playerId = state.units.find(
    (unit) => unit.zoneId === battlefieldId,
  )?.ownerId;
  if (!playerId)
    return {
      ok: true,
      state: {
        ...state,
        showdown: null,
        battlefields: state.battlefields.map((field) =>
          field.zoneId === battlefieldId
            ? { ...field, controllerId: null }
            : field,
        ),
      },
      events: [{ type: 'showdown-ended', battlefieldId }],
    };
  const alreadyScored = state.scoredBattlefields[playerId] ?? [];
  const earnsPoint = !alreadyScored.includes(battlefieldId);
  events.push({ type: 'battlefield-conquered', playerId, battlefieldId });
  if (earnsPoint)
    events.push({
      type: 'point-scored',
      playerId,
      battlefieldId,
      source: 'CONQUEST',
    });
  return {
    ok: true,
    state: {
      ...state,
      showdown: null,
      battlefields: state.battlefields.map((field) =>
        field.zoneId === battlefieldId
          ? { ...field, controllerId: playerId }
          : field,
      ),
      players: state.players.map((player) =>
        player.id === playerId && earnsPoint
          ? { ...player, score: player.score + 1 }
          : player,
      ),
      scoredBattlefields: earnsPoint
        ? {
            ...state.scoredBattlefields,
            [playerId]: [...alreadyScored, battlefieldId],
          }
        : state.scoredBattlefields,
    },
    events,
  };
}
