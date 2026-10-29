import type { GameState } from './types.js';
/** Instance en jeu + catalogue -> tags imprimés actuels, sans mutation.
 * Unité ou définition absente : liste vide. Les changements de zone ne dupliquent pas les tags. */
export function unitTags(state: GameState, unitId: string): readonly string[] {
  const unit = state.units.find((u) => u.id === unitId);
  return (
    state.unitDefinitions?.find((d) => d.id === unit?.definitionId)?.tags ?? []
  );
}
