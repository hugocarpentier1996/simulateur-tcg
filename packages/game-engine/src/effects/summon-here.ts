import type { GameState, ActionResult } from '../types.js';
import { summonToken } from './summon-token.js';
/** Source encore en jeu + lieu annoncé -> invocation imposée, y compris sans contrôle.
 * Sortie du terrain : aucun effet. Déplacement interne : lieu initial provisoire, question documentée. */
export function summonHere(
  state: GameState,
  sourceId: string,
  ownerId: string,
  destinationId: string,
  definitionId: string,
): Extract<ActionResult, { ok: true }> {
  if (!state.units.some((u) => u.id === sourceId))
    return { ok: true, state, events: [] };
  const summoned = summonToken(
    state,
    ownerId,
    destinationId,
    definitionId,
    'here',
  );
  const field = state.battlefields.some((f) => f.zoneId === destinationId);
  return {
    ...summoned,
    state:
      summoned.events.length &&
      field &&
      state.showdown?.battlefieldId !== destinationId
        ? {
            ...summoned.state,
            pendingShowdowns: [
              ...(summoned.state.pendingShowdowns ?? []),
              { battlefieldId: destinationId, initiatorId: ownerId },
            ],
          }
        : summoned.state,
  };
}
