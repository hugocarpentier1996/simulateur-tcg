import { hasHidden } from './hidden.js';
import { dealEffectDamage } from './effect-damage.js';
import { moveUnit } from './resolve-spell.js';
import { playUnitFromTrash } from './play-from-trash.js';
import { dealSpellDamage } from './spell-damage.js';
import { settleLethalUnits } from './lethal-units.js';
import { findPayment } from '../legal/payment.js';
import { payCost } from '../cost/payment.js';
import { leaveBoard } from './leave-board.js';
import type {
  ActionResult,
  GameAction,
  GameState,
  UnitBlueprint,
} from '../types.js';
import { drawCardForPlayer } from '../turn/draw.js';
import { channelForPlayer } from '../turn/supplies.js';
import { continueStack } from '../actions/continue-stack.js';
import { killGears } from './kill-gear.js';
import { buffUnit } from './buff.js';

/** Mode proposé par une capacité « X ou Y » : pioche 1, canalise 1 rune Tap, ne rien faire,
 * ou détruire un gear précis puis buffer la source (`kill-gear:<id>`, Adaptatron). */
export type EffectMode =
  | 'draw'
  | 'channel-exhausted'
  | 'skip'
  | `kill-gear:${string}`
  | `discard-return:${string}`
  | 'pay-return'
  | 'favor-cards'
  | 'favor-runes'
  | `kill-own:${string}`
  | `return-unit:${string}`
  | `discard-opp:${string}`
  | `recycle-opp:${string}`
  | `suffer:${string}`
  | 'let-draw'
  | `recycle-any:${string}`
  | 'return-champion'
  | `retreat:${string}`
  | `arrange:${string}`
  | `reinforce:${string}`
  | 'pay-play'
  | `ready:${string}`
  | 'follow'
  | `tf-fury:${string}`
  | `stun:${string}`
  | `split:${string}`
  | `udyr-damage:${string}`
  | 'udyr-ready'
  | 'udyr-ganking'
  | `hit:${string}`
  | `ava:${string}`
  | `kaisa:${string}`;

const ONE_ENERGY = { energy: 1, power: {} };

export interface ModeChoiceEntry {
  kind: 'mode-choice';
  sourceId: string;
  ownerId: string;
  modes: readonly EffectMode[];
  /** « You may kill a gear » : modes calculés à la résolution selon les gears en jeu. */
  killGearBuff?: boolean;
  /** Retour depuis le cimetière contre une défausse : modes selon la main à la résolution. */
  discardReturn?: boolean;
  /** Payer 1 énergie pour renvoyer la source en main (proposé seulement si payable). */
  payReturn?: boolean;
  /** Joueur qui profite aussi du mode choisi (lanceur de Party Favors). */
  partnerId?: string;
  /** Joueurs suivants à choisir à leur tour ce qu'ils tuent (Cull the Weak). */
  nextChoosers?: readonly string[];
  /** Kai'Sa (Mind) : sort du cimetière à rejouer, calculé à la résolution. */
  replaySpell?: boolean;
  /** Ava Achiever : champ d'attaque et couleur du Power à payer. */
  avaAt?: string;
  avaPower?: string;
  /** Icathian Rain : instances restantes et dégâts de chacune (dégâts de sort). */
  hitsLeft?: number;
  hitAmount?: number;
  /** Udyr : modes non encore choisis ce tour, calculés à la résolution. */
  udyr?: boolean;
  /** Teemo (Mind) : cartes du dessus à révéler ; leurs cartes Hidden fixent les dégâts. */
  revealCount?: number;
  /** Volibear : dégâts à répartir entre les ennemis du champ, à la résolution. */
  splitDamageAt?: string;
  splitAmount?: number;
  /** Twisted Fate : champ de l'attaque ; la rune est révélée à la résolution. */
  runeFateAt?: string;
  /** Zone où suivre l'unité alliée déplacée (Stealthy Pursuer). */
  followTo?: string;
  /** Redresser autre chose de Tap (Miss Fortune) : modes calculés à la résolution. */
  readyOther?: boolean;
  /** La source à jouer est dans le deck (Nocturne), pas au cimetière. */
  fromDeck?: boolean;
  /** Coût à payer pour jouer la source depuis le cimetière (Flame Chompers, Phoenix). */
  payPlayCost?: UnitBlueprint['cost'];
  /** Baited Hook : l'unité choisie est jouée sans payer son coût. */
  freePlay?: boolean;
  /** Reinforce : cartes regardées et réduction d'énergie de l'unité jouée. */
  lookedIds?: readonly string[];
  energyReduction?: number;
  /** Nombre de cartes du dessus du deck à arranger (The Candlelit Sanctum). */
  arrangeTop?: number;
  /** Champ dont les unités alliées peuvent être renvoyées en base (Reaver's Row). */
  retreatFrom?: string;
  /** Recyclages restant à choisir dans les cimetières (Forge of the Future). */
  recycleLeft?: number;
  /** Shakedown : dégâts si l'unité est choisie, pioches du partenaire sinon. */
  sufferAmount?: number;
  partnerDraws?: number;
  /** Ce que chaque joueur tue (each-player-kills) ou renvoie en main (Whirlwind). */
  killWhat?: 'unit' | 'gear' | 'return';
}

