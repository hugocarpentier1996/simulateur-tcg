import { playTargetChoices } from '../effects/play-targets.js';
import type { PlayEffectEntry } from '../effects/play-effect.js';
import type { GameState, GameAction, ActionResult } from '../types.js';
import {
  recoverableSpells,
  type ReturnSpellEntry,
} from '../effects/return-spell.js';
import type { UnitPlayEntry } from '../effects/unit-play.js';
import { payCost } from '../cost/payment.js';
import { canSummonAt } from './unit-destination.js';

/** Main hors Showdown + carte en main/zone champion + paiement -> unité Tap, sauf entersReady.
 * Destination : base propre par défaut, ou champ contrôlé ; refus atomique sinon.
 * onPlayBattlefieldDamage empile la capacité après la mise en jeu, sans dégâts immédiats.
 * Le chosen champion suit le coût du catalogue et quitte sa zone comme une carte en main. */
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
  const source = state.zones.find(
    (z) =>
      z.id === card?.zoneId &&
      ['hand', 'champion'].includes(z.kind) &&
      z.ownerId === action.playerId,
  );
  if (!card || !source || card.ownerId !== action.playerId)
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
  const destinationId = action.destinationId ?? base.id;
  const openField =
    definition.canPlayToOpenBattlefield &&
    state.battlefields.some((f) => f.zoneId === destinationId) &&
    state.zones.some(
      (z) => z.id === destinationId && z.kind === 'battlefield',
    ) &&
    !state.units.some((u) => u.zoneId === destinationId);
  if (!canSummonAt(state, action.playerId, destinationId) && !openField)
    return { ok: false, reason: 'INVALID_SUMMON_DESTINATION' };
  const entries: (ReturnSpellEntry | UnitPlayEntry | PlayEffectEntry)[] = [];
  if (
    !playTargetChoices(state, card.id, definition, destinationId).includes(
      action.onPlayTargetId,
    )
  )
    return { ok: false, reason: 'INVALID_TARGET' };
  if (definition.onPlayMoveToBase)
    entries.push({
      kind: 'play-effect',
      sourceId: card.id,
      ownerId: card.ownerId,
      effect: {
        type: 'move-to-base',
        ...(action.onPlayTargetId ? { targetId: action.onPlayTargetId } : {}),
      },
    });
  if (definition.onPlayReadyOther)
    entries.push({
      kind: 'play-effect',
      sourceId: card.id,
      ownerId: card.ownerId,
      effect: {
        type: 'ready-other',
        ...(action.onPlayTargetId ? { targetId: action.onPlayTargetId } : {}),
      },
    });
  if (definition.onPlayEffect)
    entries.push({
      kind: 'play-effect',
      sourceId: card.id,
      ownerId: card.ownerId,
      effect: definition.onPlayEffect,
    });
  if (definition.onPlayReturnSpell) {
    const choices = recoverableSpells(state, action.playerId);
    if (
      action.returnSpellId
        ? !choices.includes(action.returnSpellId)
        : choices.length > 0
    )
      return { ok: false, reason: 'INVALID_RETURN_SPELL' };
    entries.push({
      kind: 'return-spell',
      sourceId: card.id,
      ownerId: card.ownerId,
      ...(action.returnSpellId ? { targetId: action.returnSpellId } : {}),
    });
  }
  if (definition.onPlayBattlefieldDamage !== undefined)
    entries.push({
      kind: 'unit-play',
      sourceId: card.id,
      ownerId: card.ownerId,
      amount: definition.onPlayBattlefieldDamage,
    });
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
      ...(openField
        ? {
            pendingShowdowns: [
              ...(state.pendingShowdowns ?? []),
              { battlefieldId: destinationId, initiatorId: action.playerId },
            ],
          }
        : {}),
      ...(entries.length
        ? {
            stack: {
              entries,
              initiatorId: action.playerId,
              priorityPlayerId: state.activePlayerId,
              consecutivePasses: 0,
            },
          }
        : {}),
      cards: payment.state.cards.filter((c) => c.id !== card.id),
      units: [
        ...state.units,
        {
          id: card.id,
          definitionId: card.definitionId,
          ownerId: card.ownerId,
          zoneId: destinationId,
          ready: definition.entersReady === true,
          might: definition.might,
          ...(definition.tank ? { tank: true } : {}),
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
        zoneId: destinationId,
      },
      ...(entries.length
        ? [{ type: 'unit-play-effect-queued' as const, sourceId: card.id }]
        : []),
    ],
  };
}
