import {
  trashUnitChoices,
  withTrashPower,
} from '../effects/play-from-trash.js';
import { hiddenFree } from '../effects/hidden.js';
import { withTrashUnitPower } from '../cost/spell-cost.js';
import { discardChoices } from '../actions/cast-spell.js';
import { activeLegends } from '../effects/legends.js';
import { tapAbilityTargets } from '../actions/activate-gear.js';
import {
  secondaryEnemyTarget,
  stackSpellTarget,
  allyToMove,
  battlefieldUnitOrGear,
  validMightBundle,
  enemyHere,
  otherAlly,
  destinationFoe,
} from '../effects/target.js';
import { defenseShieldActions } from '../effects/defense-shield.js';
import { attackTargetActions } from '../effects/attack-targets.js';
import { withDeflect, spellChosenUnits } from '../cost/deflect.js';
import { spellCost, castCost } from '../cost/spell-cost.js';
import { playTargetChoices } from '../effects/play-targets.js';
import { endTurnChoices } from '../effects/end-runes.js';
import type { GameAction, GameState } from '../types.js';
import { act } from '../act.js';
import { canSummonAt } from '../actions/unit-destination.js';
import { recoverableSpells } from '../effects/return-spell.js';
import {
  unitCost,
  costUnitChoices,
  buffOthersChoices,
  handCards,
} from '../actions/play-unit.js';
import { findPayment } from './payment.js';
import { resolutionChoices, setupChoices } from './choices.js';

/** État serveur cohérent + joueur -> actions jouables maintenant, sans mutation ni événements.
 * Chaque candidat est validé par act : phase, priorité, cibles, contrôle et paiement font autorité.
 * Un plan de paiement par choix est proposé ; les autres plans peuvent être soumis directement.
 * Les choix privés de l'adversaire ne sont pas retournés. Les dés ne sont pas une action client.
 * Coût combinatoire pour les permutations de dégâts/effets de mort sur de grands plateaux. */
export function getLegalActions(
  state: GameState,
  playerId: string,
): GameAction[] {
  if (state.result || !state.players.some((p) => p.id === playerId)) return [];
  return [...candidates(state, playerId)]
    .flatMap((action) => optionalCosts(state, action))
    .flatMap((action) => targetPayment(state, action))
    .filter((action) => act(state, action).ok);
}

