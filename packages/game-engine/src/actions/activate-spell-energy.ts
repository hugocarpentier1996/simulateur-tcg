import type { ActionResult, GameAction, GameState } from '../types.js';
import { canUseTiming } from './timing.js';

/** Unité alliée Ready avec capacité ADD + fenêtre Réaction -> Tap et réserve immédiate.
 * Ne crée aucune pile et conserve la priorité. Refuse unité/capacité absente, Tap,
 * mauvais timing ; act bloque aussi setup, choix de morts et partie terminée.
 * La réserve ne paie que les sorts, expire aux frontières End/Draw. */
export function activateSpellEnergy(
  state: GameState,
  action: Extract<GameAction, { type: 'activate-spell-energy' }>,
): ActionResult {
  const unit = state.units.find(
    (u) => u.id === action.unitId && u.ownerId === action.playerId,
  );
  if (!unit) return { ok: false, reason: 'INVALID_UNIT' };
  const amount = state.unitDefinitions?.find(
    (d) => d.id === unit.definitionId,
  )?.spellEnergyAbility;
  if (!amount) return { ok: false, reason: 'NO_RESOURCE_ABILITY' };
  if (!unit.ready) return { ok: false, reason: 'UNIT_NOT_READY' };
  if (!canUseTiming(state, action.playerId, 'reaction'))
    return { ok: false, reason: 'ABILITY_WINDOW_CLOSED' };
  const previous = state.resources[action.playerId] ?? { energy: 0, power: {} };
  return {
    ok: true,
    state: {
      ...state,
      units: state.units.map((u) =>
        u.id === unit.id ? { ...u, ready: false } : u,
      ),
      resources: {
        ...state.resources,
        [action.playerId]: {
          ...previous,
          spellEnergy: (previous.spellEnergy ?? 0) + amount,
        },
      },
    },
    events: [
      {
        type: 'spell-energy-added',
        playerId: action.playerId,
        unitId: unit.id,
        amount,
      },
    ],
  };
}
