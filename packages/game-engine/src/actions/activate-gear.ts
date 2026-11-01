import { settleLethalUnits } from '../effects/lethal-units.js';
import { killGears } from '../effects/kill-gear.js';
import { activeLegends } from '../effects/legends.js';
import type { ActionResult, GameAction, GameState } from '../types.js';
import type { GearBlueprint, GearState } from '../gear-types.js';
import type { PlayEffectEntry } from '../effects/play-effect.js';
import { payCost } from '../cost/payment.js';
import { withDeflect } from '../cost/deflect.js';
import { canUseTiming } from './timing.js';

/** Gear Ready du demandeur avec capacité ADD -> Tap et ressource dans la réserve flottante.
 * Fenêtre d'une Réaction (Main, priorité de pile ou de Showdown), sans pile ni Réaction.
 * Refuse gear absent, adverse, Tap ou sans capacité, et mauvaise fenêtre, sans mutation. */
export function activateGear(
  state: GameState,
  action: Extract<GameAction, { type: 'activate-gear' }>,
): ActionResult {
  const gear = state.gears?.find(
    (g) => g.id === action.gearId && g.ownerId === action.playerId,
  );
  if (!gear) {
    // Légende à capacité Tap : même action, l'identifiant désigne la carte de légende.
    const legend = activeLegends(state, action.playerId).find(
      (l) => l.card.id === action.gearId,
    );
    // Unité à capacité Tap (Caitlyn) : même action, identifiant de l'unité.
    const unit = state.units.find(
      (u) => u.id === action.gearId && u.ownerId === action.playerId,
    );
    const unitAbility = state.unitDefinitions?.find(
      (d) => d.id === unit?.definitionId,
    )?.tapAbility;
    const sacrifice = state.unitDefinitions?.find(
      (d) => d.id === unit?.definitionId,
    )?.sacrificeResource;
    if (unit && sacrifice) {
      if (!unit.ready) return { ok: false, reason: 'GEAR_NOT_READY' };
      if (!canUseTiming(state, action.playerId, 'action'))
        return { ok: false, reason: 'ABILITY_WINDOW_CLOSED' };
      const victimUnit = state.units.find(
        (u) =>
          u.id === action.targetId &&
          u.id !== unit.id &&
          u.ownerId === action.playerId,
      );
      const victimGear = state.gears?.find(
        (g) => g.id === action.targetId && g.ownerId === action.playerId,
      );
      if (!victimUnit && !victimGear)
        return { ok: false, reason: 'INVALID_ADDITIONAL_COST' };
      const tapped = {
        ...state,
        units: state.units.map((u) =>
          u.id === unit.id ? { ...u, ready: false } : u,
        ),
      };
      const killed = victimUnit
        ? settleLethalUnits(tapped, new Set([victimUnit.id]))
        : { ...killGears(tapped, [victimGear!.id]), ok: true as const };
      const previous = killed.state.resources[action.playerId] ?? {
        energy: 0,
        power: {},
      };
      return {
        ok: true,
        state: {
          ...killed.state,
          resources: {
            ...killed.state.resources,
            [action.playerId]: {
              ...previous,
              anyPower: (previous.anyPower ?? 0) + sacrifice.anyPower,
            },
          },
        },
        events: killed.events,
      };
    }
    if (unit && unitAbility) {
      if (
        unitAbility.requiresBattlefield &&
        !state.battlefields.some((f) => f.zoneId === unit.zoneId)
      )
        return { ok: false, reason: 'ABILITY_WINDOW_CLOSED' };
      const used = activateTapAbility(state, action, unit, unitAbility);
      return used.ok
        ? {
            ...used,
            state: {
              ...used.state,
              units: used.state.units.map((u) =>
                u.id === unit.id ? { ...u, ready: false } : u,
              ),
            },
          }
        : used;
    }
    const resource = legend?.definition.resourceAbility;
    if (legend && resource) {
      if (legend.card.ready === false)
        return { ok: false, reason: 'GEAR_NOT_READY' };
      if (resource.legion && !state.cardsPlayedThisTurn?.[action.playerId])
        return { ok: false, reason: 'LEGION_REQUIRED' };
      if (!canUseTiming(state, action.playerId, 'reaction'))
        return { ok: false, reason: 'ABILITY_WINDOW_CLOSED' };
      return addResource(
        {
          ...state,
          cards: state.cards.map((c) =>
            c.id === legend.card.id ? { ...c, ready: false } : c,
          ),
        },
        action.playerId,
        legend.card.id,
        resource,
      );
    }
    return legend?.definition.tapAbility
      ? activateTapAbility(
          state,
          action,
          { id: legend.card.id, ready: legend.card.ready !== false },
          legend.definition.tapAbility,
        )
      : { ok: false, reason: 'INVALID_GEAR' };
  }
  const definition = state.gearDefinitions?.find(
    (d) => d.id === gear.definitionId,
  );
  if (definition?.tapAbility)
    return activateTapAbility(state, action, gear, definition.tapAbility);
  const ability = definition?.resourceAbility;
  if (!ability) return { ok: false, reason: 'NO_RESOURCE_ABILITY' };
  if (!gear.ready) return { ok: false, reason: 'GEAR_NOT_READY' };
  if (!canUseTiming(state, action.playerId, 'reaction'))
    return { ok: false, reason: 'ABILITY_WINDOW_CLOSED' };
  return addResource(
    {
      ...state,
      gears: state.gears!.map((g) =>
        g.id === gear.id ? { ...g, ready: false } : g,
      ),
    },
    action.playerId,
    gear.id,
    ability,
  );
}

