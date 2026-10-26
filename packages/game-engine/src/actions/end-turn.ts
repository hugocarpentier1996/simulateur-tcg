import type { ActionResult, GameAction, GameState } from '../types.js';
import { startNextTurn } from '../turn/progression.js';

/**
 * Entrée : état cohérent et demande de fin de tour d'un joueur connu.
 * Sortie : refus si le joueur n'est pas actif, hors Main ou en Showdown ; sinon
 * nouvel état à la Main suivante après les étapes automatiques et leurs événements.
 * L'état initial est conservé. Les effets personnalisés restent à ajouter.
 */
export function endTurn(
  state: GameState,
  action: Extract<GameAction, { type: 'end-turn' }>,
): ActionResult {
  if (action.playerId !== state.activePlayerId) {
    return { ok: false, reason: 'NOT_ACTIVE_PLAYER' };
  }
  if (state.phase !== 'main') {
    return { ok: false, reason: 'NOT_MAIN_PHASE' };
  }
  if (state.showdown) {
    return { ok: false, reason: 'SHOWDOWN_IN_PROGRESS' };
  }
  return startNextTurn(state);
}
