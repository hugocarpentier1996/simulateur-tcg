import type { GameState, ActionResult } from '../types.js';
import { summonToken } from './summon-token.js';
/** Source encore en jeu -> invocation imposée à sa position actuelle (« here » suit la
 * carte si elle a été déplacée depuis le déclenchement), y compris sans contrôle.
 * Sortie du terrain : aucun effet. `announcedId` ne sert plus que de repli documentaire. */
export function summonHere(
  state: GameState,
  sourceId: string,
  ownerId: string,
  announcedId: string,
  definitionId: string,
): Extract<ActionResult, { ok: true }> {
  const source = state.units.find((u) => u.id === sourceId);
  if (!source) return { ok: true, state, events: [] };
  const destinationId = source.zoneId ?? announcedId;
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