/** Capacité dépilée après réactions -> choix du mode par son propriétaire, sans fenêtre.
 * Destruction de gear sans gear en jeu : aucun choix, la capacité est sans effet. */
export function resolveModeChoice(
  state: GameState,
  entry: ModeChoiceEntry,
): Extract<ActionResult, { ok: true }> {
  if (entry.runeFateAt) return resolveRuneFate(state, entry, entry.runeFateAt);
  if (entry.revealCount && entry.splitDamageAt) {
    const looked = state.cards
      .filter((c) =>
        state.zones.some(
          (z) =>
            z.id === c.zoneId &&
            z.kind === 'deck' &&
            z.ownerId === entry.ownerId,
        ),
      )
      .slice(0, entry.revealCount);
    const hiddenCount = looked.filter((c) =>
      hasHidden(state, c.definitionId),
    ).length;
    const recycled: GameState = {
      ...state,
      cards: [...state.cards.filter((c) => !looked.includes(c)), ...looked],
    };
    const rest: ModeChoiceEntry = { ...entry, splitAmount: hiddenCount };
    delete rest.revealCount;
    return resolveModeChoice(recycled, rest);
  }
  const inTrash = state.cards.some(
    (c) =>
      c.id === entry.sourceId &&
      state.zones.some((z) => z.id === c.zoneId && z.kind === 'graveyard'),
  );
  const handIds = state.cards
    .filter((c) =>
      state.zones.some(
        (z) =>
          z.id === c.zoneId && z.kind === 'hand' && z.ownerId === entry.ownerId,
      ),
    )
    .map((c) => c.id);
  const retreats = entry.retreatFrom
    ? state.units
        .filter(
          (u) => u.ownerId === entry.ownerId && u.zoneId === entry.retreatFrom,
        )
        .map((u) => `retreat:${u.id}` as const)
    : [];
  const top = entry.arrangeTop
    ? state.cards
        .filter((c) =>
          state.zones.some(
            (z) =>
              z.id === c.zoneId &&
              z.kind === 'deck' &&
              z.ownerId === entry.ownerId,
          ),
        )
        .slice(0, entry.arrangeTop)
        .map((c) => c.id)
    : [];
  const payPlayCost = entry.payPlayCost;
  const exhausted = entry.readyOther
    ? [
        ...state.units.filter(
          (u) =>
            u.ownerId === entry.ownerId && !u.ready && u.id !== entry.sourceId,
        ),
        ...(state.gears ?? []).filter(
          (g) => g.ownerId === entry.ownerId && !g.ready,
        ),
        ...state.cards.filter(
          (c) =>
            c.ownerId === entry.ownerId &&
            c.ready === false &&
            state.zones.some(
              (z) =>
                z.id === c.zoneId &&
                (z.kind === 'runes' || z.kind === 'legend'),
            ),
        ),
      ].map((x) => `ready:${x.id}` as const)
    : [];
  const splitTargets = entry.splitDamageAt
    ? state.units
        .filter(
          (u) =>
            u.ownerId !== entry.ownerId && u.zoneId === entry.splitDamageAt,
        )
        .map((u) => u.id)
    : [];
  const used = state.udyrModesUsed?.[entry.sourceId] ?? [];
  const atFields = state.units
    .filter((u) => state.battlefields.some((f) => f.zoneId === u.zoneId))
    .map((u) => u.id);
  const avaCards =
    entry.avaAt &&
    entry.avaPower &&
    findPayment(state, entry.ownerId, {
      energy: 0,
      power: { [entry.avaPower]: 1 },
    })
      ? state.cards
          .filter(
            (c) =>
              hasHidden(state, c.definitionId) &&
              !state.spellDefinitions?.some((d) => d.id === c.definitionId) &&
              state.zones.some(
                (z) =>
                  z.id === c.zoneId &&
                  z.kind === 'hand' &&
                  z.ownerId === entry.ownerId,
              ),
          )
          .map((c) => `ava:${c.id}` as const)
      : [];
  const score = state.players.find((p) => p.id === entry.ownerId)?.score ?? 0;
  const replayable = entry.replaySpell
    ? state.cards
        .filter((c) => {
          const spell = state.spellDefinitions?.find(
            (d) => d.id === c.definitionId,
          );
          return (
            spell &&
            spell.target.kind === 'caster' &&
            spell.cost.energy < score &&
            state.zones.some(
              (z) =>
                z.id === c.zoneId &&
                z.kind === 'graveyard' &&
                z.ownerId === entry.ownerId,
            ) &&
            findPayment(
              state,
              entry.ownerId,
              { ...spell.cost, energy: 0 },
              'spell',
            )
          );
        })
        .map((c) => `kaisa:${c.id}` as const)
    : [];
  const modes: readonly EffectMode[] = entry.replaySpell
    ? replayable.length
      ? ['skip', ...replayable]
      : []
    : entry.avaAt
      ? avaCards.length
        ? ['skip', ...avaCards]
        : []
      : entry.udyr
        ? [
            ...(used.includes('damage')
              ? []
              : atFields.map((id) => `udyr-damage:${id}` as const)),
            ...(used.includes('stun')
              ? []
              : atFields.map((id) => `stun:${id}` as const)),
            ...(used.includes('ready') ? [] : (['udyr-ready'] as const)),
            ...(used.includes('ganking') ? [] : (['udyr-ganking'] as const)),
          ]
        : entry.splitDamageAt
          ? splitModes(splitTargets, entry.splitAmount ?? 0)
          : entry.readyOther
            ? ['skip', ...exhausted]
            : payPlayCost
              ? (entry.fromDeck
                  ? state.cards.some(
                      (c) =>
                        c.id === entry.sourceId &&
                        state.zones.some(
                          (z) => z.id === c.zoneId && z.kind === 'deck',
                        ),
                    )
                  : inTrash) && findPayment(state, entry.ownerId, payPlayCost)
                ? ['skip', 'pay-play']
                : []
              : entry.arrangeTop
                ? arrangements(top).map(
                    (kept) => `arrange:${kept.join('+')}` as const,
                  )
                : entry.retreatFrom
                  ? ['skip', ...retreats]
                  : entry.killGearBuff
                    ? [
                        'skip',
                        ...(state.gears ?? []).map(
                          (g) => `kill-gear:${g.id}` as const,
                        ),
                      ]
                    : entry.discardReturn
                      ? inTrash
                        ? [
                            'skip',
                            ...handIds.map(
                              (id) => `discard-return:${id}` as const,
                            ),
                          ]
                        : []
                      : entry.payReturn
                        ? state.units.some((u) => u.id === entry.sourceId) &&
                          findPayment(state, entry.ownerId, ONE_ENERGY)
                          ? ['skip', 'pay-return']
                          : []
                        : entry.modes;
  if (
    modes.length <= 1 &&
    (entry.killGearBuff ||
      entry.discardReturn ||
      entry.payReturn ||
      entry.retreatFrom ||
      entry.arrangeTop ||
      entry.payPlayCost ||
      entry.readyOther ||
      (entry.splitDamageAt && !modes.length) ||
      (entry.udyr && !modes.length) ||
      (entry.avaAt && !modes.length) ||
      (entry.replaySpell && !modes.length))
  )
    return {
      ok: true,
      state,
      events: [{ type: 'legend-effect-resolved', sourceId: entry.sourceId }],
    };
  return {
    ok: true,
    state: { ...state, pendingModeChoice: { ...entry, modes } },
    events: [],
  };
}