function* candidates(
  state: GameState,
  playerId: string,
): Generator<GameAction> {
  if (state.pendingHoldChannel) {
    if (state.pendingHoldChannel.ownerId === playerId) {
      yield { type: 'choose-hold-channel', playerId, accept: true };
      yield { type: 'choose-hold-channel', playerId, accept: false };
    }
    return;
  }
  if (state.pendingModeChoice) {
    if (state.pendingModeChoice.ownerId === playerId)
      for (const mode of state.pendingModeChoice.modes)
        yield { type: 'choose-mode', playerId, mode };
    return;
  }
  if (state.pendingDeaths) {
    yield* resolutionChoices(state, playerId);
    return;
  }
  if (state.pendingAttackChoices?.length) {
    yield* attackTargetActions(state, playerId);
    return;
  }
  if (state.pendingDefenseShield) {
    yield* defenseShieldActions(state, playerId);
    return;
  }
  if (state.pendingPick) {
    if (state.pendingPick.playerId === playerId)
      for (const cardId of state.pendingPick.cardIds)
        yield { type: 'choose-pick', playerId, cardId };
    return;
  }
  if (state.pendingVision) {
    if (state.pendingVision.playerId === playerId) {
      yield { type: 'choose-vision', playerId, recycle: false };
      yield { type: 'choose-vision', playerId, recycle: true };
    }
    return;
  }
  if (state.pendingDiscard) {
    if (state.pendingDiscard.playerId === playerId)
      for (const card of state.cards)
        if (
          card.ownerId === playerId &&
          state.zones.some(
            (z) =>
              z.id === card.zoneId &&
              z.kind === 'hand' &&
              z.ownerId === playerId,
          )
        )
          yield { type: 'choose-discard', playerId, cardId: card.id };
    return;
  }
  if (state.setup) {
    yield* setupChoices(state, playerId);
    return;
  }
  if (
    state.pendingDeaths ||
    (state.showdown?.kind === 'combat' && state.showdown.stage === 'damage')
  ) {
    yield* resolutionChoices(state, playerId);
    return;
  }
  yield { type: 'pass', playerId };
  yield* endTurnChoices(state, playerId);
  const destinations = state.zones.filter(
    (z) => z.kind === 'base' || z.kind === 'battlefield',
  );
  for (const unit of state.units) {
    yield { type: 'activate-spell-energy', playerId, unitId: unit.id };
    if (unit.buffed && unit.ownerId === playerId)
      yield { type: 'spend-buff-ability', playerId, unitId: unit.id };
    if (
      unit.ownerId === playerId &&
      state.unitDefinitions?.find((d) => d.id === unit.definitionId)
        ?.trashRecycleMight
    )
      for (const card of state.cards.filter((c) =>
        state.zones.some(
          (z) =>
            z.id === c.zoneId &&
            z.kind === 'graveyard' &&
            z.ownerId === playerId,
        ),
      ))
        yield {
          type: 'trash-recycle-ability',
          playerId,
          unitId: unit.id,
          cardId: card.id,
        };
  }
  // Capacités Tap ciblées des gears et de la légende du joueur.
  for (const gear of [
    ...(state.gears ?? []).map((g) => ({
      ...g,
      ability: state.gearDefinitions?.find((d) => d.id === g.definitionId)
        ?.tapAbility,
    })),
    ...state.units
      .filter(
        (u) =>
          !state.unitDefinitions?.find((d) => d.id === u.definitionId)
            ?.tapAbility?.requiresBattlefield ||
          state.battlefields.some((f) => f.zoneId === u.zoneId),
      )
      .map((u) => ({
        id: u.id,
        ownerId: u.ownerId,
        ready: u.ready,
        ability: state.unitDefinitions?.find((d) => d.id === u.definitionId)
          ?.tapAbility,
      })),
    ...activeLegends(state, playerId).map((l) => ({
      id: l.card.id,
      ownerId: l.card.ownerId,
      ready: l.card.ready !== false,
      ability: l.definition.tapAbility,
    })),
  ]) {
    const ability = gear.ability;
    if (!ability || gear.ownerId !== playerId || !gear.ready) continue;
    for (const targetId of ability.effect.type === 'summon-base' ||
    ability.effect.type === 'kill-self' ||
    ability.effect.type === 'draw' ||
    ability.effect.type === 'next-unit-ready'
      ? [undefined]
      : tapAbilityTargets(state, playerId, ability)) {
      const payment = findPayment(
        state,
        playerId,
        withDeflect(
          state,
          playerId,
          ability.cost ?? { energy: 0, power: {} },
          targetId ? [targetId] : [],
        ),
      );
      if (payment)
        yield {
          type: 'activate-gear',
          playerId,
          gearId: gear.id,
          ...(targetId ? { targetId } : {}),
          payment,
        };
    }
  }
  for (const unit of state.units)
    for (const destination of destinations)
      yield {
        type: 'move',
        playerId,
        unitId: unit.id,
        destinationId: destination.id,
      };
  // Hidden : chaque carte Hidden de la main peut être cachée sur un champ contrôlé.
  const hidePayment = findPayment(state, playerId, {
    energy: 0,
    power: {},
    genericPower: 1,
  });
  if (hidePayment)
    for (const card of state.cards.filter((c) => c.ownerId === playerId))
      for (const field of state.battlefields)
        yield {
          type: 'hide-card',
          playerId,
          cardId: card.id,
          battlefieldId: field.zoneId,
          payment: hidePayment,
        };
  for (const card of state.cards.filter((c) => c.ownerId === playerId)) {
    const unit = state.unitDefinitions?.find((d) => d.id === card.definitionId);
    if (unit) {
      for (const [accelerate, optionalCost, discard] of [
        [false, false],
        ...(unit.accelerate ? [[true, false]] : []),
        ...(unit.optionalCost ? [[false, true]] : []),
        ...(unit.accelerate && unit.optionalCost ? [[true, true]] : []),
      ].flatMap(([a, o]) =>
        unit.discardDiscount
          ? [
              [a, o, false],
              [a, o, true],
            ]
          : [[a, o, false]],
      ) as [boolean, boolean, boolean][]) {
        const payment = findPayment(
          state,
          playerId,
          hiddenFree(
            card,
            unitCost(state, playerId, unit, accelerate, optionalCost, discard),
          ),
        );
        for (const costUnitIds of costUnitChoices(
          state,
          playerId,
          card.id,
          unit,
        )) {
          const reducedPayment = costUnitIds.length
            ? findPayment(
                state,
                playerId,
                hiddenFree(
                  card,
                  unitCost(
                    state,
                    playerId,
                    unit,
                    accelerate,
                    optionalCost,
                    discard,
                    costUnitIds.length,
                  ),
                ),
              )
            : payment;
          if (reducedPayment)
            for (const discardCardId of discard
              ? handCards(state, playerId, card.id)
              : [undefined])
              for (const zone of destinations)
                for (const onPlaySelectedIds of buffOthersChoices(
                  state,
                  playerId,
                  card.id,
                  unit,
                ))
                  for (const onPlayTargetId of playTargetChoices(
                    state,
                    card.id,
                    unit,
                    zone.id,
                  ))
                    for (const returnSpellId of unit.onPlayFromTrash
                      ? [
                          undefined,
                          ...trashUnitChoices(
                            state,
                            playerId,
                            unit.onPlayFromTrash,
                          ),
                        ]
                      : unit.onPlayReturnSpell || unit.onPlayReturnUnit
                        ? recoverableSpells(
                            state,
                            playerId,
                            unit.onPlayReturnUnit ? 'unit' : 'spell',
                          ).length
                          ? recoverableSpells(
                              state,
                              playerId,
                              unit.onPlayReturnUnit ? 'unit' : 'spell',
                            )
                          : [undefined]
                        : [undefined])
                      yield {
                        type: 'play-unit',
                        ...(onPlayTargetId ? { onPlayTargetId } : {}),
                        ...(onPlaySelectedIds.length
                          ? { onPlaySelectedIds }
                          : {}),
                        ...(accelerate ? { accelerate } : {}),
                        ...(optionalCost ? { optionalCost } : {}),
                        ...(discardCardId ? { discardCardId } : {}),
                        ...(costUnitIds.length ? { costUnitIds } : {}),
                        ...(returnSpellId ? { returnSpellId } : {}),
                        playerId,
                        cardId: card.id,
                        destinationId: zone.id,
                        payment: reducedPayment,
                      };
        }
      }
    }
    const gear = state.gearDefinitions?.find((d) => d.id === card.definitionId);
    if (gear) {
      const payment = findPayment(state, playerId, gear.cost);
      if (payment)
        yield { type: 'play-gear', playerId, cardId: card.id, payment };
    }
    const spell = state.spellDefinitions?.find(
      (d) => d.id === card.definitionId,
    );
    if (spell) {
      const payment =
        findPayment(
          state,
          playerId,
          hiddenFree(card, spellCost(state, playerId, spell)),
          'spell',
        ) ??
        (spell.spendBuffForFreeCast &&
        state.units.some((u) => u.ownerId === playerId && u.buffed)
          ? { energyRunes: [], powerRunes: [] }
          : null);
      const bundle = spell.effects.find(
        (e) => e.type === 'kill-selected-total-might',
      );
      const instances = spell.effects.find(
        (e) => e.type === 'damage-instances',
      );
      if (payment)
        for (const target of spell.target.kind === 'graveyard-unit'
          ? state.cards
          : spell.target.kind === 'battlefield'
            ? state.battlefields.map((f) => ({ id: f.zoneId }))
            : spell.target.kind === 'caster'
              ? [{ id: playerId }]
              : spell.target.kind === 'stack-spell'
                ? (state.stack?.entries ?? []).flatMap((e) =>
                    'card' in e && stackSpellTarget(state, spell, e.card.id)
                      ? [{ id: e.card.id }]
                      : [],
                  )
                : spell.target.kind === 'battlefield-unit-or-gear'
                  ? [...state.units, ...(state.gears ?? [])].filter((t) =>
                      battlefieldUnitOrGear(state, t.id),
                    )
                  : spell.target.kind === 'optional-gear'
                    ? [{ id: playerId }, ...(state.gears ?? [])]
                    : state.units) {
          const base = {
            type: 'cast-spell' as const,
            playerId,
            cardId: card.id,
            targetId: target.id,
            payment,
          };
          const summons = spell.effects.find(
            (e) => e.type === 'summon-recruits',
          );
          if (summons) {
            const zones = destinations
              .filter((z) => canSummonAt(state, playerId, z.id))
              .map((z) => z.id);
            for (const tokenDestinations of tokenPlacements(
              zones,
              summons.count,
            ))
              yield { ...base, tokenDestinations };
          } else if (
            spell.effects.some(
              (e) =>
                e.type === 'move-up-to-two-allies-to-base' ||
                e.type === 'boost-selected-allies' ||
                e.type === 'damage-selected-units',
            )
          ) {
            const ids = state.units
              .filter(
                (u) =>
                  u.ownerId === playerId ||
                  spell.effects.some((e) => e.type === 'damage-selected-units'),
              )
              .map((u) => u.id);
            yield { ...base, selectedUnitIds: [] };
            for (const [i, id] of ids.entries()) {
              yield { ...base, selectedUnitIds: [id] };
              for (const second of ids.slice(i + 1))
                yield { ...base, selectedUnitIds: [id, second] };
            }
          } else if (bundle) {
            for (const field of state.battlefields) {
              const here = state.units
                .filter((u) => u.zoneId === field.zoneId)
                .map((u) => u.id);
              for (let mask = 1; mask < 1 << here.length; mask++) {
                const ids = here.filter((_, i) => mask & (1 << i));
                if (validMightBundle(state, ids, bundle.maximum))
                  yield { ...base, selectedUnitIds: ids };
              }
            }
          } else if (instances) {
            for (const selectedUnitIds of multisets(
              state.units.map((u) => u.id),
              instances.count,
            ))
              yield { ...base, selectedUnitIds };
          } else if (
            spell.effects.some((e) => e.type === 'duel' || e.type === 'strike')
          )
            for (const enemy of state.units.filter(
              (u) =>
                u.ownerId !== playerId &&
                secondaryEnemyTarget(state, spell, playerId, u.id),
            ))
              yield { ...base, secondaryTargetId: enemy.id };
          else if (
            spell.effects.some((e) => e.type === 'fight-at-destination')
          ) {
            const unit = state.units.find((u) => u.id === target.id);
            for (const zone of unit ? destinations : [])
              if (zone.id !== unit!.zoneId)
                for (const foe of state.units.filter((u) =>
                  destinationFoe(state, playerId, unit!.id, zone.id, u.id),
                ))
                  yield {
                    ...base,
                    destinationId: zone.id,
                    secondaryTargetId: foe.id,
                  };
          } else if (spell.effects.some((e) => e.type === 'match-ally-might')) {
            for (const ally of state.units.filter((u) =>
              otherAlly(state, playerId, target.id, u.id),
            ))
              yield { ...base, secondaryTargetId: ally.id };
          } else if (
            spell.effects.some((e) => e.type === 'stun-with-enemy-here')
          ) {
            const unit = state.units.find((u) => u.id === target.id);
            for (const foe of unit
              ? state.units.filter((u) =>
                  enemyHere(state, playerId, unit, u.id),
                )
              : [])
              yield { ...base, secondaryTargetId: foe.id };
          } else if (
            spell.effects.some((e) => e.type === 'move-ally-to-target')
          ) {
            yield base;
            const unit = state.units.find((u) => u.id === target.id);
            for (const ally of unit
              ? state.units.filter((u) =>
                  allyToMove(state, playerId, unit, u.id),
                )
              : [])
              yield { ...base, secondaryTargetId: ally.id };
          } else if (
            spell.effects.some(
              (e) =>
                e.type === 'might-damage-enemies-then-move' ||
                e.type === 'move-to-battlefield',
            )
          ) {
            for (const field of state.battlefields)
              yield { ...base, destinationId: field.zoneId };
          } else if (spell.effects.some((e) => e.type === 'move-unit'))
            for (const zone of destinations)
              yield { ...base, destinationId: zone.id };
          else yield base;
        }
    }
  }
  for (const gear of state.gears ?? []) {
    const cost = state.gearDefinitions?.find(
      (d) => d.id === gear.definitionId,
    )?.equipCost;
    if (!cost) continue;
    const payment = findPayment(state, playerId, cost);
    if (payment)
      for (const unit of state.units)
        yield {
          type: 'equip-gear',
          playerId,
          gearId: gear.id,
          unitId: unit.id,
          payment,
        };
  }
}

