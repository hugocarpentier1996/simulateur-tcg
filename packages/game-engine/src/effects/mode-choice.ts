import { dealSpellDamage } from './spell-damage.js';
import { settleLethalUnits } from './lethal-units.js';
import { findPayment } from '../legal/payment.js';
import { payCost } from '../cost/payment.js';
import { leaveBoard } from './leave-board.js';
import type { ActionResult, GameAction, GameState } from '../types.js';
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
  | `recycle-any:${string}`;

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
  const modes: readonly EffectMode[] = entry.killGearBuff
    ? ['skip', ...(state.gears ?? []).map((g) => `kill-gear:${g.id}` as const)]
    : entry.discardReturn
      ? inTrash
        ? ['skip', ...handIds.map((id) => `discard-return:${id}` as const)]
        : []
      : entry.payReturn
        ? state.units.some((u) => u.id === entry.sourceId) &&
          findPayment(state, entry.ownerId, ONE_ENERGY)
          ? ['skip', 'pay-return']
          : []
        : entry.modes;
  if (
    modes.length <= 1 &&
    (entry.killGearBuff || entry.discardReturn || entry.payReturn)
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
  const cleared = { ...state, pendingModeChoice: null };
  const applied = applyMode(cleared, pending, action.mode);
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
  if (mode === 'skip') return { state, events: [] };
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