type TapAbility = NonNullable<GearBlueprint['tapAbility']>;

/** Unités ciblables par une capacité Tap de gear de ce joueur. */
export function tapAbilityTargets(
  state: GameState,
  playerId: string,
  ability: TapAbility,
  sourceId?: string,
): string[] {
  if (
    ability.effect.type === 'summon-base' ||
    ability.effect.type === 'kill-self' ||
    ability.effect.type === 'draw' ||
    ability.effect.type === 'next-unit-ready' ||
    ability.effect.type === 'next-spell-bonus-damage' ||
    ability.effect.type === 'recycle-trashes' ||
    ability.effect.type === 'buff-self'
  )
    return [];
  if (ability.effect.type === 'move-to-or-from-base')
    return state.units.filter((u) => u.ownerId === playerId).map((u) => u.id);
  if (ability.effect.type === 'tag-to-hand') {
    const tag = ability.effect.tag;
    const tagged = (definitionId: string) =>
      !!state.unitDefinitions
        ?.find((d) => d.id === definitionId)
        ?.tags?.includes(tag);
    return [
      ...state.units
        .filter((u) => u.ownerId === playerId && tagged(u.definitionId))
        .map((u) => u.id),
      ...state.cards
        .filter(
          (c) =>
            tagged(c.definitionId) &&
            state.zones.some(
              (z) =>
                z.id === c.zoneId &&
                z.kind === 'champion' &&
                z.ownerId === playerId,
            ),
        )
        .map((c) => c.id),
    ];
  }
  if (ability.effect.type === 'bounce-friendly')
    return [
      ...state.units.filter((u) => u.ownerId === playerId).map((u) => u.id),
      ...(state.gears ?? [])
        .filter((g) => g.ownerId === playerId && g.id !== sourceId)
        .map((g) => g.id),
      ...state.cards
        .filter((c) => c.facedown && c.ownerId === playerId)
        .map((c) => c.id),
    ];
  const { allegiance, zone, exhausted } = ability.target;
  const moveToBase = ability.effect.type === 'move-to-base';
  return state.units
    .filter(
      (u) =>
        (allegiance !== 'friendly' || u.ownerId === playerId) &&
        (allegiance !== 'enemy' || u.ownerId !== playerId) &&
        (!moveToBase || u.ownerId === playerId) &&
        (zone !== 'battlefield' && !moveToBase
          ? true
          : state.battlefields.some((f) => f.zoneId === u.zoneId)) &&
        (!exhausted || !u.ready),
    )
    .map((u) => u.id);
}

/** Capacité Tap ciblée : à son tour, phase Main, sans pile ni Showdown ; gear Ready, cible
 * valide et coût payé -> gear Tap et effet empilé (réactions possibles). Refus atomique. */
