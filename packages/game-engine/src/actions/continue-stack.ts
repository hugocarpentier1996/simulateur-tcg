import type { GameState, GameEvent, ActionResult } from '../types.js';
import { finishCombat } from '../combat/finish.js';
/** Pile après retrait du sommet -> pause pour choix, nouvelle fenêtre ou clôture.
 * Conserve les entrées restantes ; aucun effet supplémentaire n'est résolu ici. */
export function continueStack(
  state: GameState,
  events: GameEvent[],
): Extract<ActionResult, { ok: true }> {
  const next = state;
  const stack = state.stack;
  if (!stack) throw new Error('Pile absente à la reprise.');
  const entries = stack.entries;
  if (next.pendingDeaths || next.pendingDiscard || next.pendingVision)
    return {
      ok: true,
      state: {
        ...next,
        stack: {
          ...stack,
          entries,
          consecutivePasses: 0,
          priorityPlayerId: next.showdown?.initiatorId ?? next.activePlayerId,
        },
      },
      events: events,
    };
  if (!entries.length && next.combatAftermath && !next.result) {
    const finished = finishCombat({ ...next, stack: null });
    return {
      ...finished,
      events: [...events, ...finished.events],
    };
  }
  const priorityPlayerId = state.players.find(
    (p) => p.id !== stack.initiatorId,
  )!.id;
  return {
    ok: true,
    state: {
      ...next,
      stack: entries.length
        ? {
            ...stack,
            entries,
            consecutivePasses: 0,
            priorityPlayerId: next.showdown?.initiatorId ?? next.activePlayerId,
          }
        : null,
      ...(!entries.length
        ? next.showdown
          ? {
              showdown: {
                ...next.showdown,
                priorityPlayerId,
                consecutivePasses: 0,
              },
            }
          : { priorityPlayerId }
        : {}),
    },
    events: events,
  };
}
