import type { GameEvent, GameState, ActionResult } from '../types.js';
import { summonToken } from './summon-token.js';

/** Destination figée au mouvement : la capacité existe même si sa source quitte le terrain. */
export interface MovementEntry {
  kind: 'movement';
  sourceId: string;
  ownerId: string;
  destinationId: string;
  effect: { type: 'summon-here'; definitionId: string };
}
/** Mouvements réellement émis -> capacités au-dessus de la pile restante, sans résolution immédiate.
 * La mise en jeu et les sorties du terrain ne sont pas des mouvements. Ordre déterministe du journal. */
export function queueMovementEffects(
  before: GameState,
  state: GameState,
  events: readonly GameEvent[],
): Extract<ActionResult, { ok: true }> {
  const entries: MovementEntry[] = [];
  for (const event of events) {
    if (
      event.type !== 'unit-moved' &&
      event.type !== 'unit-retreated' &&
      event.type !== 'unit-recalled'
    )
      continue;
    const unit =
      before.units.find((u) => u.id === event.unitId) ??
      state.units.find((u) => u.id === event.unitId);
    const destinationId = event.type === 'unit-moved' ? event.to : event.zoneId;
    if (!unit || unit.zoneId === destinationId) continue;
    const definition = state.unitDefinitions?.find(
      (d) => d.id === unit.definitionId,
    );
    if (
      definition?.onMoveSummonHere &&
      state.battlefields.some((f) => f.zoneId === destinationId)
    )
      entries.push({
        kind: 'movement',
        sourceId: unit.id,
        ownerId: unit.ownerId,
        destinationId,
        effect: {
          type: 'summon-here',
          definitionId: definition.onMoveSummonHere,
        },
      });
  }
  if (!entries.length || state.result) return { ok: true, state, events: [] };
  return {
    ok: true,
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
      type: 'movement-effect-queued',
      sourceId: e.sourceId,
    })),
  };
}
/** Capacité de mouvement -> effet à la destination mémorisée ; aucune nouvelle mise en mouvement. */
export function resolveMovementEffect(
  state: GameState,
  entry: MovementEntry,
): Extract<ActionResult, { ok: true }> {
  const summoned = summonToken(
    state,
    entry.ownerId,
    entry.destinationId,
    entry.effect.definitionId,
    'here',
  );
  const next =
    summoned.events.length &&
    state.showdown?.battlefieldId !== entry.destinationId
      ? {
          ...summoned.state,
          pendingShowdowns: [
            ...(summoned.state.pendingShowdowns ?? []),
            { battlefieldId: entry.destinationId, initiatorId: entry.ownerId },
          ],
        }
      : summoned.state;
  return {
    ...summoned,
    state: next,
    events: [
      ...summoned.events,
      { type: 'movement-effect-resolved', sourceId: entry.sourceId },
    ],
  };
}
