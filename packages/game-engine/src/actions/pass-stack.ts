import type { ActionResult, GameState } from '../types.js';
import { resolveSpell } from '../effects/resolve-spell.js';

/** Passe en closed state -> priorité suivante ou résolution du sommet après deux passes.
 * Rouvre une fenêtre pour le sommet restant ; chaîne vide : priorité à l'autre lanceur. */
export function passStack(state: GameState, playerId: string): ActionResult {
  const stack = state.stack;
  if (!stack || stack.priorityPlayerId !== playerId)
    return { ok: false, reason: 'NO_PRIORITY' };
  const other = state.players.find((p) => p.id !== playerId)!;
  const event = { type: 'priority-passed' as const, playerId };
  if (stack.consecutivePasses + 1 < state.players.length)
    return {
      ok: true,
      state: {
        ...state,
        stack: {
          ...stack,
          consecutivePasses: stack.consecutivePasses + 1,
          priorityPlayerId: other.id,
        },
      },
      events: [event],
    };
  const entry = stack.entries.at(-1)!;
  const entries = stack.entries.slice(0, -1);
  const resolved = resolveSpell(
    { ...state, stack: { ...stack, entries } },
    entry,
  );
  const next = resolved.state;
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
    events: [event, ...resolved.events],
  };
}
