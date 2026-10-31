import type { GameEvent, GameState } from '../types.js';

/** Équipements désignés -> retirés du jeu et placés au cimetière de leur propriétaire
 * (event gear-killed). Ids inconnus ignorés ; aucune autre conséquence. */
export function killGears(
  state: GameState,
  gearIds: readonly string[],
): { state: GameState; events: GameEvent[] } {
  const killed = (state.gears ?? []).filter((g) => gearIds.includes(g.id));
  if (!killed.length) return { state, events: [] };
  const graveyard = (ownerId: string) => {
    const zone = state.zones.find(
      (z) => z.ownerId === ownerId && z.kind === 'graveyard',
    );
    if (!zone) throw new Error('Cimetière absent pour l’équipement détruit.');
    return zone.id;
  };
  return {
    state: {
      ...state,
      gears: state.gears!.filter((g) => !gearIds.includes(g.id)),
      cards: [
        ...state.cards,
        ...killed.map((g) => ({
          id: g.id,
          definitionId: g.definitionId,
          ownerId: g.ownerId,
          zoneId: graveyard(g.ownerId),
        })),
      ],
    },
    events: killed.map((g) => ({
      type: 'gear-killed' as const,
      gearId: g.id,
      ownerId: g.ownerId,
    })),
  };
}
