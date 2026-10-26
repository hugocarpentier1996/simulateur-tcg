import type { GameState } from './types.js';

/** Ajoute de petites piles aux scénarios centrés sur le tour, pour que leur pioche
 * ne déclenche pas une défaite sans rapport avec le comportement testé. */
export function withDrawSupplies(state: GameState): GameState {
  return {
    ...state,
    zones: [
      ...state.zones,
      ...state.players.flatMap((player) => [
        { id: `deck-${player.id}`, kind: 'deck' as const, ownerId: player.id },
        { id: `hand-${player.id}`, kind: 'hand' as const, ownerId: player.id },
      ]),
    ],
    cards: [
      ...state.cards,
      ...state.players.flatMap((player) =>
        [0, 1, 2].map((n) => ({
          id: `card-${player.id}-${n}`,
          definitionId: 'fixture',
          ownerId: player.id,
          zoneId: `deck-${player.id}`,
        })),
      ),
    ],
  };
}
