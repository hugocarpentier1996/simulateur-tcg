import type { ActionResult, GameAction, GameState } from '../types.js';
import { payCost } from '../cost/payment.js';

/** Main active hors Showdown + équipement libre et unité alliée -> coût payé, attachement.
 * Conserve Ready/Tap du gear et de l'unité ; aucune exigence de Ready ou de zone commune.
 * Refuse tout rééquipement tant qu'un porteur est attaché, même vers le même porteur.
 * Effet immédiat dans cette tranche, sans capacités déclenchées ni règles de détachement volontaire. */
export function equipGear(
  state: GameState,
  action: Extract<GameAction, { type: 'equip-gear' }>,
): ActionResult {
  if (
    state.phase !== 'main' ||
    state.activePlayerId !== action.playerId ||
    state.showdown
  )
    return { ok: false, reason: 'PLAY_WINDOW_CLOSED' };
  const gear = state.gears?.find(
    (g) => g.id === action.gearId && g.ownerId === action.playerId,
  );
  if (!gear) return { ok: false, reason: 'INVALID_GEAR' };
  if (gear.attachedUnitId !== undefined)
    return { ok: false, reason: 'GEAR_ALREADY_ATTACHED' };
  const definition = state.gearDefinitions?.find(
    (d) => d.id === gear.definitionId,
  );
  if (!definition?.equipCost) return { ok: false, reason: 'NOT_EQUIPMENT' };
  const unit = state.units.find(
    (u) => u.id === action.unitId && u.ownerId === action.playerId,
  );
  if (!unit) return { ok: false, reason: 'INVALID_UNIT' };
  const paid = payCost(
    state,
    action.playerId,
    definition.equipCost,
    action.payment,
  );
  if (!paid.ok) return paid;
  return {
    ok: true,
    state: {
      ...paid.state,
      gears: state.gears!.map((g) =>
        g.id === gear.id
          ? { ...g, attachedUnitId: unit.id, zoneId: unit.zoneId }
          : g,
      ),
    },
    events: [
      {
        type: 'cost-paid',
        playerId: action.playerId,
        cardId: gear.id,
        ...definition.equipCost,
      },
      {
        type: 'gear-equipped',
        playerId: action.playerId,
        gearId: gear.id,
        unitId: unit.id,
      },
    ],
  };
}
