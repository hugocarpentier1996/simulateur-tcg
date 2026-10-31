import type { ActionResult, GameAction, GameState } from '../types.js';
import { canUseTiming } from './timing.js';

/** Gear Ready du demandeur avec capacité ADD -> Tap et ressource dans la réserve flottante.
 * Fenêtre d'une Réaction (Main, priorité de pile ou de Showdown), sans pile ni Réaction.
 * Refuse gear absent, adverse, Tap ou sans capacité, et mauvaise fenêtre, sans mutation. */
export function activateGear(
  state: GameState,
  action: Extract<GameAction, { type: 'activate-gear' }>,
): ActionResult {
  const gear = state.gears?.find(
    (g) => g.id === action.gearId && g.ownerId === action.playerId,
  );
  if (!gear) return { ok: false, reason: 'INVALID_GEAR' };
  const ability = state.gearDefinitions?.find(
    (d) => d.id === gear.definitionId,
  )?.resourceAbility;
  if (!ability) return { ok: false, reason: 'NO_RESOURCE_ABILITY' };
  if (!gear.ready) return { ok: false, reason: 'GEAR_NOT_READY' };
  if (!canUseTiming(state, action.playerId, 'reaction'))
    return { ok: false, reason: 'ABILITY_WINDOW_CLOSED' };
  const previous = state.resources[action.playerId] ?? { energy: 0, power: {} };
  const energy = ability.energy ?? 0;
  const color = ability.power;
  return {
    ok: true,
    state: {
      ...state,
      gears: state.gears!.map((g) =>
        g.id === gear.id ? { ...g, ready: false } : g,
      ),
      resources: {
        ...state.resources,
        [action.playerId]: {
          ...previous,
          energy: previous.energy + energy,
          power: color
            ? { ...previous.power, [color]: (previous.power[color] ?? 0) + 1 }
            : previous.power,
        },
      },
    },
    events: [
      {
        type: 'gear-resource-added',
        playerId: action.playerId,
        gearId: gear.id,
        energy,
        power: color ?? null,
      },
    ],
  };
}
