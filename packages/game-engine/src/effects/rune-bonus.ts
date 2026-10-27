import type { GameState, UnitState } from '../types.js';

/** Unité + catalogue/plateau -> bonus de Might statique, sans pile ni mutation.
 * Compte uniquement les runes en jeu de son propriétaire, Ready ou Tap ; exclut
 * le deck de runes. Recalculé après tout paiement, sans mémoriser un ancien seuil. */
export function runeMightBonus(unit: UnitState, state: GameState): number {
  const bonus = state.unitDefinitions?.find(
    (d) => d.id === unit.definitionId,
  )?.runeMightBonus;
  if (!bonus) return 0;
  const zones = new Set(
    state.zones
      .filter((z) => z.kind === 'runes' && z.ownerId === unit.ownerId)
      .map((z) => z.id),
  );
  const count = state.cards.filter(
    (c) => c.ownerId === unit.ownerId && zones.has(c.zoneId),
  ).length;
  return count >= bonus.minimum ? bonus.amount : 0;
}
