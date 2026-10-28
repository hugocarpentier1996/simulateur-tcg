import type { ActionResult, GameState } from '../types.js';
import { drawCardForPlayer } from '../turn/draw.js';
/** Résolution après réactions : main non vide -> choix obligatoire ; main vide -> pioche seule.
 * Le choix porte sur la main actuelle, jamais sur les informations cachées de l'adversaire. */
export function startLoot(
  state: GameState,
  playerId: string,
  sourceId: string,
): Extract<ActionResult, { ok: true }> {
  const hasCard = state.cards.some(
    (c) =>
      c.ownerId === playerId &&
      state.zones.some(
        (z) => z.id === c.zoneId && z.kind === 'hand' && z.ownerId === playerId,
      ),
  );
  return hasCard
    ? {
        ok: true,
        state: { ...state, pendingDiscard: { playerId, sourceId } },
        events: [],
      }
    : drawCardForPlayer(state, playerId);
}
