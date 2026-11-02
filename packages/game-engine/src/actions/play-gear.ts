import { hiddenFree, playableFacedown } from '../effects/hidden.js';
import { canUseTiming } from './timing.js';
import { summonToken } from '../effects/summon-token.js';
import { buffUnit } from '../effects/buff.js';
import type { ActionResult, GameAction, GameState } from '../types.js';
import { payCost } from '../cost/payment.js';

/** Main active hors Showdown + instance en main -> coût payé, gear Ready en base.
 * Refus atomique si mauvaise fenêtre/carte/catalogue/base ou paiement invalide.
 * Les capacités déclenchées par la pose (Pit Crew) sont empilées par act. */
export function playGear(
  state: GameState,
  action: Extract<GameAction, { type: 'play-gear' }>,
): ActionResult {
  // Hidden : posé depuis facedown à vitesse Réaction, gratuitement, dans la base.
  const hidden = playableFacedown(
    state,
    state.cards.find((c) => c.id === action.cardId),
    action.playerId,
  );
  if (
    hidden
      ? !canUseTiming(state, action.playerId, 'reaction')
      : state.phase !== 'main' ||
        state.activePlayerId !== action.playerId ||
        state.showdown
  )
    return { ok: false, reason: 'PLAY_WINDOW_CLOSED' };
  const card = state.cards.find(
    (c) =>
      c.id === action.cardId &&
      c.ownerId === action.playerId &&
      (hidden ||
        state.zones.some(
          (z) =>
            z.id === c.zoneId &&
            z.kind === 'hand' &&
            z.ownerId === action.playerId,
        )),
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
  const buffTarget = state.units.find(
    (u) => u.id === action.targetId && u.ownerId === action.playerId,
  );
  const allies = state.units.some((u) => u.ownerId === action.playerId);
  if (
    definition.onPlayBuffAlly
      ? allies
        ? !buffTarget
        : action.targetId !== undefined
      : action.targetId !== undefined
  )
    return { ok: false, reason: 'INVALID_TARGET' };
  const charged = payCost(
    state,
    action.playerId,
    hiddenFree(card, definition.cost),
    action.payment,
  );
  if (!charged.ok) return charged;
  const buffed = buffTarget
    ? { ...charged, state: buffUnit(charged.state, buffTarget.id) }
    : charged;
  const summoned = definition.onPlaySummonBase
    ? summonToken(
        buffed.state,
        action.playerId,
        base.id,
        definition.onPlaySummonBase,
        'here',
      )
    : undefined;
  const paid = summoned ? { ...buffed, state: summoned.state } : buffed;
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
          ready: !definition.entersExhausted,
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
