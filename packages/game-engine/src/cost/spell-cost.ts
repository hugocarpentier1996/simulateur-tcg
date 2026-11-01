import { victoryTarget } from '../scoring/victory-target.js';
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
      : own?.kind === 'enemy-died-this-turn'
        ? state.enemyDeathsThisTurn?.includes(playerId)
          ? own.energy
          : 0
        : own?.kind === 'opponent-near-victory' &&
            state.players.some(
              (p) =>
                p.id !== playerId &&
                p.score >= victoryTarget(state, p.id) - own.within,
            )
          ? own.energy
          : 0;
  const base = Math.max(
    0,
    printed.energy - ownReduction - (state.nextSpellDiscount?.[playerId] ?? 0),
  );
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

/** Coût + X choisi -> X Power quelconque supplémentaire (sorts variablePower). */
export function withX(
  cost: UnitBlueprint['cost'],
  xPower: number | undefined,
): UnitBlueprint['cost'] {
  return xPower
    ? { ...cost, genericPower: (cost.genericPower ?? 0) + xPower }
    : cost;
}

/** Coût réellement dû au lancement : rien si un buff est dépensé à la place (Wallop). */
export function castCost(
  state: GameState,
  playerId: string,
  definition: SpellBlueprint,
  xPower: number | undefined,
  spendBuffUnitId: string | undefined,
): UnitBlueprint['cost'] {
  return spendBuffUnitId
    ? { energy: 0, power: {} }
    : withX(spellCost(state, playerId, definition), xPower);
}

/** Coût du sort + Power de l'unité du cimetière qu'il joue (play-from-trash). */
export function withTrashUnitPower(
  state: GameState,
  definition: SpellBlueprint,
  targetId: string,
  cost: UnitBlueprint['cost'],
): UnitBlueprint['cost'] {
  if (!definition.effects.some((e) => e.type === 'play-from-trash'))
    return cost;
  const unitCard = state.cards.find((c) => c.id === targetId);
  const unit = state.unitDefinitions?.find(
    (d) => d.id === unitCard?.definitionId,
  );
  if (!unit) return cost;
  const power = { ...cost.power };
  for (const [color, n] of Object.entries(unit.cost.power))
    power[color] = (power[color] ?? 0) + (n ?? 0);
  return {
    ...cost,
    power,
    ...(unit.cost.genericPower
      ? { genericPower: (cost.genericPower ?? 0) + unit.cost.genericPower }
      : {}),
  };
}
