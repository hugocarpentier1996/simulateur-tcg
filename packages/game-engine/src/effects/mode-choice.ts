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
  | 'favor-runes';

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