/** Propriétaire + mode proposé -> effet appliqué puis reprise de la pile. Mauvais joueur ou
 * mode absent : refus sans mutation. */
export function chooseMode(
  state: GameState,
  action: Extract<GameAction, { type: 'choose-mode' }>,
): ActionResult {
  const pending = state.pendingModeChoice;
  if (!pending) return { ok: false, reason: 'NO_MODE_CHOICE' };
  if (pending.ownerId !== action.playerId)
    return { ok: false, reason: 'NO_PRIORITY' };
  if (!pending.modes.includes(action.mode))
    return { ok: false, reason: 'INVALID_MODE' };
  const cleared: GameState = {
    ...state,
    pendingModeChoice: null,
    ...(pending.udyr
      ? {
          udyrModesUsed: {
            ...state.udyrModesUsed,
            [pending.sourceId]: [
              ...(state.udyrModesUsed?.[pending.sourceId] ?? []),
              action.mode.startsWith('udyr-damage:')
                ? 'damage'
                : action.mode.startsWith('stun:')
                  ? 'stun'
                  : action.mode === 'udyr-ready'
                    ? 'ready'
                    : 'ganking',
            ],
          },
        }
      : {}),
  };
  const applied = applyMode(cleared, pending, action.mode);
  if (pending.hitsLeft && pending.hitsLeft > 1) {
    const next = hitChoice(
      applied.state,
      pending.sourceId,
      pending.ownerId,
      pending.hitsLeft - 1,
      pending.hitAmount ?? 0,
    );
    if (next)
      return {
        ok: true,
        state: { ...applied.state, pendingModeChoice: next },
        events: applied.events,
      };
  }
  if (pending.recycleLeft && action.mode.startsWith('recycle-any:')) {
    const next = trashRecycleChoice(
      applied.state,
      pending.sourceId,
      pending.ownerId,
      pending.recycleLeft - 1,
    );
    if (next)
      return {
        ok: true,
        state: { ...applied.state, pendingModeChoice: next },
        events: applied.events,
      };
  }
  if (pending.killWhat) {
    const next = nextKillChoice(
      applied.state,
      pending.sourceId,
      pending.killWhat,
      pending.nextChoosers ?? [],
    );
    if (next)
      return {
        ok: true,
        state: { ...applied.state, pendingModeChoice: next },
        events: applied.events,
      };
  }
  return continueStack(applied.state, [
    ...applied.events,
    { type: 'legend-effect-resolved', sourceId: pending.sourceId },
  ]);
}

