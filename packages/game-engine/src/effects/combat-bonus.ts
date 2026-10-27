import type { GameState, UnitState } from '../types.js';

/** Unité + état -> bonus Shield du catalogue, zéro hors défense du Combat Showdown.
 * Actif jusqu'à sa clôture, y compris pendant les effets de mort. Ne modifie pas la carte. */
export function combatMightBonus(unit: UnitState, state: GameState): number {
  const combat = state.showdown;
  if (
    combat?.kind !== 'combat' ||
    unit.zoneId !== combat.battlefieldId ||
    unit.ownerId !== combat.defenderId
  )
    return 0;
  return (
    state.unitDefinitions?.find((d) => d.id === unit.definitionId)?.shield ?? 0
  );
}
