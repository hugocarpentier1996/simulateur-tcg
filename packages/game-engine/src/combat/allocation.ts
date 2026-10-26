import type { DamageAllocation, UnitState, GameState } from '../types.js';
import { effectiveMight, isStunned } from '../effects/modifiers.js';

/** Unités du camp -> dégâts qu'il doit attribuer, même si elles mourront simultanément. */
export function combatPower(
  units: readonly UnitState[],
  state?: GameState,
): number {
  return units.reduce(
    (sum, unit) =>
      sum +
      (isStunned(unit) || unit.cannotDealDamage
        ? 0
        : effectiveMight(unit, state)),
    0,
  );
}

/** Unité vivante -> dégâts supplémentaires nécessaires pour la tuer ; Might 0 exige 1. */
export function lethalDamage(unit: UnitState, state?: GameState): number {
  return Math.max(
    0,
    Math.max(1, effectiveMight(unit, state)) - (unit.damage ?? 0),
  );
}

/** Dégâts disponibles + cibles + choix ordonné -> validité. Aucune mutation.
 * Tous les dégâts possibles sont assignés, sans gaspillage sur une cible déjà condamnée.
 * Une cible partiellement blessée doit être la dernière. Tank+Backline reste facultatif. */
export function validAllocation(
  power: number,
  targets: readonly UnitState[],
  allocations: readonly DamageAllocation[],
  state?: GameState,
): boolean {
  let remaining = power;
  const available = new Map(targets.map((unit) => [unit.id, unit]));
  for (let index = 0; index < allocations.length; index++) {
    const allocation = allocations[index]!;
    const target = available.get(allocation.targetId);
    if (
      !target ||
      !Number.isFinite(allocation.amount) ||
      allocation.amount <= 0 ||
      allocation.amount > remaining
    )
      return false;
    if (!canTarget(target, [...available.values()])) return false;
    const lethal = lethalDamage(target, state);
    if (allocation.amount !== Math.min(remaining, lethal)) return false;
    remaining -= allocation.amount;
    if (allocation.amount < lethal && index !== allocations.length - 1)
      return false;
    available.delete(target.id);
  }
  return remaining === 0 || available.size === 0;
}

/** Cible + adversaires encore prioritaires -> respect de Tank et Backline. */
function canTarget(
  target: UnitState,
  available: readonly UnitState[],
): boolean {
  if (target.tank) return true;
  if (available.some((unit) => unit.tank && !unit.backline)) return false;
  return !target.backline || !available.some((unit) => !unit.backline);
}