function applyMode(
  state: GameState,
  pending: ModeChoiceEntry,
  mode: EffectMode,
): { state: GameState; events: Extract<ActionResult, { ok: true }>['events'] } {
  if (mode === 'draw') return drawCardForPlayer(state, pending.ownerId);
  if (mode === 'channel-exhausted')
    return channelForPlayer(state, pending.ownerId, 1);
  if (mode === 'skip' && !pending.lookedIds) return { state, events: [] };
  if (mode.startsWith('discard-opp:') || mode.startsWith('recycle-opp:')) {
    const id = mode.slice(mode.indexOf(':') + 1);
    const card = state.cards.find((c) => c.id === id);
    if (!card) return { state, events: [] };
    const zone = (kind: 'graveyard' | 'deck') =>
      state.zones.find((z) => z.kind === kind && z.ownerId === card.ownerId)
        ?.id ?? card.zoneId;
    if (mode.startsWith('discard-opp:'))
      return {
        state: {
          ...state,
          cards: state.cards.map((c) =>
            c.id === id ? { ...c, zoneId: zone('graveyard') } : c,
          ),
        },
        events: [
          { type: 'card-discarded', playerId: card.ownerId, cardId: id },
        ],
      };
    return {
      state: {
        ...state,
        cards: [
          ...state.cards.filter((c) => c.id !== id),
          { ...card, zoneId: zone('deck') },
        ],
      },
      events: [],
    };
  }
  if (pending.lookedIds) {
    const chosen = mode.startsWith('reinforce:')
      ? mode.slice('reinforce:'.length)
      : undefined;
    let next = state;
    const events: Extract<ActionResult, { ok: true }>['events'] = [];
    if (chosen) {
      const card = next.cards.find((c) => c.id === chosen);
      const unit = next.unitDefinitions?.find(
        (d) => d.id === card?.definitionId,
      );
      const cost =
        unit &&
        (pending.freePlay
          ? { energy: 0, power: {} }
          : reducedCost(unit.cost, pending.energyReduction ?? 0));
      const plan = cost && findPayment(next, pending.ownerId, cost);
      const paid = plan && payCost(next, pending.ownerId, cost, plan);
      const base = next.zones.find(
        (z) => z.kind === 'base' && z.ownerId === pending.ownerId,
      );
      if (card && unit && base && paid && paid.ok) {
        next = {
          ...paid.state,
          cards: paid.state.cards.filter((c) => c.id !== card.id),
          units: [
            ...paid.state.units,
            {
              id: card.id,
              definitionId: card.definitionId,
              ownerId: pending.ownerId,
              zoneId: base.id,
              ready: unit.entersReady === true,
              might: unit.might,
              ...(unit.tank ? { tank: true } : {}),
              ...(unit.backline ? { backline: true } : {}),
              damage: 0,
            },
          ],
        };
        events.push({
          type: 'unit-played',
          playerId: pending.ownerId,
          unitId: card.id,
          definitionId: unit.id,
          zoneId: base.id,
        });
      }
    }
    const rest = pending.lookedIds.filter(
      (id) => id !== chosen && next.cards.some((c) => c.id === id),
    );
    next = {
      ...next,
      cards: [
        ...next.cards.filter((c) => !rest.includes(c.id)),
        ...rest.map((id) => next.cards.find((c) => c.id === id)!),
      ],
    };
    return { state: next, events };
  }
  if (mode.startsWith('arrange:')) {
    const kept = mode.slice('arrange:'.length).split('+').filter(Boolean);
    const deckIds = state.cards
      .filter((c) =>
        state.zones.some(
          (z) =>
            z.id === c.zoneId &&
            z.kind === 'deck' &&
            z.ownerId === pending.ownerId,
        ),
      )
      .map((c) => c.id);
    const looked = deckIds.slice(0, pending.arrangeTop ?? 0);
    const byId = (id: string) => state.cards.find((c) => c.id === id)!;
    const others = state.cards.filter((c) => !looked.includes(c.id));
    const firstDeck = others.findIndex((c) => deckIds.includes(c.id));
    const at = firstDeck < 0 ? others.length : firstDeck;
    return {
      state: {
        ...state,
        cards: [
          ...others.slice(0, at),
          ...kept.map(byId),
          ...others.slice(at),
          ...looked.filter((id) => !kept.includes(id)).map(byId),
        ],
      },
      events: [],
    };
  }
  if (mode.startsWith('retreat:')) {
    const unit = state.units.find(
      (u) => u.id === mode.slice('retreat:'.length),
    );
    const base = state.zones.find(
      (z) => z.kind === 'base' && z.ownerId === unit?.ownerId,
    );
    if (!unit || !base) return { state, events: [] };
    return {
      state: {
        ...state,
        units: state.units.map((u) =>
          u.id === unit.id ? { ...u, zoneId: base.id } : u,
        ),
      },
      events: [
        { type: 'unit-moved', unitId: unit.id, from: unit.zoneId, to: base.id },
      ],
    };
  }
  if (mode === 'return-champion') {
    const championId = championReturnable(state, pending.ownerId);
    const zone = state.zones.find(
      (z) => z.kind === 'champion' && z.ownerId === pending.ownerId,
    );
    if (!championId || !zone) return { state, events: [] };
    return {
      state: {
        ...state,
        cards: state.cards.map((c) =>
          c.id === championId ? { ...c, zoneId: zone.id } : c,
        ),
      },
      events: [],
    };
  }
  if (mode.startsWith('recycle-any:')) {
    const card = state.cards.find(
      (c) => c.id === mode.slice('recycle-any:'.length),
    );
    const deck = state.zones.find(
      (z) => z.kind === 'deck' && z.ownerId === card?.ownerId,
    );
    if (!card || !deck) return { state, events: [] };
    return {
      state: {
        ...state,
        cards: [
          ...state.cards.filter((c) => c.id !== card.id),
          { ...card, zoneId: deck.id },
        ],
      },
      events: [],
    };
  }
  if (mode.startsWith('suffer:')) {
    const unit = state.units.find((u) => u.id === mode.slice('suffer:'.length));
    if (!unit) return { state, events: [] };
    const damaged = dealSpellDamage(
      state,
      pending.sourceId,
      pending.partnerId ?? pending.ownerId,
      [unit],
      pending.sufferAmount ?? 0,
    );
    const settled = settleLethalUnits(damaged.state);
    return {
      state: settled.state,
      events: [...damaged.events, ...settled.events],
    };
  }
  if (mode === 'let-draw') {
    let next = state;
    const events: Extract<ActionResult, { ok: true }>['events'] = [];
    for (let i = 0; i < (pending.partnerDraws ?? 0) && !next.result; i++) {
      const drawn = drawCardForPlayer(
        next,
        pending.partnerId ?? pending.ownerId,
      );
      next = drawn.state;
      events.push(...drawn.events);
    }
    return { state: next, events };
  }
  if (mode.startsWith('return-unit:')) {
    const unit = state.units.find(
      (u) => u.id === mode.slice('return-unit:'.length),
    );
    return unit ? leaveBoard(state, unit, 'hand') : { state, events: [] };
  }
  if (mode.startsWith('kill-own:')) {
    const id = mode.slice('kill-own:'.length);
    return pending.killWhat === 'gear'
      ? killGears(state, [id])
      : settleLethalUnits(state, new Set([id]));
  }
  if (mode === 'favor-cards' || mode === 'favor-runes') {
    let next = state;
    const events: Extract<ActionResult, { ok: true }>['events'] = [];
    for (const playerId of [pending.partnerId, pending.ownerId]) {
      if (!playerId || next.result) continue;
      const r =
        mode === 'favor-cards'
          ? drawCardForPlayer(next, playerId)
          : channelForPlayer(next, playerId, 1);
      next = r.state;
      events.push(...r.events);
    }
    return { state: next, events };
  }
  if (mode.startsWith('kaisa:')) {
    const card = state.cards.find((c) => c.id === mode.slice('kaisa:'.length));
    const spell = state.spellDefinitions?.find(
      (d) => d.id === card?.definitionId,
    );
    if (!card || !spell || !state.stack) return { state, events: [] };
    const cost = { ...spell.cost, energy: 0 };
    const plan = findPayment(state, pending.ownerId, cost, 'spell');
    const paid = plan && payCost(state, pending.ownerId, cost, plan, 'spell');
    if (!paid || !paid.ok || !paid.state.stack) return { state, events: [] };
    return {
      state: {
        ...paid.state,
        cards: paid.state.cards.filter((c) => c.id !== card.id),
        stack: {
          ...paid.state.stack,
          entries: [
            ...paid.state.stack.entries,
            {
              card,
              definition: spell,
              casterId: pending.ownerId,
              targetId: pending.ownerId,
              recycleOnResolve: true,
            },
          ],
        },
      },
      events: [],
    };
  }
  if (mode.startsWith('ava:') && pending.avaAt && pending.avaPower) {
    const card = state.cards.find((c) => c.id === mode.slice('ava:'.length));
    const cost = { energy: 0, power: { [pending.avaPower]: 1 } };
    const plan = findPayment(state, pending.ownerId, cost);
    const paid = plan && payCost(state, pending.ownerId, cost, plan);
    if (!card || !paid || !paid.ok) return { state, events: [] };
    const unit = paid.state.unitDefinitions?.find(
      (d) => d.id === card.definitionId,
    );
    const gear = paid.state.gearDefinitions?.find(
      (d) => d.id === card.definitionId,
    );
    const base = paid.state.zones.find(
      (z) => z.kind === 'base' && z.ownerId === pending.ownerId,
    );
    if (unit)
      return {
        state: {
          ...paid.state,
          cards: paid.state.cards.filter((c) => c.id !== card.id),
          units: [
            ...paid.state.units,
            {
              id: card.id,
              definitionId: card.definitionId,
              ownerId: pending.ownerId,
              zoneId: pending.avaAt,
              ready: unit.entersReady === true,
              might: unit.might,
              ...(unit.tank ? { tank: true } : {}),
              ...(unit.backline ? { backline: true } : {}),
              damage: 0,
            },
          ],
        },
        events: [
          {
            type: 'unit-played',
            playerId: pending.ownerId,
            unitId: card.id,
            definitionId: unit.id,
            zoneId: pending.avaAt,
          },
        ],
      };
    if (gear && base)
      return {
        state: {
          ...paid.state,
          cards: paid.state.cards.filter((c) => c.id !== card.id),
          gears: [
            ...(paid.state.gears ?? []),
            {
              id: card.id,
              definitionId: card.definitionId,
              ownerId: pending.ownerId,
              zoneId: base.id,
              ready: !gear.entersExhausted,
            },
          ],
        },
        events: [
          {
            type: 'gear-played',
            playerId: pending.ownerId,
            gearId: card.id,
            zoneId: base.id,
          },
        ],
      };
    return { state, events: [] };
  }
  if (mode.startsWith('hit:')) {
    const unit = state.units.find((u) => u.id === mode.slice('hit:'.length));
    if (!unit) return { state, events: [] };
    return dealSpellDamage(
      state,
      pending.sourceId,
      pending.ownerId,
      [unit],
      pending.hitAmount ?? 0,
    );
  }
  if (mode.startsWith('udyr-damage:')) {
    const unit = state.units.find(
      (u) => u.id === mode.slice('udyr-damage:'.length),
    );
    if (!unit) return { state, events: [] };
    const damaged = dealEffectDamage(
      state,
      {
        kind: 'ability',
        sourceId: pending.sourceId,
        playerId: pending.ownerId,
      },
      [unit],
      2,
    );
    const settled = settleLethalUnits(damaged.state);
    return {
      state: settled.state,
      events: [...damaged.events, ...settled.events],
    };
  }
  if (mode === 'udyr-ready' || mode === 'udyr-ganking')
    return {
      state: {
        ...state,
        units: state.units.map((u) =>
          u.id !== pending.sourceId
            ? u
            : mode === 'udyr-ready'
              ? { ...u, ready: true }
              : {
                  ...u,
                  temporaryEffects: [
                    ...(u.temporaryEffects ?? []),
                    { type: 'ganking' as const },
                  ],
                },
        ),
      },
      events: [],
    };
  if (mode.startsWith('split:')) {
    let next = state;
    const events: Extract<ActionResult, { ok: true }>['events'] = [];
    for (const part of mode.slice('split:'.length).split(',')) {
      const [id, n] = part.split('=');
      const unit = next.units.find((u) => u.id === id);
      if (!unit || !n) continue;
      const damaged = dealEffectDamage(
        next,
        {
          kind: 'ability',
          sourceId: pending.sourceId,
          playerId: pending.ownerId,
        },
        [unit],
        Number(n),
      );
      next = damaged.state;
      events.push(...damaged.events);
    }
    const settled = settleLethalUnits(next);
    return { state: settled.state, events: [...events, ...settled.events] };
  }
  if (mode.startsWith('tf-fury:')) {
    const main = state.units.find(
      (u) => u.id === mode.slice('tf-fury:'.length),
    );
    if (!main) return { state, events: [] };
    const others = state.units.filter(
      (u) =>
        u.id !== main.id &&
        u.ownerId === main.ownerId &&
        u.zoneId === main.zoneId,
    );
    const source = {
      kind: 'ability' as const,
      sourceId: pending.sourceId,
      playerId: pending.ownerId,
    };
    const first = dealEffectDamage(state, source, [main], 2);
    const second = dealEffectDamage(first.state, source, others, 1);
    const settled = settleLethalUnits(second.state);
    return {
      state: settled.state,
      events: [...first.events, ...second.events, ...settled.events],
    };
  }
  if (mode.startsWith('stun:')) {
    const id = mode.slice('stun:'.length);
    return {
      state: {
        ...state,
        units: state.units.map((u) =>
          u.id === id
            ? {
                ...u,
                temporaryEffects: [
                  ...(u.temporaryEffects ?? []),
                  { type: 'stun' as const },
                ],
              }
            : u,
        ),
      },
      events: [],
    };
  }
  if (mode === 'follow' && pending.followTo) {
    const pursuer = state.units.find((u) => u.id === pending.sourceId);
    if (!pursuer || pursuer.zoneId === pending.followTo)
      return { state, events: [] };
    return moveUnit(state, pursuer, pending.followTo);
  }
  if (mode.startsWith('ready:')) {
    const id = mode.slice('ready:'.length);
    return {
      state: {
        ...state,
        units: state.units.map((u) =>
          u.id === id ? { ...u, ready: true } : u,
        ),
        ...(state.gears
          ? {
              gears: state.gears.map((g) =>
                g.id === id ? { ...g, ready: true } : g,
              ),
            }
          : {}),
        cards: state.cards.map((c) =>
          c.id === id ? { ...c, ready: true } : c,
        ),
      },
      events: [],
    };
  }
  if (mode === 'pay-play' && pending.payPlayCost) {
    const cost = pending.payPlayCost;
    const plan = findPayment(state, pending.ownerId, cost);
    const paid = plan && payCost(state, pending.ownerId, cost, plan);
    if (!paid || !paid.ok) return { state, events: [] };
    return playUnitFromTrash(paid.state, pending.ownerId, pending.sourceId);
  }
  if (mode === 'pay-return') {
    const unit = state.units.find((u) => u.id === pending.sourceId);
    const payment = findPayment(state, pending.ownerId, ONE_ENERGY);
    const paid =
      payment && payCost(state, pending.ownerId, ONE_ENERGY, payment);
    if (!unit || !paid || !paid.ok) return { state, events: [] };
    const left = leaveBoard(paid.state, unit, 'hand');
    return { state: left.state, events: left.events };
  }
  if (mode.startsWith('discard-return:')) {
    const discardId = mode.slice('discard-return:'.length);
    const zone = (kind: 'hand' | 'graveyard') =>
      state.zones.find((z) => z.kind === kind && z.ownerId === pending.ownerId)
        ?.id;
    return {
      state: {
        ...state,
        cards: state.cards.map((c) =>
          c.id === discardId
            ? { ...c, zoneId: zone('graveyard') ?? c.zoneId }
            : c.id === pending.sourceId
              ? { ...c, zoneId: zone('hand') ?? c.zoneId }
              : c,
        ),
      },
      events: [
        {
          type: 'card-discarded',
          playerId: pending.ownerId,
          cardId: discardId,
        },
      ],
    };
  }
  const killed = killGears(state, [mode.slice('kill-gear:'.length)]);
  return {
    state: killed.events.length
      ? buffUnit(killed.state, pending.sourceId)
      : killed.state,
    events: killed.events,
  };
}

