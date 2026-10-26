import type { ActionResult, GameAction, GameState } from '../types.js';
import { combatPower, validAllocation } from '../combat/allocation.js';
import { resolveCombat } from '../combat/resolve.js';

/** Fenêtre de dégâts + répartition du joueur -> choix enregistré ou refus.
 * Chaque camp soumet une fois ; aucun dégât n'est appliqué avant les deux choix.
 * Les choix du premier camp sont internes au serveur, pas destinés à l'adversaire. */
export function assignDamage(
  state: GameState,
  action: Extract<GameAction, { type: 'assign-damage' }>,
): ActionResult {
  const combat = state.showdown;
  if (!combat || combat.kind !== 'combat' || combat.stage !== 'damage')
    return { ok: false, reason: 'NO_DAMAGE_WINDOW' };
  if (
    !combat.participants.includes(action.playerId) ||
    combat.assignments[action.playerId]
  )
    return { ok: false, reason: 'DAMAGE_ALREADY_ASSIGNED' };
  const present = state.units.filter(
    (unit) => unit.zoneId === combat.battlefieldId,
  );
  const sources = present.filter((unit) => unit.ownerId === action.playerId);
  const targets = present.filter((unit) => unit.ownerId !== action.playerId);
  if (
    !validAllocation(
      combatPower(sources, state),
      targets,
      action.allocations,
      state,
    )
  )
    return { ok: false, reason: 'INVALID_DAMAGE_ALLOCATION' };
  const nextCombat = {
    ...combat,
    assignments: {
      ...combat.assignments,
      [action.playerId]: action.allocations.map((a) => ({ ...a })),
    },
  };
  const next = { ...state, showdown: nextCombat };
  const events = [
    { type: 'damage-assigned' as const, playerId: action.playerId },
  ];
  if (!combat.participants.every((id) => nextCombat.assignments[id]))
    return { ok: true, state: next, events };
  const result = resolveCombat(next, nextCombat);
  return { ...result, events: [...events, ...result.events] };
}
