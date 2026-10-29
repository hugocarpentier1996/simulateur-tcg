import type { GameState, UnitBlueprint } from '../types.js';
/** Coût imprimé -> coût payable des sorts, réduction des Apprentices alliés sur les champs.
 * Cumul, plancher 1 sans augmenter un sort à 0 ; Power et coût imprimé restent inchangés. */
export function spellCost(
  state: GameState,
  playerId: string,
  printed: UnitBlueprint['cost'],
): UnitBlueprint['cost'] {
  const reduction = state.units.reduce(
    (sum, u) =>
      sum +
      (u.ownerId === playerId &&
      state.battlefields.some((f) => f.zoneId === u.zoneId)
        ? (state.unitDefinitions?.find((d) => d.id === u.definitionId)
            ?.spellEnergyReductionAtBattlefield ?? 0)
        : 0),
    0,
  );
  return {
    ...printed,
    energy: Math.min(printed.energy, Math.max(1, printed.energy - reduction)),
  };
}
