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
  const previous = state.resources[action.playerId] ?? { energy: 0, power: {} };
  const energy = ability.energy ?? 0;
  const color = ability.power;
  return {
    ok: true,
    state: {
      ...state,
      gears: state.gears!.map((g) =>
        g.id === gear.id ? { ...g, ready: false } : g,
      ),
      resources: {
        ...state.resources,
        [action.playerId]: {
          ...previous,
          energy: previous.energy + energy,
          power: color
            ? { ...previous.power, [color]: (previous.power[color] ?? 0) + 1 }
            : previous.power,
        },
      },
    },
    events: [
      {
        type: 'gear-resource-added',
        playerId: action.playerId,
        gearId: gear.id,
        energy,
        power: color ?? null,
      },
    ],
  };
}

type TapAbility = NonNullable<GearBlueprint['tapAbility']>;

/** Unités ciblables par une capacité Tap de gear de ce joueur. */
export function tapAbilityTargets(
  state: GameState,
  playerId: string,
  ability: TapAbility,
): string[] {
  if (ability.effect.type === 'summon-base') return [];
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
  if (!gear.ready) return { ok: false, reason: 'GEAR_NOT_READY' };
  const untargeted = ability.effect.type === 'summon-base';
  if (
    untargeted
      ? action.targetId !== undefined
      : !action.targetId ||
        !tapAbilityTargets(state, action.playerId, ability).includes(
          action.targetId,
        )
  )
    return { ok: false, reason: 'INVALID_TARGET' };
  const base = state.zones.find(
    (z) => z.kind === 'base' && z.ownerId === action.playerId,
  );
  if (untargeted && !base) return { ok: false, reason: 'MISSING_BASE' };
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
        : ability.effect.type === 'move-to-base'
          ? { type: 'move-to-base', targetId: action.targetId! }
          : {
              type: 'targeted',
              targetId: action.targetId!,
              effect: ability.effect,
            },
  };
  return {
    ok: true,
    state: {
      ...paid.state,
      ...(paid.state.gears
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
