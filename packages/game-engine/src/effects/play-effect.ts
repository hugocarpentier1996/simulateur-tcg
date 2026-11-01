import { settleLethalUnits } from './lethal-units.js';
import { moveUnit } from './resolve-spell.js';
import { leaveBoard } from './leave-board.js';
import { playUnitFromTrash } from './play-from-trash.js';
import {
  lookPlayUnitChoice,
  opponentHandChoice,
  trashRecycleChoice,
} from './mode-choice.js';
import { killGears } from './kill-gear.js';
import { wardenAgainst } from './unit-aura.js';
import { summonToken } from './summon-token.js';
import { buffUnit, spendBuff } from './buff.js';
import { startDiscard } from './loot.js';
import { summonHere } from './summon-here.js';
import { startVision } from './vision.js';
import { resolveFlash } from './flash.js';
import { drawCardForPlayer } from '../turn/draw.js';
import type {
  GameEvent,
  ActionResult,
  GameState,
  UnitBlueprint,
} from '../types.js';
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
    /** Dépense le buff de chaque unité indiquée qui en a encore un, puis canalise
     * autant de runes Tap (Albus Ferros). */
    | { type: 'spend-buffs-channel'; unitIds: readonly string[] }
    /** La prochaine unité jouée ce tour par le propriétaire arrive Ready (Legion vérifié). */
    | { type: 'next-unit-ready'; legion?: boolean }
    /** Protection de rappel payante jusqu'à la fin du tour (Unlicensed Armory). */
    | { type: 'grant-paid-recall'; targetId: string; power: string }
    /** Dazzling Aurora : révèle jusqu'à une unité, la joue gratuitement, recycle le reste. */
    | { type: 'reveal-play-unit' }
    /** Baited Hook : tue l'unité puis propose une unité gratuite du dessus du deck. */
    | { type: 'hook'; targetId: string; count: number }
    /** Renvoie en main l'unité, le gear ou la carte cachée indiqué (Pack of Wonders). */
    | { type: 'bounce'; targetId: string }
    /** Recycle jusqu'à count cartes des cimetières, choisies une à une (choix de mode). */
    | { type: 'recycle-trashes'; count: number }
    /** Le prochain sort du propriétaire ce tour gagne des dégâts bonus. */
    | { type: 'next-spell-bonus-damage'; amount: number }
    /** Joue l'unité indiquée du cimetière du propriétaire dans sa base. */
    | { type: 'play-from-trash'; cardId: string }
    /** Buffe chacune des unités indiquées encore en jeu (Kinkou Monk). */
    | { type: 'buff-units'; unitIds: readonly string[] }
    /** Détruit le gear indiqué (capacité kill-self). */
    | { type: 'kill-gear'; gearId: string }
    | NonNullable<UnitBlueprint['onPlayEffect']>
    | { type: 'ready-other'; targetId?: string }
    | {
        type: 'targeted';
        targetId?: string;
        effect: NonNullable<UnitBlueprint['onPlayTargetEffect']>['effect'];
      }
    | { type: 'move-to-base'; targetId?: string }
    /** Déplace l'unité indiquée de sa base vers un champ (Unforgiven). */
    | { type: 'move-to-field'; targetId: string; destinationId: string };
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
  if (entry.effect.type === 'next-spell-bonus-damage') {
    return {
      ok: true,
      state: {
        ...state,
        nextSpellBonusDamage: {
          ...state.nextSpellBonusDamage,
          [entry.ownerId]:
            (state.nextSpellBonusDamage?.[entry.ownerId] ?? 0) +
            entry.effect.amount,
        },
      },
      events: [{ type: 'unit-play-effect-resolved', sourceId: entry.sourceId }],
    };
  }
  if (entry.effect.type === 'grant-paid-recall') {
    const { targetId, power } = entry.effect;
    return {
      ok: true,
      state: {
        ...state,
        units: state.units.map((u) =>
          u.id === targetId
            ? {
                ...u,
                temporaryEffects: [
                  ...(u.temporaryEffects ?? []),
                  { type: 'recall-on-death' as const, power },
                ],
              }
            : u,
        ),
      },
      events: [{ type: 'unit-play-effect-resolved', sourceId: entry.sourceId }],
    };
  }
  if (entry.effect.type === 'reveal-play-unit') {
    const deck = state.cards.filter((c) =>
      state.zones.some(
        (z) =>
          z.id === c.zoneId && z.kind === 'deck' && z.ownerId === entry.ownerId,
      ),
    );
    const index = deck.findIndex((c) =>
      state.unitDefinitions?.some((d) => d.id === c.definitionId),
    );
    const revealed = index < 0 ? deck : deck.slice(0, index);
    const unitCard = index < 0 ? undefined : deck[index];
    let next: GameState = {
      ...state,
      cards: [...state.cards.filter((c) => !revealed.includes(c)), ...revealed],
    };
    const events: GameEvent[] = [];
    if (unitCard) {
      const graveyard = next.zones.find(
        (z) => z.kind === 'graveyard' && z.ownerId === entry.ownerId,
      );
      // Passage technique par le cimetière pour réutiliser la mise en jeu commune.
      next = {
        ...next,
        cards: next.cards.map((c) =>
          c.id === unitCard.id
            ? { ...c, zoneId: graveyard?.id ?? c.zoneId }
            : c,
        ),
      };
      const played = playUnitFromTrash(next, entry.ownerId, unitCard.id);
      next = played.state;
      events.push(...played.events);
    }
    return {
      ok: true,
      state: next,
      events: [
        ...events,
        { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
      ],
    };
  }
  if (entry.effect.type === 'hook') {
    const { targetId, count } = entry.effect;
    const victim = state.units.find((u) => u.id === targetId);
    const done = [
      { type: 'unit-play-effect-resolved' as const, sourceId: entry.sourceId },
    ];
    if (!victim) return { ok: true, state, events: done };
    const might = effectiveMight(victim, state);
    const killed = settleLethalUnits(state, new Set([victim.id]));
    const choice = lookPlayUnitChoice(
      killed.state,
      entry.sourceId,
      entry.ownerId,
      count,
      0,
      { maxMight: might + 1, free: true },
    );
    return {
      ok: true,
      state: choice
        ? { ...killed.state, pendingModeChoice: choice }
        : killed.state,
      events: [...killed.events, ...done],
    };
  }
  if (entry.effect.type === 'bounce') {
    const id = entry.effect.targetId;
    const done = [
      { type: 'unit-play-effect-resolved' as const, sourceId: entry.sourceId },
    ];
    const unit = state.units.find((u) => u.id === id);
    if (unit) {
      const left = leaveBoard(state, unit, 'hand');
      return { ok: true, state: left.state, events: [...left.events, ...done] };
    }
    const handOf = (ownerId: string) =>
      state.zones.find((z) => z.kind === 'hand' && z.ownerId === ownerId)?.id;
    const gear = state.gears?.find((g) => g.id === id);
    if (gear)
      return {
        ok: true,
        state: {
          ...state,
          gears: state.gears!.filter((g) => g.id !== id),
          cards: [
            ...state.cards,
            {
              id: gear.id,
              definitionId: gear.definitionId,
              ownerId: gear.ownerId,
              zoneId: handOf(gear.ownerId) ?? gear.zoneId,
            },
          ],
        },
        events: done,
      };
    return {
      ok: true,
      state: {
        ...state,
        cards: state.cards.map((c) => {
          if (
            c.id === id &&
            state.zones.some((z) => z.id === c.zoneId && z.kind === 'champion')
          )
            return { ...c, zoneId: handOf(c.ownerId) ?? c.zoneId };
          if (c.id !== id || !c.facedown) return c;
          const back = { ...c, zoneId: handOf(c.ownerId) ?? c.zoneId };
          delete back.facedown;
          return back;
        }),
      },
      events: done,
    };
  }
  if (entry.effect.type === 'recycle-trashes') {
    const choice = trashRecycleChoice(
      state,
      entry.sourceId,
      entry.ownerId,
      entry.effect.count,
    );
    return {
      ok: true,
      state: choice ? { ...state, pendingModeChoice: choice } : state,
      events: [{ type: 'unit-play-effect-resolved', sourceId: entry.sourceId }],
    };
  }
  if (entry.effect.type === 'next-unit-ready') {
    const active =
      !entry.effect.legion ||
      (state.cardsPlayedThisTurn?.[entry.ownerId] ?? 0) > 0;
    return {
      ok: true,
      state: active
        ? {
            ...state,
            nextUnitReady: [...(state.nextUnitReady ?? []), entry.ownerId],
          }
        : state,
      events: [{ type: 'unit-play-effect-resolved', sourceId: entry.sourceId }],
    };
  }
  if (entry.effect.type === 'play-from-trash') {
    const played = playUnitFromTrash(state, entry.ownerId, entry.effect.cardId);
    return {
      ok: true,
      state: played.state,
      events: [
        ...played.events,
        { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
      ],
    };
  }
  if (entry.effect.type === 'spend-buffs-channel') {
    let next = state;
    let spent = 0;
    for (const id of entry.effect.unitIds) {
      const after = spendBuff(next, id);
      if (after) {
        next = after;
        spent++;
      }
    }
    const channeled = channelForPlayer(next, entry.ownerId, spent);
    return {
      ok: true,
      state: channeled.state,
      events: [
        ...channeled.events,
        { type: 'unit-play-effect-resolved', sourceId: entry.sourceId },
      ],
    };
  }
  if (entry.effect.type === 'buff-units') {
    let next = state;
    for (const id of entry.effect.unitIds) next = buffUnit(next, id);
    return {
      ok: true,
      state: next,
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
  if (entry.effect.type === 'move-to-field') {
    const { targetId, destinationId } = entry.effect;
    const unit = state.units.find((u) => u.id === targetId);
    const done = [
      { type: 'unit-play-effect-resolved' as const, sourceId: entry.sourceId },
    ];
    if (!unit) return { ok: true, state, events: done };
    const moved = moveUnit(state, unit, destinationId);
    return { ok: true, state: moved.state, events: [...moved.events, ...done] };
  }
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
  if (entry.effect.type === 'opponent-hand-pick') {
    const choice = opponentHandChoice(
      state,
      entry.sourceId,
      entry.ownerId,
      entry.effect.action,
    );
    return {
      ok: true,
      state: choice ? { ...state, pendingModeChoice: choice } : state,
      events: [{ type: 'unit-play-effect-resolved', sourceId: entry.sourceId }],
    };
  }
  if (entry.effect.type === 'self-might') {
    const { amount } = entry.effect;
    return {
      ok: true,
      state: {
        ...state,
        units: state.units.map((u) =>
          u.id === entry.sourceId
            ? {
                ...u,
                temporaryEffects: [
                  ...(u.temporaryEffects ?? []),
                  { type: 'modify-might' as const, amount },
                ],
              }
            : u,
        ),
      },
      events: [{ type: 'unit-play-effect-resolved', sourceId: entry.sourceId }],
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
