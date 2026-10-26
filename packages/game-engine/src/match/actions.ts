import { act } from '../act.js';
import { recordOpeningRoll } from '../setup/roll.js';
import type { GameAction, ActionResult } from '../types.js';
import type { Bo3Result, Bo3State, Bo3Event } from './types.js';

/** Action de partie -> état BO3 mis à jour, champ réservé et résultat compté dès la victoire.
 * Utiliser cette entrée à la place de act pour une série. Refus moteur propagés sans mutation.
 * Une manche terminée n'accepte plus d'action : son résultat ne peut pas être compté deux fois. */
export function actBo3(state: Bo3State, action: GameAction): Bo3Result {
  if (state.winnerId) return { ok: false, reason: 'MATCH_OVER' };
  const result = act(state.game, action);
  if (!result.ok) return result;
  let next = state;
  if (action.type === 'choose-battlefield') {
    const setup = state.game.setup;
    if (setup?.stage !== 'choose-battlefield')
      throw new Error('Choix accepté hors préparation.');
    const card = setup.options[action.playerId]!.find(
      (c) => c.id === action.battlefieldId,
    )!;
    next = {
      ...state,
      usedBattlefields: {
        ...state.usedBattlefields,
        [action.playerId]: [
          ...state.usedBattlefields[action.playerId]!,
          card.definitionId,
        ],
      },
    };
  }
  return updateGame(next, result);
}

/** Résultats de d20 fournis par le serveur -> préparation BO3 actualisée ; mêmes refus que le moteur. */
export function rollBo3(
  state: Bo3State,
  rolls: Readonly<Record<string, number>>,
): Bo3Result {
  if (state.winnerId) return { ok: false, reason: 'MATCH_OVER' };
  return updateGame(state, recordOpeningRoll(state.game, rolls));
}

function updateGame(state: Bo3State, result: ActionResult): Bo3Result {
  if (!result.ok) return result;
  let next: Bo3State = { ...state, game: result.state };
  const events: Bo3Event[] = [...result.events];
  if (
    result.state.result &&
    !state.completedGames.some((g) => g.gameNumber === state.gameNumber)
  ) {
    const outcome = result.state.result;
    const wins = state.wins[outcome.winnerId]! + 1;
    next = {
      ...next,
      wins: { ...state.wins, [outcome.winnerId]: wins },
      completedGames: [
        ...state.completedGames,
        { gameNumber: state.gameNumber, result: { ...outcome } },
      ],
    };
    events.push({
      type: 'match-game-recorded',
      gameNumber: state.gameNumber,
      winnerId: outcome.winnerId,
      wins,
    });
    if (wins >= 2) {
      next = { ...next, winnerId: outcome.winnerId };
      events.push({ type: 'match-ended', winnerId: outcome.winnerId });
    }
  }
  return { ok: true, state: next, events };
}
