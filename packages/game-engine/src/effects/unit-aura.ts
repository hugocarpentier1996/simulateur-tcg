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

/** Bonus personnel continu dépendant du score de son propriétaire (Draven). */
export function selfScoreMightBonus(unit: UnitState, state: GameState): number {
  const perPoint = state.unitDefinitions?.find(
    (d) => d.id === unit.definitionId,
  )?.mightPerOwnPoint;
  if (!perPoint) return 0;
  const score = state.players.find((p) => p.id === unit.ownerId)?.score ?? 0;
  return perPoint * score;
}
