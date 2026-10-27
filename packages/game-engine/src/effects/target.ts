import type { GameState, UnitState } from '../types.js';
import type { SpellBlueprint } from '../spell-types.js';

/** Cible secondaire du duel -> unité adverse encore présente, sans restriction de zone. */
export function duelEnemyTarget(
  state: GameState,
  casterId: string,
  targetId?: string,
): UnitState | undefined {
  return state.units.find((u) => u.id === targetId && u.ownerId !== casterId);
}

/** État + ciblage -> unité encore légale, ou undefined (pas de remboursement à la résolution). */
export function spellTarget(
  state: GameState,
  definition: SpellBlueprint,
  targetId: string,
  casterId?: string,
): UnitState | undefined {
  const unit = state.units.find((u) => u.id === targetId);
  if (
    definition.target.zone === 'battlefield' &&
    !state.zones.some((z) => z.id === unit?.zoneId && z.kind === 'battlefield')
  )
    return undefined;
  if (definition.target.allegiance === 'friendly' && unit?.ownerId !== casterId)
    return undefined;
  if (!unit || definition.target.combatRole === 'any') return unit;
  const combat = state.showdown;
  return combat?.kind === 'combat' &&
    unit.ownerId === combat.initiatorId &&
    unit.zoneId === combat.battlefieldId
    ? unit
    : undefined;
}

/** Déplacement par effet : champ de bataille ou base du propriétaire, jamais une zone de cartes. */
export function validDestination(
  state: GameState,
  unit: UnitState,
  destinationId?: string,
): boolean {
  return state.zones.some(
    (z) =>
      z.id === destinationId &&
      (z.kind === 'battlefield' ||
        (z.kind === 'base' && z.ownerId === unit.ownerId)),
  );
}
