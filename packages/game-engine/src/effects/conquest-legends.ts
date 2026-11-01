import type { PlayEffectEntry } from './play-effect.js';
import type { MovementEntry } from './movement-triggers.js';
import { battlefieldDefinition } from './battlefield.js';
import type { GameState, GameEvent } from '../types.js';
import type { LegendEntry } from '../legend-types.js';
import { activeLegends } from './legends.js';
import { unitConquerEntries } from './unit-conquer.js';
import type { ModeChoiceEntry } from './mode-choice.js';
/** Événements de cette action -> capacités de conquête (légendes et unités), après clôture et score.
 * Vérifie le seuil à la conquête ; la résolution le vérifiera à nouveau. Victoire : aucun ajout.
 * Appelé une seule fois par act, pas lors d'une tenue ni d'un simple mouvement. */
export function queueConquestLegends(
  input: GameState,
  events: readonly GameEvent[],
): { state: GameState; events: GameEvent[] } {
  let state = input;
  if (state.result) return { state, events: [] };
  // Targon's Peak : redressement de runes différé à la fin du tour.
  for (const e of events)
    if (e.type === 'battlefield-conquered') {
      const runes = battlefieldDefinition(
        state,
        e.battlefieldId,
      )?.conquerEndTurnReadyRunes;
      if (runes)
        state = {
          ...state,
          endTurnReadyRunes: {
            ...state.endTurnReadyRunes,
            [e.playerId]: (state.endTurnReadyRunes?.[e.playerId] ?? 0) + runes,
          },
        };
    }
  const entries: (
    LegendEntry | MovementEntry | PlayEffectEntry | ModeChoiceEntry
  )[] = events.flatMap((e) =>
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
      entries.push(...unitConquerEntries(state, e.playerId, e.battlefieldId));
  // Monastery of Hirana : dépense d'un buff du conquérant pour piocher.
  for (const e of events)
    if (
      e.type === 'battlefield-conquered' &&
      battlefieldDefinition(state, e.battlefieldId)?.conquerSpendBuffDraw &&
      state.units.some((u) => u.ownerId === e.playerId && u.buffed)
    )
      entries.push({
        kind: 'play-effect',
        sourceId: e.battlefieldId,
        ownerId: e.playerId,
        effect: { type: 'spend-buff-draw' },
      });
  // Sigil of the Storm : recyclage d'une rune du conquérant.
  for (const e of events)
    if (
      e.type === 'battlefield-conquered' &&
      battlefieldDefinition(state, e.battlefieldId)?.conquerRecycleRune
    )
      entries.push({
        kind: 'play-effect',
        sourceId: e.battlefieldId,
        ownerId: e.playerId,
        effect: { type: 'recycle-rune' },
      });
  // Champs « When you conquer here » (Zaun Warrens : loot du conquérant).
  for (const e of events)
    if (
      e.type === 'battlefield-conquered' &&
      battlefieldDefinition(state, e.battlefieldId)?.conquerLoot
    )
      entries.push({
        kind: 'movement',
        sourceId: e.battlefieldId,
        ownerId: e.playerId,
        destinationId: e.battlefieldId,
        effect: { type: 'loot' },
      });
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
