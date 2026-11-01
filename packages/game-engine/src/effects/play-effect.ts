import { killGears } from './kill-gear.js';
import { wardenAgainst } from './unit-aura.js';
import { summonToken } from './summon-token.js';
import { buffUnit, spendBuff } from './buff.js';
import { startDiscard } from './loot.js';
import { summonHere } from './summon-here.js';
import { startVision } from './vision.js';
import { resolveFlash } from './flash.js';
import { drawCardForPlayer } from '../turn/draw.js';
import type { ActionResult, GameState, UnitBlueprint } from '../types.js';
import { channelForPlayer } from '../turn/supplies.js';
import { resolveTargetedPlay } from './targeted-play.js';
import { effectiveMight } from './modifiers.js';
/** Effet imprimé copié à l'empilement ; les réactions précèdent sa résolution. */
export interface PlayEffectEntry {
  kind: 'play-effect';
  sourceId: string;
  ownerId: string;
  effect:
    | { type: 'summon-here'; destinationId: string; definitionId: string }
    /** Dépense le buff d'une unité alliée (s'il y en a) pour piocher 1. */
    | { type: 'spend-buff-draw' }
    /** Recycle une rune en jeu du propriétaire sous sa pile de runes (Tap d'abord). */
    | { type: 'recycle-rune' }
    /** Jeton dans la base indiquée, sans exiger que la source soit une unité en jeu. */
    | { type: 'summon-base'; destinationId: string; definitionId: string }
    | { type: 'vision' }
    /** Détruit le gear indiqué (capacité kill-self). */
    | { type: 'kill-gear'; gearId: string }
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
  if (entry.effect.type === 'spend-buff-draw') {
    const buffed = state.units.find(
      (u) => u.ownerId === entry.ownerId && u.buffed,
    );
    const spent = buffed ? spendBuff(state, buffed.id) : null;
    if (!spent)
      return {
        ok: true,
        state,
        events: [
          { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
        ],
      };
    const drawn = drawCardForPlayer(spent, entry.ownerId);
    return {
      ...drawn,
      events: [
        ...drawn.events,
        { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
      ],
    };
  }
  if (entry.effect.type === 'recycle-rune') {
    const runes = state.zones.find(
      (z) => z.kind === 'runes' && z.ownerId === entry.ownerId,
    );
    const pile = state.zones.find(
      (z) => z.kind === 'rune-pile' && z.ownerId === entry.ownerId,
    );
    const rune = [...state.cards]
      .filter((c) => c.zoneId === runes?.id)
      .sort((x, y) => Number(x.ready !== false) - Number(y.ready !== false))[0];
    return {
      ok: true,
      state:
        rune && pile
          ? {
              ...state,
              cards: [
                ...state.cards.filter((c) => c.id !== rune.id),
                { ...rune, zoneId: pile.id, ready: false },
              ],
            }
          : state,
      events: [{ type: 'unit-play-effect-resolved', sourceId: entry.sourceId }],
    };
  }
  if (entry.effect.type === 'kill-gear') {
    const killed = killGears(state, [entry.effect.gearId]);
    return {
      ok: true,
      state: killed.state,
      events: [
        ...killed.events,
        { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
      ],
    };
  }
  if (entry.effect.type === 'summon-base') {
    const summoned = summonToken(
      state,
      entry.ownerId,
      entry.effect.destinationId,
      entry.effect.definitionId,
      'here',
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
          u.id === targetId &&
          u.id !== entry.sourceId &&
          !(u.ownerId !== entry.ownerId && wardenAgainst(state, u.ownerId))
            ? { ...u, ready: true }
            : u,
        ),
      },
      events: [{ type: 'unit-play-effect-resolved', sourceId: entry.sourceId }],
    };
  }
  if (entry.effect.type === 'buff-self') {
    const tag = entry.effect.ifControlTag;
    if (
      tag &&
      !state.units.some(
        (u) =>
          u.ownerId === entry.ownerId &&
          state.unitDefinitions
            ?.find((d) => d.id === u.definitionId)
            ?.tags?.includes(tag),
      )
    )
      return {
        ok: true,
        state,
        events: [
          { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
        ],
      };
    let next = buffUnit(state, entry.sourceId);
    const drawEvents: Extract<ActionResult, { ok: true }>['events'] = [];
    for (let i = 0; i < (entry.effect.draw ?? 0) && !next.result; i++) {
      const drawn = drawCardForPlayer(next, entry.ownerId);
      next = drawn.state;
      drawEvents.push(...drawn.events);
    }
    const source = next.units.find((u) => u.id === entry.sourceId);
    if (
      entry.effect.alliesHere &&
      source &&
      next.battlefields.some((f) => f.zoneId === source.zoneId)
    )
      for (const ally of next.units.filter(
        (u) =>
          u.id !== source.id &&
          u.ownerId === source.ownerId &&
          u.zoneId === source.zoneId,
      ))
        next = buffUnit(next, ally.id);
    return {
      ok: true,
      state: next,
      events: [
        ...drawEvents,
        { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
      ],
    };
  }
  if (entry.effect.type === 'next-spell-discount') {
    return {
      ok: true,
      state: {
        ...state,
        nextSpellDiscount: {
          ...state.nextSpellDiscount,
          [entry.ownerId]:
            (state.nextSpellDiscount?.[entry.ownerId] ?? 0) +
            entry.effect.energy,
        },
      },
      events: [{ type: 'unit-play-effect-resolved', sourceId: entry.sourceId }],
    };
  }
  if (entry.effect.type === 'lock-opponents') {
    const locked = state.players
      .map((p) => p.id)
      .filter((id) => id !== entry.ownerId);
    return {
      ok: true,
      state: {
        ...state,
        playLockedPlayers: [
          ...new Set([...(state.playLockedPlayers ?? []), ...locked]),
        ],
      },
      events: [{ type: 'unit-play-effect-resolved', sourceId: entry.sourceId }],
    };
  }
  if (entry.effect.type === 'draw-per-mighty') {
    const count = state.units.filter(
      (u) => u.ownerId === entry.ownerId && effectiveMight(u, state) >= 5,
    ).length;
    const events: Extract<ActionResult, { ok: true }>['events'] = [];
    for (let i = 0; i < count && !state.result; i++) {
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
  if (entry.effect.type === 'discard') {
    const started = startDiscard(
      state,
      entry.ownerId,
      entry.sourceId,
      entry.effect.count,
      entry.effect.draw ?? 0,
    );
    return {
      ...started,
      events: [
        ...started.events,
        { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
      ],
    };
  }
  if (entry.effect.type === 'weaken-enemies') {
    const { amount, minimum } = entry.effect;
    return {
      ok: true,
      state: {
        ...state,
        units: state.units.map((u) =>
          u.ownerId === entry.ownerId
            ? u
            : {
                ...u,
                temporaryEffects: [
                  ...(u.temporaryEffects ?? []),
                  {
                    type: 'modify-might' as const,
                    amount:
                      minimum === undefined
                        ? amount
                        : Math.max(
                            amount,
                            Math.min(0, minimum - effectiveMight(u, state)),
                          ),
                  },
                ],
              },
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
