import type { GameState } from '../types.js';
/** Joueur + zone -> mise en jeu autorisée en base propre ou sur champ contrôlé.
 * Le contrôle conservé pendant un Showdown fait autorité, même sans unité survivante. */
export function canSummonAt(
  state: GameState,
  playerId: string,
  destinationId: string,
): boolean {
  return state.zones.some(
    (z) =>
      z.id === destinationId &&
      ((z.kind === 'base' && z.ownerId === playerId) ||
        (z.kind === 'battlefield' &&
          state.battlefields.some(
            (f) => f.zoneId === z.id && f.controllerId === playerId,
          ))),
  );
}
