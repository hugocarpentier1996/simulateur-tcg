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

/** Défausse de `count` cartes choisies puis `draw` pioches : main vide -> pioches seules. */
export function startDiscard(
  state: GameState,
  playerId: string,
  sourceId: string,
  count: number,
  draw: number,
): Extract<ActionResult, { ok: true }> {
  if (count > 0 && handSize(state, playerId) > 0)
    return {
      ok: true,
      state: {
        ...state,
        pendingDiscard: { playerId, sourceId, remaining: count, draw },
      },
      events: [],
    };
  let next = state;
  const events: Extract<ActionResult, { ok: true }>['events'] = [];
  for (let i = 0; i < draw && !next.result; i++) {
    const drawn = drawCardForPlayer(next, playerId);
    next = drawn.state;
    events.push(...drawn.events);
  }
  return { ok: true, state: next, events };
}

export function handSize(state: GameState, playerId: string): number {
  return state.cards.filter(
    (c) =>
      c.ownerId === playerId &&
      state.zones.some(
        (z) => z.id === c.zoneId && z.kind === 'hand' && z.ownerId === playerId,
      ),
  ).length;
}
