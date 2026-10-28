import type { GameState, UnitBlueprint } from '../types.js';
/** Mise en jeu prévue -> choix de cible avant paiement et réactions ; undefined seulement sans cible possible. */
export function playTargetChoices(
  state: GameState,
  sourceId: string,
  definition: UnitBlueprint,
  destinationId?: string,
): (string | undefined)[] {
  if (definition.onPlayMoveToBase) {
    const ids = state.units
      .filter((u) => state.battlefields.some((f) => f.zoneId === u.zoneId))
      .map((u) => u.id);
    if (state.battlefields.some((f) => f.zoneId === destinationId))
      ids.push(sourceId);
    return ids.length ? ids : [undefined];
  }
  if (!definition.onPlayReadyOther) return [undefined];
  const ids = state.units.filter((u) => u.id !== sourceId).map((u) => u.id);
  return ids.length ? ids : [undefined];
}
