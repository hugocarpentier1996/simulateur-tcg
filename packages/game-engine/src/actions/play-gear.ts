import type { ActionResult, GameAction, GameState } from '../types.js';
import { payCost } from '../cost/payment.js';

/** Main active hors Showdown + instance en main -> coût payé, gear Ready en base.
 * Refus atomique si mauvaise fenêtre/carte/catalogue/base ou paiement invalide.
 * Cette pose ne déclenche pas de capacité ; seules les auras continues sont prises en charge. */
export function playGear(
  state: GameState,
  action: Extract<GameAction, { type: 'play-gear' }>,
): ActionResult {
  if (
    state.phase !== 'main' ||
    state.activePlayerId !== action.playerId ||
    state.showdown
  )
    return { ok: false, reason: 'PLAY_WINDOW_CLOSED' };
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
  const definition = state.gearDefinitions?.find(
    (d) => d.id === card.definitionId,
  );
  if (!definition) return { ok: false, reason: 'UNKNOWN_GEAR_DEFINITION' };
  const base = state.zones.find(
    (z) => z.kind === 'base' && z.ownerId === action.playerId,
  );
  if (!base) return { ok: false, reason: 'MISSING_BASE' };
  const paid = payCost(state, action.playerId, definition.cost, action.payment);
  if (!paid.ok) return paid;
  return {
    ok: true,
    state: {
      ...paid.state,
      cards: paid.state.cards.filter((c) => c.id !== card.id),
      gears: [
        ...(state.gears ?? []),
        {
          id: card.id,
          definitionId: card.definitionId,
          ownerId: card.ownerId,
          zoneId: base.id,
          ready: true,
        },
      ],
    },
    events: [
      {
        type: 'cost-paid',
        playerId: action.playerId,
        cardId: card.id,
        ...definition.cost,
      },
      {
        type: 'gear-played',
        playerId: action.playerId,
        gearId: card.id,
        zoneId: base.id,
      },
    ],
  };
}
