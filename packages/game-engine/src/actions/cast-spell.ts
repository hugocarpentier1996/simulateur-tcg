import type { ActionResult, GameAction, GameState } from '../types.js';
import type { SpellBlueprint } from '../spell-types.js';
import { payCost } from '../cost/payment.js';
import { spellTarget, validDestination } from '../effects/target.js';

/** Intention de lancement -> coût payé et sort empilé, sans appliquer ses effets.
 * Refuse timing/priorité, cible/destination, carte absente ou paiement invalide sans mutation.
 * Prototype 1v1 : toutes les zones nécessaires, dont les cimetières, doivent exister. */
export function castSpell(
  state: GameState,
  action: Extract<GameAction, { type: 'cast-spell' }>,
): ActionResult {
  if (state.players.length !== 2)
    return { ok: false, reason: 'UNSUPPORTED_MODE' };
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
  const definition = state.spellDefinitions?.find(
    (d) => d.id === card.definitionId,
  );
  if (!definition) return { ok: false, reason: 'UNKNOWN_SPELL_DEFINITION' };
  if (!canCast(state, action.playerId, definition))
    return { ok: false, reason: 'SPELL_WINDOW_CLOSED' };
  const target = spellTarget(state, definition, action.targetId);
  if (!target) return { ok: false, reason: 'INVALID_TARGET' };
  if (
    definition.effects.some((e) => e.type === 'move-unit') &&
    !validDestination(state, target, action.destinationId)
  )
    return { ok: false, reason: 'UNSUPPORTED_DESTINATION' };
  if (
    !state.zones.some(
      (z) => z.kind === 'graveyard' && z.ownerId === card.ownerId,
    )
  )
    return { ok: false, reason: 'MISSING_GRAVEYARD' };
  const paid = payCost(state, action.playerId, definition.cost, action.payment);
  if (!paid.ok) return paid;
  return {
    ok: true,
    state: {
      ...paid.state,
      cards: paid.state.cards.filter((c) => c.id !== card.id),
      stack: {
        entries: [
          ...(state.stack?.entries ?? []),
          {
            card,
            definition,
            casterId: action.playerId,
            targetId: action.targetId,
            ...(action.destinationId
              ? { destinationId: action.destinationId }
              : {}),
          },
        ],
        initiatorId: state.stack?.initiatorId ?? action.playerId,
        priorityPlayerId: state.showdown?.initiatorId ?? state.activePlayerId,
        consecutivePasses: 0,
      },
    },
    events: [
      {
        type: 'cost-paid',
        playerId: action.playerId,
        cardId: card.id,
        ...definition.cost,
      },
      {
        type: 'spell-cast',
        playerId: action.playerId,
        cardId: card.id,
        targetId: action.targetId,
      },
    ],
  };
}

function canCast(
  state: GameState,
  playerId: string,
  definition: SpellBlueprint,
): boolean {
  if (state.stack)
    return (
      definition.timing === 'reaction' &&
      state.stack.priorityPlayerId === playerId
    );
  if (state.showdown)
    return (
      definition.timing !== 'normal' &&
      state.showdown.priorityPlayerId === playerId &&
      (state.showdown.kind === 'open' || state.showdown.stage === 'priority')
    );
  return (
    state.phase === 'main' &&
    state.activePlayerId === playerId &&
    (state.priorityPlayerId ?? playerId) === playerId
  );
}