/** Petite tranche de quatre jetons : énumère les destinations ordonnées, répétitions permises. */
function* tokenPlacements(
  zones: readonly string[],
  remaining: number,
  prefix: string[] = [],
): Generator<string[]> {
  if (!remaining) {
    yield prefix;
    return;
  }
  for (const zone of zones)
    yield* tokenPlacements(zones, remaining - 1, [...prefix, zone]);
}

/** Coût facultatif : une variante par allié Ready, puis validation atomique par act. */
function optionalCosts(state: GameState, action: GameAction): GameAction[] {
  if (action.type === 'play-unit') {
    const card = state.cards.find((c) => c.id === action.cardId);
    // Coût supplémentaire obligatoire : une variante par unité alliée sacrifiable.
    return state.unitDefinitions?.find((d) => d.id === card?.definitionId)
      ?.sacrificeCost
      ? state.units
          .filter((u) => u.ownerId === action.playerId)
          .map((u) => ({ ...action, sacrificeUnitId: u.id }))
      : [action];
  }
  if (action.type !== 'cast-spell') return [action];
  const card = state.cards.find((c) => c.id === action.cardId);
  if (
    state.spellDefinitions
      ?.find((d) => d.id === card?.definitionId)
      ?.effects.some((e) => e.type === 'discard-for-damage')
  )
    return discardChoices(state, action.playerId, action.cardId).map((id) =>
      id ? { ...action, discardCardId: id } : action,
    );
  // Coût X : une variante par X jusqu'au Power potentiellement disponible (filtrée au paiement).
  if (
    state.spellDefinitions?.find((d) => d.id === card?.definitionId)
      ?.variablePower
  ) {
    const pool = Object.values(
      state.resources[action.playerId]?.power ?? {},
    ).reduce((sum, n) => sum + (n ?? 0), 0);
    const runes = state.cards.filter(
      (c) =>
        c.ownerId === action.playerId &&
        state.zones.some((z) => z.id === c.zoneId && z.kind === 'runes'),
    ).length;
    return Array.from({ length: pool + runes + 1 }, (_, x) =>
      x ? { ...action, xPower: x } : action,
    );
  }
  if (
    state.spellDefinitions?.find((d) => d.id === card?.definitionId)
      ?.spendBuffForFreeCast
  )
    return [
      action,
      ...state.units
        .filter((u) => u.ownerId === action.playerId && u.buffed)
        .map((u) => ({ ...action, spendBuffUnitId: u.id })),
    ];
  if (
    !state.spellDefinitions?.find((d) => d.id === card?.definitionId)
      ?.optionalExhaustAlly
  )
    return [action];
  return [
    action,
    ...state.units
      .filter((u) => u.ownerId === action.playerId && u.ready)
      .map((u) => ({ ...action, exhaustUnitId: u.id })),
  ];
}

