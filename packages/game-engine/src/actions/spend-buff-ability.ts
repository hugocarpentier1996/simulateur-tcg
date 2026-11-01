import type { ActionResult, GameAction, GameState } from '../types.js';
import type { PlayEffectEntry } from '../effects/play-effect.js';
import { spendBuff } from '../effects/buff.js';

/** « Spend my buff » : son tour, Main en état ouvert ; unité alliée buffée dotée de la
 * capacité -> buff dépensé (coût) et bonus de Might empilé (réactions possibles). */
export function spendBuffAbility(
  state: GameState,
  action: Extract<GameAction, { type: 'spend-buff-ability' }>,
): ActionResult {
  if (
    state.phase !== 'main' ||
    state.activePlayerId !== action.playerId ||
    state.stack ||
    state.showdown
  )
    return { ok: false, reason: 'ABILITY_WINDOW_CLOSED' };
  const unit = state.units.find(
    (u) => u.id === action.unitId && u.ownerId === action.playerId,
  );
  const might = state.unitDefinitions?.find(
    (d) => d.id === unit?.definitionId,
  )?.buffSpendMight;
  if (!unit || !might) return { ok: false, reason: 'NO_ABILITY' };
  const spent = spendBuff(state, unit.id);
  if (!spent) return { ok: false, reason: 'NOT_BUFFED' };
  const entry: PlayEffectEntry = {
    kind: 'play-effect',
    sourceId: unit.id,
    ownerId: action.playerId,
    effect: { type: 'self-might', amount: might },
  };
  return {
    ok: true,
    state: {
      ...spent,
      stack: {
        entries: [entry],
        initiatorId: action.playerId,
        priorityPlayerId: action.playerId,
        consecutivePasses: 0,
      },
    },
    events: [{ type: 'unit-play-effect-queued', sourceId: unit.id }],
  };
}

/** « Recycle 1 from your trash » : son tour, Main en état ouvert ; carte du cimetière du
 * joueur recyclée sous son deck (coût) et bonus de Might empilé (réactions possibles). */
export function trashRecycleAbility(
  state: GameState,
  action: Extract<GameAction, { type: 'trash-recycle-ability' }>,
): ActionResult {
  if (
    state.phase !== 'main' ||
    state.activePlayerId !== action.playerId ||
    state.stack ||
    state.showdown
  )
    return { ok: false, reason: 'ABILITY_WINDOW_CLOSED' };
  const unit = state.units.find(
    (u) => u.id === action.unitId && u.ownerId === action.playerId,
  );
  const might = state.unitDefinitions?.find(
    (d) => d.id === unit?.definitionId,
  )?.trashRecycleMight;
  if (!unit || !might) return { ok: false, reason: 'NO_ABILITY' };
  const card = state.cards.find(
    (c) =>
      c.id === action.cardId &&
      state.zones.some(
        (z) =>
          z.id === c.zoneId &&
          z.kind === 'graveyard' &&
          z.ownerId === action.playerId,
      ),
  );
  const deck = state.zones.find(
    (z) => z.kind === 'deck' && z.ownerId === action.playerId,
  );
  if (!card || !deck) return { ok: false, reason: 'INVALID_ADDITIONAL_COST' };
  const entry: PlayEffectEntry = {
    kind: 'play-effect',
    sourceId: unit.id,
    ownerId: action.playerId,
    effect: { type: 'self-might', amount: might },
  };
  return {
    ok: true,
    state: {
      ...state,
      cards: [
        ...state.cards.filter((c) => c.id !== card.id),
        { ...card, zoneId: deck.id },
      ],
      stack: {
        entries: [entry],
        initiatorId: action.playerId,
        priorityPlayerId: action.playerId,
        consecutivePasses: 0,
      },
    },
    events: [{ type: 'unit-play-effect-queued', sourceId: unit.id }],
  };
}
