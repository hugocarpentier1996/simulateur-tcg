import type { ActionResult, GameAction, GameState } from '../types.js';
import { drawCardForPlayer } from '../turn/draw.js';
import { continueStack } from './continue-stack.js';
/** Joueur attendu + carte de sa main -> défausse, pioche, reprise de pile.
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
  const sourceId = state.pendingDiscard.sourceId;
  const drawn = drawCardForPlayer(
    {
      ...state,
      pendingDiscard: null,
      cards: state.cards.map((c) =>
        c.id === card.id ? { ...c, zoneId: grave.id } : c,
      ),
    },
    action.playerId,
  );
  return continueStack(drawn.state, [
    { type: 'card-discarded', playerId: action.playerId, cardId: card.id },
    ...drawn.events,
    { type: 'movement-effect-resolved', sourceId },
  ]);
}