/** Paiement dépendant du choix : chaque candidat conserve sa cible et reçoit un plan valide. */
function targetPayment(state: GameState, action: GameAction): GameAction[] {
  if (action.type !== 'cast-spell' && action.type !== 'play-unit')
    return [action];
  const card = state.cards.find((c) => c.id === action.cardId);
  const definition =
    action.type === 'cast-spell'
      ? state.spellDefinitions?.find((d) => d.id === card?.definitionId)
      : state.unitDefinitions?.find((d) => d.id === card?.definitionId);
  if (!definition) return [];
  const cost =
    action.type === 'cast-spell' && definition.type === 'spell'
      ? withDeflect(
          state,
          action.playerId,
          withTrashUnitPower(
            state,
            definition,
            action.targetId,
            hiddenFree(
              card,
              castCost(
                state,
                action.playerId,
                definition,
                action.xPower,
                action.spendBuffUnitId,
              ),
            ),
          ),
          spellChosenUnits(definition, action),
        )
      : withDeflect(
          state,
          action.playerId,
          definition.type === 'unit'
            ? withTrashPower(
                state,
                definition,
                action.type === 'play-unit' ? action.returnSpellId : undefined,
                hiddenFree(
                  card,
                  unitCost(
                    state,
                    action.playerId,
                    definition,
                    action.type === 'play-unit' && action.accelerate === true,
                    action.type === 'play-unit' && action.optionalCost === true,
                    action.type === 'play-unit' &&
                      action.discardCardId !== undefined,
                    action.type === 'play-unit'
                      ? (action.costUnitIds?.length ?? 0)
                      : 0,
                  ),
                ),
              )
            : definition.cost,
          action.type === 'play-unit' && action.onPlayTargetId
            ? [action.onPlayTargetId]
            : [],
        );
  const payment = findPayment(
    state,
    action.playerId,
    cost,
    action.type === 'cast-spell' ? 'spell' : 'ordinary',
  );
  return payment ? [{ ...action, payment }] : [];
}

/** Ids + taille -> combinaisons avec répétition (multi-ensembles), dans l'ordre des ids. */
function multisets(ids: readonly string[], size: number): string[][] {
  if (size === 0) return [[]];
  return ids.flatMap((id, i) =>
    multisets(ids.slice(i), size - 1).map((rest) => [id, ...rest]),
  );
}
