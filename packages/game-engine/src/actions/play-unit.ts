import type { GameState, GameAction, ActionResult } from '../types.js';
import { payCost } from '../cost/payment.js';

/** Main hors Showdown + carte en main + paiement -> unité en base Tap, ou refus atomique.
 * La Might vient du catalogue et peut valoir zéro. Les sorts ne sont pas pris en charge. */
export function playUnit(
  state: GameState,
  action: Extract<GameAction, { type: 'play-unit' }>,
): ActionResult {
  if (
    state.phase !== 'main' ||
    state.activePlayerId !== action.playerId ||
    state.showdown
  )
    return { ok: false, reason: 'PLAY_WINDOW_CLOSED' };
  const card = state.cards.find((c) => c.id === action.cardId);
  const hand = state.zones.find(
    (z) => z.kind === 'hand' && z.ownerId === action.playerId,
  );
  if (
    !card ||
    !hand ||
    card.zoneId !== hand.id ||
    card.ownerId !== action.playerId
  )
    return { ok: false, reason: 'CARD_NOT_IN_HAND' };
  const definition = state.unitDefinitions?.find(
    (d) => d.id === card.definitionId,
  );
  if (!definition || definition.type !== 'unit')
    return { ok: false, reason: 'UNKNOWN_UNIT_DEFINITION' };
  const base = state.zones.find(
    (z) => z.kind === 'base' && z.ownerId === action.playerId,
  );
  if (!base) return { ok: false, reason: 'MISSING_BASE' };
  const payment = payCost(
    state,
    action.playerId,
    definition.cost,
    action.payment,
  );
  if (!payment.ok) return payment;
  return {
    ok: true,
    state: {
      ...payment.state,
      cards: payment.state.cards.filter((c) => c.id !== card.id),
      units: [
        ...state.units,
        {
          id: card.id,
          definitionId: card.definitionId,
          ownerId: card.ownerId,
          zoneId: base.id,
          ready: false,
          might: definition.might,
          damage: 0,
        },
      ],
    },
    events: [
      {
        type: 'cost-paid',
        playerId: action.playerId,
        cardId: card.id,
        energy: definition.cost.energy,
        power: { ...definition.cost.power },
      },
      {
        type: 'unit-played',
        playerId: action.playerId,
        unitId: card.id,
        definitionId: definition.id,
        zoneId: base.id,
      },
    ],
  };
}
