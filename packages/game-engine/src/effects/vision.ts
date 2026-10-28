import type { GameState, ActionResult, GameAction } from '../types.js';
import { continueStack } from '../actions/continue-stack.js';
function topCard(state: GameState, playerId: string) {
  return state.cards.find(
    (c) =>
      c.ownerId === playerId &&
      state.zones.some(
        (z) => z.id === c.zoneId && z.kind === 'deck' && z.ownerId === playerId,
      ),
  );
}
/** Après réactions, mémorise le sommet visible uniquement au propriétaire. Deck vide : aucun choix ni pioche. */
export function startVision(
  state: GameState,
  playerId: string,
  sourceId: string,
): Extract<ActionResult, { ok: true }> {
  const card = topCard(state, playerId);
  return {
    ok: true,
    state: card
      ? { ...state, pendingVision: { playerId, sourceId, cardId: card.id } }
      : state,
    events: card ? [] : [{ type: 'unit-play-effect-resolved', sourceId }],
  };
}
/** Choix privé obligatoire -> garder au sommet ou recycler au-dessous, puis reprendre la pile.
 * Refuse mauvais joueur/fenêtre/sommet modifié. Ne diffuse pas l'identité regardée dans le journal. */
export function chooseVision(
  state: GameState,
  action: Extract<GameAction, { type: 'choose-vision' }>,
): ActionResult {
  const pending = state.pendingVision;
  if (!pending) return { ok: false, reason: 'NO_VISION_CHOICE' };
  if (pending.playerId !== action.playerId)
    return { ok: false, reason: 'NO_PRIORITY' };
  const card = topCard(state, action.playerId);
  if (card?.id !== pending.cardId)
    return { ok: false, reason: 'INVALID_TARGET' };
  return continueStack(
    {
      ...state,
      pendingVision: null,
      cards: action.recycle
        ? [...state.cards.filter((c) => c.id !== card.id), card]
        : state.cards,
    },
    [{ type: 'unit-play-effect-resolved', sourceId: pending.sourceId }],
  );
}
