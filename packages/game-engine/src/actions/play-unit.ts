import { trashUnitChoices } from '../effects/play-from-trash.js';
import { spendBuff } from '../effects/buff.js';
import { canUseTiming } from './timing.js';
import {
  choicesHere,
  hiddenFree,
  playableFacedown,
} from '../effects/hidden.js';
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
  const costUnits = action.costUnitIds ?? [];
  if (
    costUnits.length &&
    !costUnitChoices(state, action.playerId, action.cardId, definition).some(
      (choice) => sameIds(choice, costUnits),
    )
  )
    return { ok: false, reason: 'INVALID_ADDITIONAL_COST' };
  let played = playUnitCore(state, action);
  if (played.ok && costUnits.length) {
    if (definition?.unitCostReduction?.kind === 'spend-buff') {
      let next = played.state;
      for (const id of costUnits) next = spendBuff(next, id) ?? next;
      played = { ...played, state: next };
    } else {
      const killed = settleLethalUnits(played.state, new Set(costUnits));
      played = {
        ok: true,
        state: killed.state,
        events: [...played.events, ...killed.events],
      };
    }
  }
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
  const card = state.cards.find((c) => c.id === action.cardId);
  // Hidden : jouée depuis facedown à vitesse Réaction, gratuite, sur son champ.
  const hiddenField = playableFacedown(state, card, action.playerId);
  const reactionUnit = state.unitDefinitions?.find(
    (d) => d.id === card?.definitionId,
  )?.reactionTiming;
  if (
    hiddenField || reactionUnit
      ? !canUseTiming(state, action.playerId, 'reaction')
      : state.phase !== 'main' ||
        state.activePlayerId !== action.playerId ||
        state.showdown
  )
    return { ok: false, reason: 'PLAY_WINDOW_CLOSED' };
  const source = state.zones.find(
    (z) =>
      z.id === card?.zoneId &&
      ['hand', 'champion'].includes(z.kind) &&
      z.ownerId === action.playerId,
  );
  if (!card || (!source && !hiddenField) || card.ownerId !== action.playerId)
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
  const destinationId = hiddenField ?? action.destinationId ?? base.id;
  if (hiddenField && (action.destinationId ?? hiddenField) !== hiddenField)
    return { ok: false, reason: 'INVALID_SUMMON_DESTINATION' };
  if (
    !hiddenField &&
    destinationId !== base.id &&
    wardenAgainst(state, action.playerId)
  )
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
  if (
    !hiddenField &&
    !canSummonAt(state, action.playerId, destinationId) &&
    !contested
  )
    return { ok: false, reason: 'INVALID_SUMMON_DESTINATION' };
  if (hiddenField && !choicesHere(state, [action.onPlayTargetId], hiddenField))
    return { ok: false, reason: 'INVALID_TARGET' };
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
  const selected = action.onPlaySelectedIds ?? [];
  if (
    selected.length &&
    !buffOthersChoices(state, action.playerId, card.id, definition).some(
      (choice) => sameIds(choice, selected),
    )
  )
    return { ok: false, reason: 'INVALID_TARGET' };
  if (definition.onPlaySpendBuffsChannel && selected.length)
    entries.push({
      kind: 'play-effect',
      sourceId: card.id,
      ownerId: card.ownerId,
      effect: { type: 'spend-buffs-channel', unitIds: [...selected] },
    });
  if (definition.onPlayBuffOthers && selected.length)
    entries.push({
      kind: 'play-effect',
      sourceId: card.id,
      ownerId: card.ownerId,
      effect: { type: 'buff-units', unitIds: [...selected] },
    });
  if (
    definition.onPlayVision ||
    state.units.some(
      (u) =>
        u.ownerId === action.playerId &&
        state.unitDefinitions?.find((d) => d.id === u.definitionId)
          ?.alliesHaveVision,
    )
  )
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
  if (definition.onPlayFromTrash) {
    if (
      action.returnSpellId &&
      !trashUnitChoices(
        state,
        action.playerId,
        definition.onPlayFromTrash,
      ).includes(action.returnSpellId)
    )
      return { ok: false, reason: 'INVALID_RETURN_SPELL' };
    if (action.returnSpellId)
      entries.push({
        kind: 'play-effect',
        sourceId: card.id,
        ownerId: card.ownerId,
        effect: { type: 'play-from-trash', cardId: action.returnSpellId },
      });
  }
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
    hiddenFree(
      card,
      unitCost(
        state,
        action.playerId,
        definition,
        action.accelerate === true,
        action.optionalCost === true,
        action.discardCardId !== undefined,
        action.costUnitIds?.length ?? 0,
      ),
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
              entries: [...(state.stack?.entries ?? []), ...entries],
              initiatorId: state.stack?.initiatorId ?? action.playerId,
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
            (definition.entersReadyIfOpponentControls === true &&
              state.battlefields.some(
                (f) => f.controllerId && f.controllerId !== card.ownerId,
              )) ||
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
  costUnits = 0,
): UnitBlueprint['cost'] {
  const printed = accelerate ? acceleratedCost(definition) : definition.cost;
  const reducedColor = definition.unitCostReduction?.power;
  const base =
    reducedColor && costUnits
      ? {
          ...printed,
          power: {
            ...printed.power,
            [reducedColor]: Math.max(
              0,
              (printed.power[reducedColor] ?? 0) - costUnits,
            ),
          },
        }
      : printed;
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

/** Sélections de mise en jeu, dans l'ordre du plateau, vide comprise : Kinkou Monk, au plus
 * onPlayBuffOthers autres unités alliées ; Albus Ferros, toute sélection d'alliées buffées.
 * Sans capacité de sélection : seule la sélection vide. */
export function buffOthersChoices(
  state: GameState,
  playerId: string,
  sourceId: string,
  definition: UnitBlueprint,
): string[][] {
  const spending = definition.onPlaySpendBuffsChannel === true;
  const allies = state.units
    .filter(
      (u) =>
        u.ownerId === playerId && u.id !== sourceId && (!spending || u.buffed),
    )
    .map((u) => u.id);
  const max = spending ? allies.length : (definition.onPlayBuffOthers ?? 0);
  const pick = (from: number, size: number): string[][] =>
    size === 0
      ? [[]]
      : allies
          .slice(from)
          .flatMap((id, i) =>
            pick(from + i + 1, size - 1).map((rest) => [id, ...rest]),
          );
  return Array.from({ length: max + 1 }, (_, size) => pick(0, size)).flat();
}

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

/** Coûts sur unités alliées (unitCostReduction) : sous-ensembles, vide compris, d'au plus
 * autant d'unités que de Power réductible ; spend-buff : alliées buffées seulement. */
export function costUnitChoices(
  state: GameState,
  playerId: string,
  cardId: string,
  definition: UnitBlueprint | undefined,
): string[][] {
  const reduction = definition?.unitCostReduction;
  if (!reduction) return [[]];
  const max = definition.cost.power[reduction.power] ?? 0;
  const ids = state.units
    .filter(
      (u) =>
        u.ownerId === playerId &&
        u.id !== cardId &&
        (reduction.kind !== 'spend-buff' || u.buffed),
    )
    .map((u) => u.id);
  const pick = (from: number, size: number): string[][] =>
    size === 0
      ? [[]]
      : ids
          .slice(from)
          .flatMap((id, i) =>
            pick(from + i + 1, size - 1).map((rest) => [id, ...rest]),
          );
  return Array.from({ length: Math.min(max, ids.length) + 1 }, (_, size) =>
    pick(0, size),
  ).flat();
}