/** Premier joueur de la liste ayant quelque chose à tuer -> son choix (« kill-own:<id> »),
 * les suivants restant en file. Personne : undefined. */
export function nextKillChoice(
  state: GameState,
  sourceId: string,
  what: 'unit' | 'gear' | 'return',
  players: readonly string[],
): ModeChoiceEntry | undefined {
  for (const [i, playerId] of players.entries()) {
    if (what === 'return') {
      if (!state.units.length) return undefined;
      return {
        kind: 'mode-choice',
        sourceId,
        ownerId: playerId,
        modes: [
          'skip',
          ...state.units.map((u) => `return-unit:${u.id}` as const),
        ],
        killWhat: what,
        nextChoosers: players.slice(i + 1),
      };
    }
    const ids = (what === 'unit' ? state.units : (state.gears ?? []))
      .filter((p) => p.ownerId === playerId)
      .map((p) => p.id);
    if (ids.length)
      return {
        kind: 'mode-choice',
        sourceId,
        ownerId: playerId,
        modes: ids.map((id) => `kill-own:${id}` as const),
        killWhat: what,
        nextChoosers: players.slice(i + 1),
      };
  }
  return undefined;
}

/** Main de l'adversaire révélée -> choix du joueur parmi ses cartes (hors unités pour un
 * recyclage). Rien à choisir : undefined. */
