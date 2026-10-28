import type { GameState } from '../types.js';
import type { SpellBlueprint } from '../spell-types.js';
/** État + joueur + timing imprimé -> fenêtre/priorité autorisée ; aucun effet ni paiement. */

export function canUseTiming(
  state: GameState,
  playerId: string,
  timing: SpellBlueprint['timing'],
): boolean {
  if (state.stack)
    return timing === 'reaction' && state.stack.priorityPlayerId === playerId;
  if (state.showdown)
    return (
      timing !== 'normal' &&
      state.showdown.priorityPlayerId === playerId &&
      (state.showdown.kind === 'open' || state.showdown.stage === 'priority')
    );
  return (
    state.phase === 'main' &&
    state.activePlayerId === playerId &&
    (state.priorityPlayerId ?? playerId) === playerId
  );
}
