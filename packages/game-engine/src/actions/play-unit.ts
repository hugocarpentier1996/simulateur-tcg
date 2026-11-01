import { settleLethalUnits } from '../effects/lethal-units.js';
import { activeLegends } from '../effects/legends.js';
import { victoryTarget } from '../scoring/victory-target.js';
import { alliesEnterReady, wardenAgainst } from '../effects/unit-aura.js';
import { withDeflect } from '../cost/deflect.js';
import { playTargetChoices } from '../effects/play-targets.js';
import type { PlayEffectEntry } from '../effects/play-effect.js';
import type {
  GameState,
  GameAction,
  ActionResult,
  UnitBlueprint,
} from '../types.js';
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
  const definition = state.unitDefinitions?.find(
    (d) =>
      d.id === state.cards.find((c) => c.id === action.cardId)?.definitionId,
  );
  const sacrifice = state.units.find(
    (u) => u.id === action.sacrificeUnitId && u.ownerId === action.playerId,
  );
  if (
    action.sacrificeUnitId !== undefined &&
    (!definition?.sacrificeCost || !sacrifice)
  )
    return { ok: false, reason: 'INVALID_ADDITIONAL_COST' };
  if (definition?.sacrificeCost && !sacrifice)
    return { ok: false, reason: 'INVALID_ADDITIONAL_COST' };
  if (
    action.discardCardId !== undefined &&
    (!definition?.discardDiscount ||
      !handCards(state, action.playerId, action.cardId).includes(
        action.discardCardId,
      ))
  )
    return { ok: false, reason: 'INVALID_ADDITIONAL_COST' };
  let played = playUnitCore(state, action);
  if (played.ok && action.discardCardId) {
    const grave = played.state.zones.find(
      (z) => z.kind === 'graveyard' && z.ownerId === action.playerId,
    );
    if (!grave) return { ok: false, reason: 'MISSING_GRAVEYARD' };
    played = {
      ok: true,
      state: {
        ...played.state,
        cards: played.state.cards.map((c) =>
          c.id === action.discardCardId ? { ...c, zoneId: grave.id } : c,
        ),
      },
      events: [
        ...played.events,
        {
          type: 'card-discarded',
          playerId: action.playerId,
          cardId: action.discardCardId,
        },
      ],
    };
  }
  if (!played.ok || !sacrifice) return played;
  // Coût supplémentaire payé avec le reste : l'unité sacrifiée meurt (effets de mort compris).
  const killed = settleLethalUnits(played.state, new Set([sacrifice.id]));
  return {
    ok: true,
    state: killed.state,
    events: [...played.events, ...killed.events],
  };
}

