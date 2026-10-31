import { effectiveMight } from './modifiers.js';
import type { GameState, UnitState } from '../types.js';
import type { SpellBlueprint, SpellEntry } from '../spell-types.js';

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
  if (definition.target.kind !== 'unit') return undefined;
  const unit = state.units.find((u) => u.id === targetId);
  if (
    definition.target.zone === 'battlefield' &&
    !state.zones.some((z) => z.id === unit?.zoneId && z.kind === 'battlefield')
  )
    return undefined;
  if (definition.target.allegiance === 'friendly' && unit?.ownerId !== casterId)
    return undefined;
  if (definition.target.allegiance === 'enemy' && unit?.ownerId === casterId)
    return undefined;
  if (
    unit &&
    definition.target.maximumMight !== undefined &&
    effectiveMight(unit, state) > definition.target.maximumMight
  )
    return undefined;
  if (!unit || definition.target.combatRole === 'any') return unit;
  const combat = state.showdown;
  return combat?.kind === 'combat' &&
    unit.ownerId === combat.initiatorId &&
    unit.zoneId === combat.battlefieldId
    ? unit
    : undefined;
}

/** ID ciblé -> champ de bataille encore présent dans l'état de partie. */
export function validBattlefieldTarget(
  state: GameState,
  targetId: string,
): boolean {
  return (
    state.battlefields.some((f) => f.zoneId === targetId) &&
    state.zones.some((z) => z.id === targetId && z.kind === 'battlefield')
  );
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

/** Seconde cible ennemie d'un sort (duel ou frappe) -> unité adverse encore valide, avec la
 * restriction de zone de la frappe le cas échéant. */
export function secondaryEnemyTarget(
  state: GameState,
  definition: SpellBlueprint,
  casterId: string,
  targetId?: string,
): UnitState | undefined {
  const unit = duelEnemyTarget(state, casterId, targetId);
  const strike = definition.effects.find((e) => e.type === 'strike');
  if (
    unit &&
    strike?.type === 'strike' &&
    strike.enemyZone === 'battlefield' &&
    !state.battlefields.some((f) => f.zoneId === unit.zoneId)
  )
    return undefined;
  return unit;
}

/** Sort ciblable par un contre -> entrée de pile d'un sort dont le coût respecte les plafonds. */
export function stackSpellTarget(
  state: GameState,
  definition: SpellBlueprint,
  targetId: string | undefined,
): SpellEntry | undefined {
  const limits = definition.target;
  if (limits.kind !== 'stack-spell') return undefined;
  for (const entry of state.stack?.entries ?? []) {
    if (!('card' in entry) || entry.card.id !== targetId) continue;
    const cost = entry.definition.cost;
    const power =
      Object.values(cost.power).reduce((sum, n) => sum + (n ?? 0), 0) +
      (cost.genericPower ?? 0);
    if (limits.maxEnergy !== undefined && cost.energy > limits.maxEnergy)
      return undefined;
    if (limits.maxPower !== undefined && power > limits.maxPower)
      return undefined;
    return entry;
  }
  return undefined;
}
