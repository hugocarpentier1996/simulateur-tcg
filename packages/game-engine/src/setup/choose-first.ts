import type {
  ActionResult,
  GameAction,
  GameEvent,
  GameState,
} from '../types.js';
import { drawCardForPlayer } from '../turn/draw.js';

/** Choix du gagnant des dés -> premier joueur fixé, bonus au second et quatre cartes chacun.
 * Refuse hors fenêtre, mauvais décideur ou premier joueur absent ; ne démarre pas encore le tour. */
export function chooseFirstPlayer(
  state: GameState,
  action: Extract<GameAction, { type: 'choose-first-player' }>,
): ActionResult {
  if (state.setup?.stage !== 'choose-first')
    return { ok: false, reason: 'NO_FIRST_PLAYER_CHOICE' };
  if (state.setup.chooserId !== action.playerId)
    return { ok: false, reason: 'NOT_DICE_WINNER' };
  if (!state.players.some((p) => p.id === action.firstPlayerId))
    return { ok: false, reason: 'UNKNOWN_PLAYER' };
  let current: GameState = {
    ...state,
    activePlayerId: action.firstPlayerId,
    initialChannelBonusPlayerId: state.players.find(
      (p) => p.id !== action.firstPlayerId,
    )!.id,
    setup: { stage: 'mulligan', completedPlayerIds: [] },
  };
  const events: GameEvent[] = [
    {
      type: 'first-player-chosen',
      playerId: action.playerId,
      firstPlayerId: action.firstPlayerId,
    },
  ];
  for (const player of state.players) {
    for (let i = 0; i < 4 && !current.result; i++) {
      const drawn = drawCardForPlayer(current, player.id);
      current = drawn.state;
      events.push(...drawn.events);
    }
  }
  return { ok: true, state: current, events };
}
