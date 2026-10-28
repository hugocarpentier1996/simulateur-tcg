import { playTargetChoices } from '../effects/play-targets.js';
import { endTurnChoices } from '../effects/end-runes.js';
import type { GameAction, GameState } from '../types.js';
import { act } from '../act.js';
import { canSummonAt } from '../actions/unit-destination.js';
import { recoverableSpells } from '../effects/return-spell.js';
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
  return [...candidates(state, playerId)].filter(
    (action) => act(state, action).ok,
  );
}

function* candidates(
  state: GameState,
  playerId: string,
): Generator<GameAction> {
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
  for (const unit of state.units)
    yield { type: 'activate-spell-energy', playerId, unitId: unit.id };
  for (const unit of state.units)
    for (const field of state.battlefields)
      yield {
        type: 'move',
        playerId,
        unitId: unit.id,
        destinationId: field.zoneId,
      };
  for (const card of state.cards.filter((c) => c.ownerId === playerId)) {
    const unit = state.unitDefinitions?.find((d) => d.id === card.definitionId);
    if (unit) {
      const payment = findPayment(state, playerId, unit.cost);
      if (payment)
        for (const zone of destinations)
          for (const onPlayTargetId of playTargetChoices(
            state,
            card.id,
            unit,
            zone.id,
          ))
            for (const returnSpellId of unit.onPlayReturnSpell
              ? recoverableSpells(state, playerId).length
                ? recoverableSpells(state, playerId)
                : [undefined]
              : [undefined])
              yield {
                type: 'play-unit',
                ...(onPlayTargetId ? { onPlayTargetId } : {}),
                ...(returnSpellId ? { returnSpellId } : {}),
                playerId,
                cardId: card.id,
                destinationId: zone.id,
                payment,
              };
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
      const payment = findPayment(state, playerId, spell.cost, 'spell');
      if (payment)
        for (const target of spell.target.kind === 'graveyard-unit'
          ? state.cards
          : spell.target.kind === 'battlefield'
            ? state.battlefields.map((f) => ({ id: f.zoneId }))
            : spell.target.kind === 'caster'
              ? [{ id: playerId }]
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
                e.type === 'boost-selected-allies',
            )
          ) {
            const ids = state.units
              .filter((u) => u.ownerId === playerId)
              .map((u) => u.id);
            yield { ...base, selectedUnitIds: [] };
            for (const [i, id] of ids.entries()) {
              yield { ...base, selectedUnitIds: [id] };
              for (const second of ids.slice(i + 1))
                yield { ...base, selectedUnitIds: [id, second] };
            }
          } else if (spell.effects.some((e) => e.type === 'duel'))
            for (const enemy of state.units.filter(
              (u) => u.ownerId !== playerId,
            ))
              yield { ...base, secondaryTargetId: enemy.id };
          else if (spell.effects.some((e) => e.type === 'move-unit'))
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
