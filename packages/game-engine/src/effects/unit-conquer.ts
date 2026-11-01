import type { GameState } from '../types.js';
import type { LegendEntry } from '../legend-types.js';
import type { ModeChoiceEntry } from './mode-choice.js';

/** Conquérant + champ -> capacités « When I conquer » de ses unités présentes : pioche
 * (onConquerDraw) puis choix de mode (onConquerChoice), dans l'ordre des unités. Aussi
 * utilisé par Reckoner's Arena à la tenue. */
export function unitConquerEntries(
  state: GameState,
  playerId: string,
  battlefieldId: string,
): (LegendEntry | ModeChoiceEntry)[] {
  return state.units.flatMap((u) => {
    if (u.ownerId !== playerId || u.zoneId !== battlefieldId) return [];
    const definition = state.unitDefinitions?.find(
      (d) => d.id === u.definitionId,
    );
    const entries: (LegendEntry | ModeChoiceEntry)[] = [];
    if (definition?.onConquerDraw)
      entries.push({
        kind: 'legend-draw',
        sourceId: u.id,
        ownerId: playerId,
        count: definition.onConquerDraw,
      });
    if (definition?.onConquerChoice?.length)
      entries.push({
        kind: 'mode-choice',
        sourceId: u.id,
        ownerId: playerId,
        modes: definition.onConquerChoice,
      });
    return entries;
  });
}