export function opponentHandChoice(
  state: GameState,
  sourceId: string,
  playerId: string,
  action: 'discard' | 'recycle-non-unit',
): ModeChoiceEntry | undefined {
  const opponent = state.players.find((p) => p.id !== playerId);
  const ids = state.cards
    .filter(
      (c) =>
        state.zones.some(
          (z) =>
            z.id === c.zoneId &&
            z.kind === 'hand' &&
            z.ownerId === opponent?.id,
        ) &&
        (action === 'discard' ||
          !state.unitDefinitions?.some((d) => d.id === c.definitionId)),
    )
    .map((c) => c.id);
  if (!ids.length) return undefined;
  return {
    kind: 'mode-choice',
    sourceId,
    ownerId: playerId,
    modes: ids.map((id) =>
      action === 'discard'
        ? (`discard-opp:${id}` as const)
        : (`recycle-opp:${id}` as const),
    ),
  };
}

/** Recyclage au choix dans tous les cimetières : « skip » ou une carte ; rien à recycler ou
 * plus de recyclage : undefined. */
export function trashRecycleChoice(
  state: GameState,
  sourceId: string,
  playerId: string,
  left: number,
): ModeChoiceEntry | undefined {
  const ids = state.cards
    .filter((c) =>
      state.zones.some((z) => z.id === c.zoneId && z.kind === 'graveyard'),
    )
    .map((c) => c.id);
  if (left <= 0 || !ids.length) return undefined;
  return {
    kind: 'mode-choice',
    sourceId,
    ownerId: playerId,
    modes: ['skip', ...ids.map((id) => `recycle-any:${id}` as const)],
    recycleLeft: left,
  };
}

