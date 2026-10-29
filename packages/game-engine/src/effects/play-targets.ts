import { withDeflect } from '../cost/deflect.js';
import { findPayment } from '../legal/payment.js';
import type { GameState, UnitBlueprint } from '../types.js';
/** Mise en jeu prévue -> choix de cible avant paiement et réactions ; undefined seulement sans cible payable. */
export function playTargetChoices(
  state: GameState,
  sourceId: string,
  definition: UnitBlueprint,
  destinationId?: string,
): (string | undefined)[] {
  const playerId =
    state.cards.find((c) => c.id === sourceId)?.ownerId ?? state.activePlayerId;
  const payable = (ids: string[]): (string | undefined)[] => {
    const valid = ids.filter(
      (id) =>
        findPayment(
          state,
          playerId,
          withDeflect(state, playerId, definition.cost, [id]),
        ) !== null,
    );
    return valid.length ? valid : [undefined];
  };
  if (definition.onPlayMoveToBase) {
    const ids = state.units
      .filter((u) => state.battlefields.some((f) => f.zoneId === u.zoneId))
      .map((u) => u.id);
    if (state.battlefields.some((f) => f.zoneId === destinationId))
      ids.push(sourceId);
    return payable(ids);
  }
  if (!definition.onPlayReadyOther) return [undefined];
  const ids = state.units.filter((u) => u.id !== sourceId).map((u) => u.id);
  return payable(ids);
}
