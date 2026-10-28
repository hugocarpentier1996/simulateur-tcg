import type { GameState } from '../types.js';
/** Légendes du joueur en zone dédiée -> sources et définitions actives, même Tap.
 * Ne compte pas les cartes de même définition ailleurs ; aucun effet réseau/hasard. */
export function activeLegends(state: GameState, playerId: string) {
  return state.cards.flatMap((card) => {
    const definition = state.legendDefinitions?.find(
      (d) => d.id === card.definitionId,
    );
    return definition &&
      card.ownerId === playerId &&
      state.zones.some(
        (z) =>
          z.id === card.zoneId && z.ownerId === playerId && z.kind === 'legend',
      )
      ? [{ card, definition }]
      : [];
  });
}
