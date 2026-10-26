import type {
  GameState,
  GameAction,
  GameEvent,
  ActionResult,
} from '../types.js';
import { resolveOpenShowdown } from '../showdown/resolve-open.js';

/**
 * Entrée : état cohérent et passe demandée par un joueur connu.
 * Sortie : refus sans priorité, passage au suivant, clôture de l'Open Showdown,
 * ou ouverture des choix de dégâts du Combat Showdown après deux passes.
 * Les événements commencent par la passe, puis les conséquences de la clôture.
 */
export function passPriority(
  state: GameState,
  action: Extract<GameAction, { type: 'pass' }>,
): ActionResult {
  const showdown = state.showdown;
  if (showdown?.kind === 'combat' && showdown.stage === 'effects')
    return { ok: false, reason: 'DEATH_EFFECTS_IN_PROGRESS' };
  if (showdown?.kind === 'combat' && showdown.stage === 'damage')
    return { ok: false, reason: 'DAMAGE_ASSIGNMENT_REQUIRED' };
  if (!showdown || showdown.priorityPlayerId !== action.playerId)
    return { ok: false, reason: 'NO_PRIORITY' };
  const events: GameEvent[] = [
    { type: 'priority-passed', playerId: action.playerId },
  ];
  const passes = showdown.consecutivePasses + 1;
  if (passes < showdown.participants.length) {
    const nextIndex =
      (showdown.participants.indexOf(action.playerId) + 1) %
      showdown.participants.length;
    const nextPlayerId = showdown.participants[nextIndex];
    if (!nextPlayerId) return { ok: false, reason: 'INVALID_PARTICIPANTS' };
    return {
      ok: true,
      state: {
        ...state,
        showdown: {
          ...showdown,
          consecutivePasses: passes,
          priorityPlayerId: nextPlayerId,
        },
      },
      events,
    };
  }

  if (showdown.kind === 'combat') {
    return {
      ok: true,
      state: {
        ...state,
        showdown: { ...showdown, stage: 'damage', consecutivePasses: passes },
      },
      events: [
        ...events,
        { type: 'combat-damage-window', battlefieldId: showdown.battlefieldId },
      ],
    };
  }
  const resolution = resolveOpenShowdown(state, showdown);
  return { ...resolution, events: [...events, ...resolution.events] };
}
