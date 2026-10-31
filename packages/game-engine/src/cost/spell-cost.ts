import { effectiveMight } from '../effects/modifiers.js';
import type { GameState, UnitBlueprint } from '../types.js';
import type { SpellBlueprint } from '../spell-types.js';
/** Définition de sort -> coût payable. Réduction propre au sort d'abord (plancher 0 :
 * Find Your Center si un adversaire est à `within` points ou moins de son seuil de
 * victoire ; Sky Splitter : plus haute Might alliée), puis réduction des Apprentices alliés sur les champs (cumul, plancher 1 sans
 * augmenter un sort à 0). Power et coût imprimé restent inchangés. */
export function spellCost(
  state: GameState,
  playerId: string,
  definition: Pick<SpellBlueprint, 'cost' | 'costReduction'>,
): UnitBlueprint['cost'] {
  const printed = definition.cost;
  const own = definition.costReduction;
  const ownReduction =
    own?.kind === 'highest-own-might'
      ? Math.max(
          0,
          ...state.units
            .filter((u) => u.ownerId === playerId)
            .map((u) => effectiveMight(u, state)),
        )
      : own?.kind === 'opponent-near-victory' &&
          state.players.some(
            (p) =>
              p.id !== playerId &&
              p.score >= (p.victoryTarget ?? 8) - own.within,
          )
        ? own.energy
        : 0;
  const base = Math.max(0, printed.energy - ownReduction);
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
    energy: Math.min(base, Math.max(1, base - reduction)),
  };
}
