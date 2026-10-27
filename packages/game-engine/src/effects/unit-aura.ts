import type { GameState, UnitState } from '../types.js';

/** Unité cible + plateau -> somme des auras locales des autres unités alliées.
 * Même propriétaire et même zone, base comprise. Ni Ready ni Stun ne désactivent
 * une aura. Aucune mutation : le départ d'une source enlève aussitôt sa contribution. */
export function unitAuraMightBonus(unit: UnitState, state: GameState): number {
  return state.units.reduce((sum, source) => {
    if (
      source.id === unit.id ||
      source.ownerId !== unit.ownerId ||
      source.zoneId !== unit.zoneId
    )
      return sum;
    const definition = state.unitDefinitions?.find(
      (d) => d.id === source.definitionId,
    );
    return sum + (definition?.otherAlliesHereMightBonus ?? 0);
  }, 0);
}
