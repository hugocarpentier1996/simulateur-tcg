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
  if (
    entry.battlefieldCondition &&
    (!state.battlefields.some(
      (f) => f.zoneId === entry.battlefieldCondition!.battlefieldId,
    ) ||
      state.units.filter(
        (u) =>
          u.ownerId === entry.ownerId &&
          u.zoneId === entry.battlefieldCondition!.battlefieldId,
      ).length < entry.battlefieldCondition.minimumUnits)
  )
    return {
      ok: true,
      state,
      events: [{ type: 'legend-effect-resolved', sourceId: entry.sourceId }],
    };
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