function playUnitCore(
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
  if (destinationId !== base.id && wardenAgainst(state, action.playerId))
    return { ok: false, reason: 'INVALID_SUMMON_DESTINATION' };
  const openField =
    (definition.canPlayToOpenBattlefield ||
      state.units.some(
        (u) =>
          u.ownerId === action.playerId &&
          state.unitDefinitions?.find((d) => d.id === u.definitionId)
            ?.alliesCanPlayToOpenBattlefield,
      )) &&
    state.battlefields.some((f) => f.zoneId === destinationId) &&
    state.zones.some(
      (z) => z.id === destinationId && z.kind === 'battlefield',
    ) &&
    !state.units.some((u) => u.zoneId === destinationId);
  const enemyField =
    definition.canPlayToOccupiedEnemyBattlefield === true &&
    state.battlefields.some((f) => f.zoneId === destinationId) &&
    state.units.some(
      (u) => u.zoneId === destinationId && u.ownerId !== action.playerId,
    );
  const contested = openField || enemyField;
  if (!canSummonAt(state, action.playerId, destinationId) && !contested)
    return { ok: false, reason: 'INVALID_SUMMON_DESTINATION' };
  const entries: (ReturnSpellEntry | UnitPlayEntry | PlayEffectEntry)[] = [];
  if (
    !playTargetChoices(state, card.id, definition, destinationId).includes(
      action.onPlayTargetId,
    )
  )
    return { ok: false, reason: 'INVALID_TARGET' };
  if (
    definition.onPlaySummonHere &&
    !(
      definition.onPlaySummonHereLegion &&
      !state.cardsPlayedThisTurn?.[action.playerId]
    )
  )
    for (let i = 0; i < (definition.onPlaySummonHereCount ?? 1); i++)
      entries.push({
        kind: 'play-effect',
        sourceId: card.id,
        ownerId: card.ownerId,
        effect: {
          type: 'summon-here',
          destinationId,
          definitionId: definition.onPlaySummonHere,
        },
      });
  if (definition.onPlayVision)
    entries.push({
      kind: 'play-effect',
      sourceId: card.id,
      ownerId: card.ownerId,
      effect: { type: 'vision' },
    });
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
  if (
    definition.onPlayTargetEffect &&
    !(
      definition.onPlayTargetEffect.legion &&
      !state.cardsPlayedThisTurn?.[action.playerId]
    )
  )
    entries.push({
      kind: 'play-effect',
      sourceId: card.id,
      ownerId: card.ownerId,
      effect: {
        type: 'targeted',
        effect: definition.onPlayTargetEffect.effect,
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
  if (
    definition.onPlayEffect &&
    !(
      (definition.onPlayEffect.type === 'discard' ||
        definition.onPlayEffect.type === 'buff-self') &&
      definition.onPlayEffect.legion &&
      !(state.cardsPlayedThisTurn?.[action.playerId] ?? 0)
    )
  )
    entries.push({
      kind: 'play-effect',
      sourceId: card.id,
      ownerId: card.ownerId,
      effect: definition.onPlayEffect,
    });
  if (definition.onPlayReturnSpell || definition.onPlayReturnUnit) {
    const cardKind = definition.onPlayReturnUnit ? 'unit' : 'spell';
    const choices = recoverableSpells(state, action.playerId, cardKind);
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
      ...(cardKind === 'unit' ? { cardKind } : {}),
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
  // Relentless Storm : unité Mighty jouée -> légende Ready couchée, canalisation empilée.
  const storm =
    definition.might >= 5
      ? activeLegends(state, action.playerId).find(
          (l) => l.definition.mightyPlayChannel && l.card.ready !== false,
        )
      : undefined;
  if (storm)
    entries.push({
      kind: 'play-effect',
      sourceId: storm.card.id,
      ownerId: action.playerId,
      effect: {
        type: 'channel-exhausted',
        count: storm.definition.mightyPlayChannel!,
      },
    });
  if (action.optionalCost && !definition.optionalCost)
    return { ok: false, reason: 'NO_OPTIONAL_COST' };
  if (action.optionalCost && definition.optionalCost)
    entries.push({
      kind: 'play-effect',
      sourceId: card.id,
      ownerId: card.ownerId,
      effect: { type: 'draw', count: definition.optionalCost.draw },
    });
  if (action.accelerate && !definition.accelerate)
    return { ok: false, reason: 'NO_ACCELERATE' };
  const cost = withDeflect(
    state,
    action.playerId,
    unitCost(
      state,
      action.playerId,
      definition,
      action.accelerate === true,
      action.optionalCost === true,
      action.discardCardId !== undefined,
    ),
    action.onPlayTargetId ? [action.onPlayTargetId] : [],
  );
  const payment = payCost(state, action.playerId, cost, action.payment);
  if (!payment.ok) return payment;
  return {
    ok: true,
    state: {
      ...payment.state,
      ...(contested
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
      cards: payment.state.cards
        .filter((c) => c.id !== card.id)
        .map((c) => (c.id === storm?.card.id ? { ...c, ready: false } : c)),
      units: [
        ...state.units.map((u) =>
          u.ownerId === action.playerId &&
          !u.buffed &&
          state.unitDefinitions?.find((d) => d.id === u.definitionId)
            ?.buffOnAllyPlayed
            ? { ...u, buffed: true }
            : u,
        ),
        {
          id: card.id,
          definitionId: card.definitionId,
          ownerId: card.ownerId,
          zoneId: destinationId,
          ready:
            definition.entersReady === true ||
            alliesEnterReady(state, card.ownerId) ||
            (definition.entersReadyIfOpponentWithin !== undefined &&
              state.players.some(
                (p) =>
                  p.id !== card.ownerId &&
                  p.score >=
                    victoryTarget(state, p.id) -
                      definition.entersReadyIfOpponentWithin!,
              )) ||
            (definition.legionReady === true &&
              (state.cardsPlayedThisTurn?.[action.playerId] ?? 0) > 0) ||
            action.accelerate === true ||
            !!state.readyEntryPlayers?.includes(card.ownerId),
          might: definition.might,
          ...(definition.tank ? { tank: true } : {}),
          ...(definition.backline ? { backline: true } : {}),
          damage: 0,
        },
      ],
    },
    events: [
      {
        type: 'cost-paid',
        playerId: action.playerId,
        cardId: card.id,
        energy: cost.energy,
        power: { ...cost.power },
        ...(cost.genericPower ? { genericPower: cost.genericPower } : {}),
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

/** Coût imprimé + Accelerate : 1 énergie et 1 Power de la couleur indiquée en plus. */
export function acceleratedCost(
  definition: UnitBlueprint,
): UnitBlueprint['cost'] {
  const color = definition.accelerate?.power;
  if (!color) return definition.cost;
  return {
    ...definition.cost,
    energy: definition.cost.energy + 1,
    power: {
      ...definition.cost.power,
      [color]: (definition.cost.power[color] ?? 0) + 1,
    },
  };
}

/** Coût payable d'une unité : imprimé, + Accelerate si choisi, - réduction Legion si une
 * autre carte a déjà été jouée ce tour. */
export function unitCost(
  state: GameState,
  playerId: string,
  definition: UnitBlueprint,
  accelerate: boolean,
  optional = false,
  discard = false,
): UnitBlueprint['cost'] {
  const base = accelerate ? acceleratedCost(definition) : definition.cost;
  const extra = optional ? definition.optionalCost?.power : undefined;
  const cost = extra
    ? {
        ...base,
        power: { ...base.power, [extra]: (base.power[extra] ?? 0) + 1 },
      }
    : base;
  const legion =
    (state.cardsPlayedThisTurn?.[playerId] ?? 0) > 0
      ? (definition.legionEnergyReduction ?? 0)
      : 0;
  const trash = definition.energyReductionPerTrashCard
    ? definition.energyReductionPerTrashCard *
      state.cards.filter((c) =>
        state.zones.some(
          (z) =>
            z.id === c.zoneId &&
            z.kind === 'graveyard' &&
            z.ownerId === playerId,
        ),
      ).length
    : 0;
  const discount = discard ? (definition.discardDiscount ?? 0) : 0;
  const reduced =
    legion + trash + discount
      ? {
          ...cost,
          energy: Math.max(0, cost.energy - legion - trash - discount),
        }
      : cost;
  // Herald of Scales : Dragons moins chers, sans descendre sous 1.
  const dragon = definition.tags?.includes('Dragon')
    ? state.units.reduce(
        (sum, u) =>
          u.ownerId === playerId
            ? sum +
              (state.unitDefinitions?.find((d) => d.id === u.definitionId)
                ?.dragonEnergyReduction ?? 0)
            : sum,
        0,
      )
    : 0;
  return dragon
    ? {
        ...reduced,
        energy: Math.min(reduced.energy, Math.max(1, reduced.energy - dragon)),
      }
    : reduced;
}

/** Autres cartes de la main du joueur (coûts de défausse), la carte jouée exceptée. */
export function handCards(
  state: GameState,
  playerId: string,
  exceptId: string,
): string[] {
  return state.cards
    .filter(
      (c) =>
        c.id !== exceptId &&
        state.zones.some(
          (z) =>
            z.id === c.zoneId && z.kind === 'hand' && z.ownerId === playerId,
        ),
    )
    .map((c) => c.id);
}
