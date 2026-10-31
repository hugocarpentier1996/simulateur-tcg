import type { GameState, GameEvent } from '../types.js';
import type { LegendEntry } from '../legend-types.js';
import { activeLegends } from './legends.js';
/** Événements de cette action -> capacités de conquête (légendes et unités), après clôture et score.
 * Vérifie le seuil à la conquête ; la résolution le vérifiera à nouveau. Victoire : aucun ajout.
 * Appelé une seule fois par act, pas lors d'une tenue ni d'un simple mouvement. */
export function queueConquestLegends(
  state: GameState,
  events: readonly GameEvent[],
): { state: GameState; events: GameEvent[] } {
  if (state.result) return { state, events: [] };
  const entries: LegendEntry[] = events.flatMap((e) =>
    e.type === 'battlefield-conquered'
      ? activeLegends(state, e.playerId).flatMap(({ card, definition }) =>
          definition.conquestDraw &&
          state.units.filter(
            (u) => u.ownerId === e.playerId && u.zoneId === e.battlefieldId,
          ).length >= definition.conquestDraw.minimumUnits
            ? [
                {
                  kind: 'legend-draw' as const,
                  sourceId: card.id,
                  ownerId: e.playerId,
                  count: definition.conquestDraw.count,
                  battlefieldCondition: {
                    battlefieldId: e.battlefieldId,
                    minimumUnits: definition.conquestDraw.minimumUnits,
                  },
                },
              ]
            : [],
        )
      : [],
  );
  // Capacités « When I conquer » des unités du conquérant présentes sur le champ conquis.
  for (const e of events)
    if (e.type === 'battlefield-conquered')
      for (const u of state.units) {
        const count = state.unitDefinitions?.find(
          (d) => d.id === u.definitionId,
        )?.onConquerDraw;
        if (count && u.ownerId === e.playerId && u.zoneId === e.battlefieldId)
          entries.push({
            kind: 'legend-draw',
            sourceId: u.id,
            ownerId: e.playerId,
            count,
          });
      }
  if (!entries.length) return { state, events: [] };
  return {
    state: {
      ...state,
      stack: {
        entries: [...(state.stack?.entries ?? []), ...entries],
        initiatorId: state.stack?.initiatorId ?? entries[0]!.ownerId,
        priorityPlayerId: state.showdown?.initiatorId ?? state.activePlayerId,
        consecutivePasses: 0,
      },
    },
    events: entries.map((e) => ({
      type: 'legend-effect-queued',
      sourceId: e.sourceId,
    })),
  };
}
