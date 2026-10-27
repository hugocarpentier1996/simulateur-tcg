import type { GameState, UnitState } from '../types.js';

/** Unité + état -> bonus Assault/Shield du catalogue selon le rôle en Combat Showdown.
 * Actif jusqu'à sa clôture, y compris pendant les effets de mort. Ne modifie pas la carte. */
export function combatMightBonus(unit: UnitState, state: GameState): number {
  const combat = state.showdown;
  if (combat?.kind !== 'combat' || unit.zoneId !== combat.battlefieldId)
    return 0;
  const definition = state.unitDefinitions?.find(
    (d) => d.id === unit.definitionId,
  );
  if (unit.ownerId === combat.initiatorId) return definition?.assault ?? 0;
  if (unit.ownerId === combat.defenderId) return definition?.shield ?? 0;
  return 0;
}
