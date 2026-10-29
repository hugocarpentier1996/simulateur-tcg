import type { GameState, GameAction, ActionResult } from '../types.js';
import { moveUnit } from './move.js';

/** État et déplacements confirmés -> déplacement atomique de toutes les unités.
 * Chaque intention doit être légale dans l'état initial ; liste vide ou doublon refusé.
 * Aucun effet intermédiaire : les arrivées et Showdowns suivent ensuite le pipeline d'act.
 * Plusieurs champs sont traités dans l'ordre de leur première destination dans la liste.
 */
export function moveGroup(
  state: GameState,
  action: Extract<GameAction, { type: 'move-group' }>,
): ActionResult {
  if (
    !action.moves.length ||
    new Set(action.moves.map((m) => m.unitId)).size !== action.moves.length
  )
    return { ok: false, reason: 'INVALID_MOVE_GROUP' };
  for (const move of action.moves) {
    const result = moveUnit(state, {
      type: 'move',
      playerId: action.playerId,
      ...move,
    });
    if (!result.ok) return result;
  }
  const units = state.units.map((unit) => {
    const move = action.moves.find((m) => m.unitId === unit.id);
    return move ? { ...unit, zoneId: move.destinationId, ready: false } : unit;
  });
  const origins = new Set(
    action.moves.map((m) => state.units.find((u) => u.id === m.unitId)!.zoneId),
  );
  const destinations = [...new Set(action.moves.map((m) => m.destinationId))];
  return {
    ok: true,
    state: {
      ...state,
      units,
      battlefields: state.battlefields.map((f) =>
        origins.has(f.zoneId) && !units.some((u) => u.zoneId === f.zoneId)
          ? { ...f, controllerId: null }
          : f,
      ),
      pendingShowdowns: [
        ...(state.pendingShowdowns ?? []),
        ...destinations
          .filter((id) =>
            state.battlefields.some(
              (f) => f.zoneId === id && f.controllerId !== action.playerId,
            ),
          )
          .map((battlefieldId) => ({
            battlefieldId,
            initiatorId: action.playerId,
          })),
      ],
    },
    events: action.moves.map((m) => ({
      type: 'unit-moved',
      unitId: m.unitId,
      from: state.units.find((u) => u.id === m.unitId)!.zoneId,
      to: m.destinationId,
    })),
  };
}
