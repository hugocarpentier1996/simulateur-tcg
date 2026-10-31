import { summonHere } from './summon-here.js';
import { startVision } from './vision.js';
import { resolveFlash } from './flash.js';
import { drawCardForPlayer } from '../turn/draw.js';
import type { ActionResult, GameState, UnitBlueprint } from '../types.js';
import { channelForPlayer } from '../turn/supplies.js';
import { resolveTargetedPlay } from './targeted-play.js';
/** Effet imprimé copié à l'empilement ; les réactions précèdent sa résolution. */
export interface PlayEffectEntry {
  kind: 'play-effect';
  sourceId: string;
  ownerId: string;
  effect:
    | { type: 'summon-here'; destinationId: string; definitionId: string }
    | { type: 'vision' }
    | NonNullable<UnitBlueprint['onPlayEffect']>
    | { type: 'ready-other'; targetId?: string }
    | {
        type: 'targeted';
        targetId?: string;
        effect: NonNullable<UnitBlueprint['onPlayTargetEffect']>['effect'];
      }
    | { type: 'move-to-base'; targetId?: string };
}
/** Capacité de mise en jeu -> opération commune, indépendante de la survie de la source. */
export function resolvePlayEffect(
  state: GameState,
  entry: PlayEffectEntry,
): Extract<ActionResult, { ok: true }> {
  if (entry.effect.type === 'summon-here') {
    const summoned = summonHere(
      state,
      entry.sourceId,
      entry.ownerId,
      entry.effect.destinationId,
      entry.effect.definitionId,
    );
    return {
      ...summoned,
      events: [
        ...summoned.events,
        { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
      ],
    };
  }
  if (entry.effect.type === 'targeted') {
    const resolved = resolveTargetedPlay(
      state,
      entry.sourceId,
      entry.ownerId,
      entry.effect.targetId,
      entry.effect.effect,
    );
    return {
      ...resolved,
      events: [
        ...resolved.events,
        { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
      ],
    };
  }
  if (entry.effect.type === 'vision')
    return startVision(state, entry.ownerId, entry.sourceId);
  if (entry.effect.type === 'move-to-base') {
    const targetId = entry.effect.targetId;
    const unit = state.units.find(
      (u) =>
        u.id === targetId &&
        state.battlefields.some((f) => f.zoneId === u.zoneId),
    );
    const moved = unit
      ? resolveFlash(state, unit.ownerId, [unit.id])
      : { ok: true as const, state, events: [] };
    return {
      ...moved,
      events: [
        ...moved.events,
        { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
      ],
    };
  }
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
