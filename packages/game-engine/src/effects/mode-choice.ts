import type { ActionResult, GameAction, GameState } from '../types.js';
import { drawCardForPlayer } from '../turn/draw.js';
import { channelForPlayer } from '../turn/supplies.js';
import { continueStack } from '../actions/continue-stack.js';

/** Mode proposé par une capacité « X ou Y » : pioche 1, ou canalise 1 rune Tap. */
export type EffectMode = 'draw' | 'channel-exhausted';

export interface ModeChoiceEntry {
  kind: 'mode-choice';
  sourceId: string;
  ownerId: string;
  modes: readonly EffectMode[];
}

/** Capacité dépilée après réactions -> choix du mode par son propriétaire, sans fenêtre. */
export function resolveModeChoice(
  state: GameState,
  entry: ModeChoiceEntry,
): Extract<ActionResult, { ok: true }> {
  return {
    ok: true,
    state: { ...state, pendingModeChoice: entry },
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
  const applied =
    action.mode === 'draw'
      ? drawCardForPlayer(cleared, pending.ownerId)
      : channelForPlayer(cleared, pending.ownerId, 1);
  return continueStack(applied.state, [
    ...applied.events,
    { type: 'legend-effect-resolved', sourceId: pending.sourceId },
  ]);
}
