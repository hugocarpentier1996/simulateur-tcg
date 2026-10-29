import type { GameState } from '../types.js';
/** Identifiant de zone -> définition du champ, ou undefined pour base/champ sans effet connu. */
export function battlefieldDefinition(state: GameState, zoneId: string) {
  const field = state.battlefields.find((f) => f.zoneId === zoneId);
  return state.battlefieldDefinitions?.find(
    (d) => d.id === field?.definitionId,
  );
}
