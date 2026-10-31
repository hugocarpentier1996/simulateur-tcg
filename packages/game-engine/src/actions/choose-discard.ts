import type {
  ActionResult,
  GameAction,
  GameEvent,
  GameState,
} from '../types.js';
import { handSize } from '../effects/loot.js';
import { drawCardForPlayer } from '../turn/draw.js';
import { continueStack } from './continue-stack.js';
/** Joueur attendu + carte de sa main -> défausse ; s'il reste des défausses dues et des
 * cartes en main, nouveau choix ; sinon pioche(s) prévue(s) et reprise de pile.
 * Refuse mauvais joueur, carte hors main ou absence de choix sans modifier l'état.
 * Défausse et pioche forment une seule résolution : aucune fenêtre intermédiaire. */
export function chooseDiscard(
  state: GameState,
  action: Extract<GameAction, { type: 'choose-discard' }>,
): ActionResult {
  if (!state.pendingDiscard) return { ok: false, reason: 'NO_DISCARD_CHOICE' };
  if (state.pendingDiscard.playerId !== action.playerId)
    return { ok: false, reason: 'NO_PRIORITY' };
  const card = state.cards.find(
    (c) =>
      c.id === action.cardId &&
      c.ownerId === action.playerId &&
      state.zones.some(
        (z) =>
          z.id === c.zoneId &&
          z.kind === 'hand' &&
          z.ownerId === action.playerId,
      ),
  );
  if (!card) return { ok: false, reason: 'CARD_NOT_IN_HAND' };
  const grave = state.zones.find(
    (z) => z.kind === 'graveyard' && z.ownerId === action.playerId,
  );
  if (!grave) return { ok: false, reason: 'MISSING_GRAVEYARD' };
  const pending = state.pendingDiscard;
  const discarded: GameState = {
    ...state,
    pendingDiscard: null,
    cards: state.cards.map((c) =>
      c.id === card.id ? { ...c, zoneId: grave.id } : c,
    ),
  };
  const event = {
    type: 'card-discarded' as const,
    playerId: action.playerId,
    cardId: card.id,
  };
  const remaining = (pending.remaining ?? 1) - 1;
  if (remaining > 0 && handSize(discarded, action.playerId) > 0)
    return {
      ok: true,
      state: { ...discarded, pendingDiscard: { ...pending, remaining } },
      events: [event],
    };
  let next = discarded;
  const events: GameEvent[] = [event];
  for (let i = 0; i < (pending.draw ?? 1) && !next.result; i++) {
    const drawn = drawCardForPlayer(next, action.playerId);
    next = drawn.state;
    events.push(...drawn.events);
  }
  if (pending.remaining === undefined)
    events.push({
      type: 'movement-effect-resolved',
      sourceId: pending.sourceId,
    });
  return continueStack(next, events);
}
