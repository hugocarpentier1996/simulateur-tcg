import { drawCardForPlayer } from '../turn/draw.js';
import type { ActionResult, GameState, UnitBlueprint } from '../types.js';
import { channelForPlayer } from '../turn/supplies.js';
/** Effet imprimé copié à l'empilement ; les réactions précèdent sa résolution. */
export interface PlayEffectEntry {
  kind: 'play-effect';
  sourceId: string;
  ownerId: string;
  effect:
    | NonNullable<UnitBlueprint['onPlayEffect']>
    | { type: 'ready-other'; targetId?: string };
}
/** Capacité de mise en jeu -> opération commune, indépendante de la survie de la source. */
export function resolvePlayEffect(
  state: GameState,
  entry: PlayEffectEntry,
): Extract<ActionResult, { ok: true }> {
  if (entry.effect.type === 'ready-other') {
    const targetId = entry.effect.targetId;
    return {
      ok: true,
      state: {
        ...state,
        units: state.units.map((u) =>
          u.id === targetId && u.id !== entry.sourceId
            ? { ...u, ready: true }
            : u,
        ),
      },
      events: [{ type: 'unit-play-effect-resolved', sourceId: entry.sourceId }],
    };
  }
  if (entry.effect.type === 'draw') {
    const events: Extract<ActionResult, { ok: true }>['events'] = [];
    for (let i = 0; i < entry.effect.count && !state.result; i++) {
      const drawn = drawCardForPlayer(state, entry.ownerId);
      state = drawn.state;
      events.push(...drawn.events);
    }
    return {
      ok: true,
      state,
      events: [
        ...events,
        { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
      ],
    };
  }
  const resolved = channelForPlayer(state, entry.ownerId, entry.effect.count);
  return {
    ...resolved,
    events: [
      ...resolved.events,
      { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
    ],
  };
}
