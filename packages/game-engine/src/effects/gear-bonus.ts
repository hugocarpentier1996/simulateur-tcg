import type { GameState, UnitState } from '../types.js';

/** Unité + état -> somme des effets continus des gears alliés en jeu.
 * Alliés = même propriétaire dans le prototype 1v1. Aucune écriture sur la Might de base.
 * Un équipement ne donne son bonus ciblé qu'à son porteur ; une aura couvre toutes les zones. */
export function gearMightBonus(unit: UnitState, state: GameState): number {
  let bonus = 0;
  for (const gear of state.gears ?? []) {
    if (gear.ownerId !== unit.ownerId) continue;
    const definition = state.gearDefinitions?.find(
      (d) => d.id === gear.definitionId,
    );
    for (const effect of definition?.effects ?? []) {
      if (effect.scope === 'allied-units' || gear.attachedUnitId === unit.id)
        bonus += effect.amount;
    }
  }
  return bonus;
}
