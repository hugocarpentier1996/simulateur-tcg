import { endRuneLegend, runeIdsInPlay } from '../effects/end-runes.js';
import type { ActionResult, GameAction, GameState } from '../types.js';
import { startNextTurn } from '../turn/progression.js';

/**
 * Entrée : état cohérent et demande de fin de tour d'un joueur connu.
 * Sortie : refus si le joueur n'est pas actif, hors Main ou en Showdown ; sinon
 * nouvel état à la Main suivante après les étapes automatiques et leurs événements.
 * Dark Child suspend la fin de tour avec une pile réactive ; choix des runes requis.
 * L'état initial est conservé.
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
  const legend = endRuneLegend(state, action.playerId);
  if (legend) {
    const valid = runeIdsInPlay(state, action.playerId),
      ids = action.readyRuneIds;
    if (
      !ids ||
      ids.length !==
        Math.min(legend.definition.readyRunesAtEnd!, valid.length) ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !valid.includes(id))
    )
      return { ok: false, reason: 'INVALID_READY_RUNES' };
    return {
      ok: true,
      state: {
        ...state,
        phase: 'end',
        pendingTurnEnd: true,
        stack: {
          entries: [
            {
              kind: 'legend-ready-runes',
              sourceId: legend.card.id,
              ownerId: action.playerId,
              runeIds: [...ids],
            },
          ],
          initiatorId: action.playerId,
          priorityPlayerId: action.playerId,
          consecutivePasses: 0,
        },
      },
      events: [
        { type: 'phase-started', playerId: action.playerId, phase: 'end' },
        { type: 'legend-effect-queued', sourceId: legend.card.id },
      ],
    };
  }
  return startNextTurn(state);
}
