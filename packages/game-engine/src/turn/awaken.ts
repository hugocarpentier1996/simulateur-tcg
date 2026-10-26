import type { ActionResult, GameState } from '../types.js';

/** État en Awaken -> cartes du joueur actif redressées dans ses zones de jeu.
 * Exclut piles, main, cimetière et bannissement. Les exceptions de cartes viendront
 * avec les modificateurs ; seules les cartes effectivement redressées sont journalisées. */
export function awaken(state: GameState): Extract<ActionResult, { ok: true }> {
  const playableZones = new Set(
    state.zones
      .filter((zone) =>
        ['base', 'battlefield', 'runes', 'legend', 'champion'].includes(
          zone.kind,
        ),
      )
      .map((zone) => zone.id),
  );
  const cardIds: string[] = [];
  function ready<
    T extends { id: string; ownerId: string; zoneId: string; ready?: boolean },
  >(card: T): T {
    if (
      card.ownerId !== state.activePlayerId ||
      !playableZones.has(card.zoneId) ||
      card.ready !== false
    )
      return card;
    cardIds.push(card.id);
    return { ...card, ready: true };
  }
  return {
    ok: true,
    state: {
      ...state,
      units: state.units.map(ready),
      cards: state.cards.map(ready),
      ...(state.gears ? { gears: state.gears.map(ready) } : {}),
    },
    events: [
      { type: 'cards-readied', playerId: state.activePlayerId, cardIds },
    ],
  };
}
