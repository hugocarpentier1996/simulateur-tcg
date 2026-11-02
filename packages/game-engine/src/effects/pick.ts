import { lookRecycleEvents } from './mode-choice.js';
import type { ActionResult, GameAction, GameState } from '../types.js';
import { continueStack } from '../actions/continue-stack.js';

/** Regarde les `count` cartes du dessus du deck du joueur : choix privé d'une carte à garder
 * en main. Deck vide : aucun choix. */
export function startPick(
  state: GameState,
  playerId: string,
  sourceId: string,
  count: number,
): GameState {
  const deck = state.zones.find(
    (z) => z.kind === 'deck' && z.ownerId === playerId,
  );
  const cardIds = state.cards
    .filter((c) => c.zoneId === deck?.id)
    .slice(0, count)
    .map((c) => c.id);
  return cardIds.length
    ? { ...state, pendingPick: { playerId, sourceId, cardIds } }
    : state;
}

/** Carte regardée choisie -> en main ; les autres sont recyclées sous le deck dans leur ordre,
 * puis la pile reprend. Refuse mauvais joueur ou carte non regardée, sans mutation. */
export function choosePick(
  state: GameState,
  action: Extract<GameAction, { type: 'choose-pick' }>,
): ActionResult {
  const pending = state.pendingPick;
  if (!pending) return { ok: false, reason: 'NO_PICK_CHOICE' };
  if (pending.playerId !== action.playerId)
    return { ok: false, reason: 'NO_PRIORITY' };
  if (!pending.cardIds.includes(action.cardId))
    return { ok: false, reason: 'INVALID_TARGET' };
  const hand = state.zones.find(
    (z) => z.kind === 'hand' && z.ownerId === action.playerId,
  );
  if (!hand) return { ok: false, reason: 'MISSING_HAND' };
  const rest = pending.cardIds.filter((id) => id !== action.cardId);
  const recycled = rest.map((id) => state.cards.find((c) => c.id === id)!);
  const next: GameState = {
    ...state,
    pendingPick: null,
    cards: [
      ...state.cards
        .filter((c) => !rest.includes(c.id))
        .map((c) => (c.id === action.cardId ? { ...c, zoneId: hand.id } : c)),
      ...recycled,
    ],
  };
  const seen = lookRecycleEvents(action.playerId, pending.cardIds, rest.length);
  return state.stack
    ? continueStack(next, [
        ...seen,
        { type: 'spell-play-effect-resolved', sourceId: pending.sourceId },
      ])
    : { ok: true, state: next, events: seen };
}