/** Chosen Champion du joueur au cimetière avec sa zone champion vide -> son id. */
export function championReturnable(
  state: GameState,
  playerId: string,
): string | undefined {
  const championId = state.chosenChampions?.[playerId];
  const zone = state.zones.find(
    (z) => z.kind === 'champion' && z.ownerId === playerId,
  );
  const inTrash = state.cards.some(
    (c) =>
      c.id === championId &&
      state.zones.some(
        (z) =>
          z.id === c.zoneId && z.kind === 'graveyard' && z.ownerId === playerId,
      ),
  );
  if (!zone || !inTrash || state.cards.some((c) => c.zoneId === zone.id))
    return undefined;
  return championId;
}

/** Cartes regardées -> sous-listes ordonnées conservées au-dessus (les autres recyclées),
 * des plus longues aux plus courtes. */
function arrangements(ids: readonly string[]): string[][] {
  const orders = (list: readonly string[]): string[][] =>
    list.length <= 1
      ? [[...list]]
      : list.flatMap((id, i) =>
          orders([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [
            id,
            ...rest,
          ]),
        );
  const subsets = (list: readonly string[], size: number): string[][] =>
    size === 0
      ? [[]]
      : list.flatMap((id, i) =>
          subsets(list.slice(i + 1), size - 1).map((rest) => [id, ...rest]),
        );
  const result: string[][] = [];
  for (let size = ids.length; size >= 0; size--)
    for (const subset of subsets(ids, size)) result.push(...orders(subset));
  return result;
}

/** Capacité de conquête The Candlelit Sanctum (choix à la résolution). */
export function sanctumEntry(
  battlefieldId: string,
  playerId: string,
  count = 2,
): ModeChoiceEntry {
  return {
    kind: 'mode-choice',
    sourceId: battlefieldId,
    ownerId: playerId,
    modes: [],
    arrangeTop: count,
  };
}

/** Coût d'unité moins une réduction d'énergie (plancher 0). */
function reducedCost(
  cost: UnitBlueprint['cost'],
  energy: number,
): UnitBlueprint['cost'] {
  return { ...cost, energy: Math.max(0, cost.energy - energy) };
}

/** Reinforce : cartes du dessus regardées -> choix d'une unité jouable (reste du coût
 * payable) ou « skip » ; le reste sera recyclé. */
export function lookPlayUnitChoice(
  state: GameState,
  sourceId: string,
  playerId: string,
  count: number,
  energyReduction: number,
  options: { maxMight?: number; free?: boolean } = {},
): ModeChoiceEntry | undefined {
  const looked = state.cards
    .filter((c) =>
      state.zones.some(
        (z) => z.id === c.zoneId && z.kind === 'deck' && z.ownerId === playerId,
      ),
    )
    .slice(0, count);
  if (!looked.length) return undefined;
  const playable = looked.filter((c) => {
    const unit = state.unitDefinitions?.find((d) => d.id === c.definitionId);
    return (
      unit &&
      (options.maxMight === undefined || unit.might <= options.maxMight) &&
      (options.free ||
        findPayment(state, playerId, reducedCost(unit.cost, energyReduction)))
    );
  });
  return {
    kind: 'mode-choice',
    sourceId,
    ownerId: playerId,
    modes: ['skip', ...playable.map((c) => `reinforce:${c.id}` as const)],
    lookedIds: looked.map((c) => c.id),
    energyReduction,
    ...(options.free ? { freePlay: true } : {}),
  };
}

/** Twisted Fate : rune du dessus révélée puis recyclée sous la pile ; Mind pioche aussitôt,
 * Fury et Order ouvrent un choix de cible ennemie (ici / n'importe où). */
function resolveRuneFate(
  state: GameState,
  entry: ModeChoiceEntry,
  battlefieldId: string,
): Extract<ActionResult, { ok: true }> {
  const done = [
    { type: 'legend-effect-resolved' as const, sourceId: entry.sourceId },
  ];
  const pile = state.cards.filter((c) =>
    state.zones.some(
      (z) =>
        z.id === c.zoneId &&
        z.kind === 'rune-pile' &&
        z.ownerId === entry.ownerId,
    ),
  );
  const top = pile[0];
  if (!top) return { ok: true, state, events: done };
  let next: GameState = {
    ...state,
    cards: [...state.cards.filter((c) => c.id !== top.id), top],
  };
  const enemies = (here: boolean) =>
    next.units
      .filter(
        (u) =>
          u.ownerId !== entry.ownerId && (!here || u.zoneId === battlefieldId),
      )
      .map((u) => u.id);
  if (top.color === 'bleu') {
    const drawn = drawCardForPlayer(next, entry.ownerId);
    return { ok: true, state: drawn.state, events: [...drawn.events, ...done] };
  }
  const modes =
    top.color === 'rouge'
      ? enemies(true).map((id) => `tf-fury:${id}` as const)
      : top.color === 'jaune'
        ? enemies(false).map((id) => `stun:${id}` as const)
        : [];
  if (!modes.length) return { ok: true, state: next, events: done };
  const pending: ModeChoiceEntry = { ...entry, modes };
  delete pending.runeFateAt;
  next = { ...next, pendingModeChoice: pending };
  return { ok: true, state: next, events: [] };
}

/** Répartitions de `amount` dégâts entre des cibles (chaque part ≥ 1, cibles facultatives),
 * sous forme « split:id=n,id=m ». Aucune cible : aucune option. */
function splitModes(ids: readonly string[], amount: number): EffectMode[] {
  const result: EffectMode[] = [];
  const walk = (i: number, left: number, parts: string[]) => {
    if (left === 0) {
      if (parts.length) result.push(`split:${parts.join(',')}`);
      return;
    }
    if (i >= ids.length) return;
    for (let n = left; n >= 0; n--)
      walk(i + 1, left - n, n ? [...parts, `${ids[i]}=${n}`] : parts);
  };
  walk(0, amount, []);
  return result;
}

/** Capacité Teemo (Mind) : révélation puis dégâts répartis entre les ennemis du champ. */
export function revealDamageEntry(
  sourceId: string,
  ownerId: string,
  battlefieldId: string,
  count: number,
): ModeChoiceEntry {
  return {
    kind: 'mode-choice',
    sourceId,
    ownerId,
    modes: [],
    revealCount: count,
    splitDamageAt: battlefieldId,
  };
}

/** Icathian Rain : prochaine instance de dégâts à attribuer à une unité en jeu. */
export function hitChoice(
  state: GameState,
  sourceId: string,
  playerId: string,
  left: number,
  amount: number,
): ModeChoiceEntry | undefined {
  if (left <= 0 || !state.units.length) return undefined;
  return {
    kind: 'mode-choice',
    sourceId,
    ownerId: playerId,
    modes: state.units.map((u) => `hit:${u.id}` as const),
    hitsLeft: left,
    hitAmount: amount,
  };
}
