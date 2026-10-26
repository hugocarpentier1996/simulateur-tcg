import type { GameState, ActionResult } from '../types.js';
import { scoreBattlefield } from '../scoring/battlefield.js';

/**
 * Entrée : Showdown à clore, avec au plus un camp présent sur le champ.
 * Appelé après les passes en Open, ou après résolution des morts en combat.
 * Sortie : Showdown fermé, contrôle acquis puis score/pioche et victoire éventuelle.
 * L'état fourni n'est pas modifié ; un champ déjà scoré ne donne ni point ni pioche.
 */
export function resolveOpenShowdown(
  state: GameState,
  showdown: NonNullable<GameState['showdown']>,
): Extract<ActionResult, { ok: true }> {
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
  const conquered: GameState = {
    ...state,
    showdown: null,
    battlefields: state.battlefields.map((field) =>
      field.zoneId === battlefieldId
        ? { ...field, controllerId: playerId }
        : field,
    ),
  };
  const scored = scoreBattlefield(
    conquered,
    playerId,
    battlefieldId,
    'CONQUEST',
  );
  return {
    ...scored,
    events: [
      { type: 'battlefield-conquered', playerId, battlefieldId },
      ...scored.events,
    ],
  };
}
