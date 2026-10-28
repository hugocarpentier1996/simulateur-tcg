import type { GameState, ActionResult, GameEvent } from '../types.js';
import type { LegendEntry } from '../legend-types.js';
import { drawCardForPlayer } from '../turn/draw.js';
/** Déclenchement empilé -> pioches du propriétaire avec recyclage/pénalité habituels.
 * Stoppe à la victoire ; ne redéclenche pas une capacité de lancement. */
export function resolveLegendDraw(
  state: GameState,
  entry: LegendEntry,
): Extract<ActionResult, { ok: true }> {
  const events: GameEvent[] = [];
  for (let i = 0; i < entry.count && !state.result; i++) {
    const r = drawCardForPlayer(state, entry.ownerId);
    state = r.state;
    events.push(...r.events);
  }
  return {
    ok: true,
    state,
    events: [
      ...events,
      { type: 'legend-effect-resolved', sourceId: entry.sourceId },
    ],
  };
}