function activateTapAbility(
  state: GameState,
  action: Extract<GameAction, { type: 'activate-gear' }>,
  gear: Pick<GearState, 'id' | 'ready'>,
  ability: TapAbility,
): ActionResult {
  if (
    state.phase !== 'main' ||
    state.activePlayerId !== action.playerId ||
    state.stack ||
    state.showdown
  )
    return { ok: false, reason: 'ABILITY_WINDOW_CLOSED' };
  if (!gear.ready && !ability.noExhaust)
    return { ok: false, reason: 'GEAR_NOT_READY' };
  const untargeted =
    ability.effect.type === 'summon-base' ||
    ability.effect.type === 'kill-self' ||
    ability.effect.type === 'draw' ||
    ability.effect.type === 'next-unit-ready' ||
    ability.effect.type === 'next-spell-bonus-damage' ||
    ability.effect.type === 'recycle-trashes' ||
    ability.effect.type === 'buff-self';
  if (
    untargeted
      ? action.targetId !== undefined
      : !action.targetId ||
        !tapAbilityTargets(state, action.playerId, ability, gear.id).includes(
          action.targetId,
        )
  )
    return { ok: false, reason: 'INVALID_TARGET' };
  const base = state.zones.find(
    (z) => z.kind === 'base' && z.ownerId === action.playerId,
  );
  if (untargeted && !base) return { ok: false, reason: 'MISSING_BASE' };
  // Unforgiven : depuis la base, un champ est requis ; depuis un champ, aucune destination.
  if (ability.effect.type === 'move-to-or-from-base') {
    const fromBase =
      state.units.find((u) => u.id === action.targetId)?.zoneId === base?.id;
    if (
      fromBase
        ? !state.battlefields.some((f) => f.zoneId === action.destinationId)
        : action.destinationId !== undefined
    )
      return { ok: false, reason: 'UNSUPPORTED_DESTINATION' };
  } else if (action.destinationId !== undefined)
    return { ok: false, reason: 'UNSUPPORTED_DESTINATION' };
  const paid = payCost(
    state,
    action.playerId,
    withDeflect(
      state,
      action.playerId,
      ability.cost ?? { energy: 0, power: {} },
      action.targetId ? [action.targetId] : [],
    ),
    action.payment ?? { energyRunes: [], powerRunes: [] },
  );
  if (!paid.ok) return paid;
  const trash = paid.state.cards.filter((c) =>
    paid.state.zones.some(
      (z) =>
        z.id === c.zoneId &&
        z.kind === 'graveyard' &&
        z.ownerId === action.playerId,
    ),
  );
  const deck = paid.state.zones.find(
    (z) => z.kind === 'deck' && z.ownerId === action.playerId,
  );
  const recycled = trash.slice(0, ability.recycleTrash ?? 0);
  if (
    recycled.length < (ability.recycleTrash ?? 0) ||
    (recycled.length && !deck)
  )
    return { ok: false, reason: 'INVALID_ADDITIONAL_COST' };
  if (recycled.length)
    paid.state = {
      ...paid.state,
      cards: [
        ...paid.state.cards.filter((c) => !recycled.includes(c)),
        ...recycled.map((c) => ({ ...c, zoneId: deck!.id })),
      ],
    };
  const entry: PlayEffectEntry = {
    kind: 'play-effect',
    sourceId: gear.id,
    ownerId: action.playerId,
    effect:
      ability.effect.type === 'summon-base'
        ? {
            type: 'summon-base',
            destinationId: base!.id,
            definitionId: ability.effect.definitionId,
          }
        : ability.effect.type === 'kill-self'
          ? { type: 'kill-gear', gearId: gear.id }
          : ability.effect.type === 'draw'
            ? { type: 'draw', count: ability.effect.count }
            : ability.effect.type === 'move-to-or-from-base'
              ? action.destinationId
                ? {
                    type: 'move-to-field',
                    targetId: action.targetId!,
                    destinationId: action.destinationId,
                  }
                : { type: 'move-to-base', targetId: action.targetId! }
              : ability.effect.type === 'bounce-friendly' ||
                  ability.effect.type === 'tag-to-hand'
                ? { type: 'bounce', targetId: action.targetId! }
                : ability.effect.type === 'buff-self'
                  ? { type: 'buff-units', unitIds: [gear.id] }
                  : ability.effect.type === 'recycle-trashes'
                    ? { type: 'recycle-trashes', count: ability.effect.count }
                    : ability.effect.type === 'next-spell-bonus-damage'
                      ? {
                          type: 'next-spell-bonus-damage',
                          amount: ability.effect.amount,
                        }
                      : ability.effect.type === 'next-unit-ready'
                        ? {
                            type: 'next-unit-ready',
                            ...(ability.effect.legion ? { legion: true } : {}),
                          }
                        : ability.effect.type === 'move-to-base'
                          ? { type: 'move-to-base', targetId: action.targetId! }
                          : {
                              type: 'targeted',
                              targetId: action.targetId!,
                              effect: ability.effect,
                            },
  };
  if (ability.killSelfCost) paid.state = killGears(paid.state, [gear.id]).state;
  return {
    ok: true,
    state: {
      ...paid.state,
      ...(paid.state.gears && !ability.noExhaust
        ? {
            gears: paid.state.gears.map((g) =>
              g.id === gear.id ? { ...g, ready: false } : g,
            ),
          }
        : {}),
      cards: paid.state.cards.map((c) =>
        c.id === gear.id ? { ...c, ready: false } : c,
      ),
      stack: {
        entries: [entry],
        initiatorId: action.playerId,
        priorityPlayerId: action.playerId,
        consecutivePasses: 0,
      },
    },
    events: [{ type: 'unit-play-effect-queued', sourceId: gear.id }],
  };
}

/** Ressource ajoutée à la réserve flottante du joueur (source déjà couchée). */
function addResource(
  state: GameState,
  playerId: string,
  sourceId: string,
  ability: {
    readonly energy?: number;
    readonly power?: string;
    readonly spellPower?: number;
  },
): ActionResult {
  const previous = state.resources[playerId] ?? { energy: 0, power: {} };
  const energy = ability.energy ?? 0;
  const color = ability.power;
  return {
    ok: true,
    state: {
      ...state,
      resources: {
        ...state.resources,
        [playerId]: {
          ...previous,
          energy: previous.energy + energy,
          power: color
            ? { ...previous.power, [color]: (previous.power[color] ?? 0) + 1 }
            : previous.power,
          ...(ability.spellPower
            ? { spellPower: (previous.spellPower ?? 0) + ability.spellPower }
            : {}),
        },
      },
    },
    events: [
      {
        type: 'gear-resource-added',
        playerId,
        gearId: sourceId,
        energy,
        power: color ?? null,
      },
    ],
  };
}
