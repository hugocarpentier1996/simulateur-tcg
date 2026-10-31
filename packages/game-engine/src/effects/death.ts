import { summonToken } from './summon-token.js';
import type {
  ActionResult,
  GameState,
  GameAction,
  UnitState,
} from '../types.js';
import {
  deathNeedsDestination,
  type DeathEntry,
  type DeathTrigger,
} from '../death-types.js';
import { drawCardForPlayer } from '../turn/draw.js';
import { channelForPlayer } from '../turn/supplies.js';
import { dealEffectDamage } from './effect-damage.js';
import { settleLethalUnits } from './lethal-units.js';

/** Base du joueur : destination conventionnelle des effets de mort sans destination. */
export function deathBaseId(state: GameState, playerId: string): string {
  return state.zones.find((z) => z.kind === 'base' && z.ownerId === playerId)!
    .id;
}

function destinationValid(
  state: GameState,
  playerId: string,
  own: readonly DeathTrigger[],
  choice: { sourceId: string; destinationId: string },
): boolean {
  const trigger = own.find((t) => t.sourceId === choice.sourceId);
  if (!trigger) return false;
  return deathNeedsDestination(trigger.effect)
    ? canSummonAt(state, playerId, choice.destinationId)
    : choice.destinationId === deathBaseId(state, playerId);
}
import { canSummonAt } from '../actions/unit-destination.js';

/** Morts identifiés -> déclenchements de confiance dans l'ordre attaquant puis défenseur.
 * Les choix de destination n'ont lieu qu'après le transfert au cimetière. */
export function deathTriggers(
  state: GameState,
  dead: readonly UnitState[],
): DeathTrigger[] {
  return dead.flatMap((unit) => {
    const effect = state.unitDefinitions?.find(
      (d) => d.id === unit.definitionId,
    )?.onDeath;
    return effect
      ? [
          {
            sourceId: unit.id,
            ownerId: unit.ownerId,
            effect,
            zoneId: unit.zoneId,
          },
        ]
      : [];
  });
}

/** Liste complète ordonnée des effets du joueur attendu -> empilement, sans résolution.
 * Refuse omission/doublon, mauvais joueur ou destination non contrôlée. Le dernier effet
 * fourni résoudra en premier. Aucune réaction avant que tous les choix soient terminés. */
export function queueDeathEffects(
  state: GameState,
  action: Extract<GameAction, { type: 'queue-death-effects' }>,
): ActionResult {
  const pending = state.pendingDeaths;
  if (!pending || pending.playerOrder[0] !== action.playerId)
    return { ok: false, reason: 'NO_DEATH_CHOICE' };
  const own = pending.triggers.filter((t) => t.ownerId === action.playerId);
  if (
    action.effects.length !== own.length ||
    new Set(action.effects.map((e) => e.sourceId)).size !== own.length ||
    action.effects.some(
      (e) =>
        !own.some((t) => t.sourceId === e.sourceId) ||
        !destinationValid(state, action.playerId, own, e),
    )
  )
    return { ok: false, reason: 'INVALID_DEATH_CHOICES' };
  const entries: DeathEntry[] = action.effects.map((e) => ({
    ...own.find((t) => t.sourceId === e.sourceId)!,
    kind: 'death',
    destinationId: e.destinationId,
  }));
  const first = state.showdown?.initiatorId ?? state.activePlayerId;
  const remaining = pending.playerOrder.slice(1);
  return {
    ok: true,
    state: {
      ...state,
      pendingDeaths: remaining.length
        ? {
            ...pending,
            playerOrder: remaining,
            triggers: pending.triggers.filter(
              (t) => t.ownerId !== action.playerId,
            ),
          }
        : null,
      stack: {
        entries: [...(state.stack?.entries ?? []), ...entries],
        initiatorId: state.stack?.initiatorId ?? first,
        priorityPlayerId: first,
        consecutivePasses: 0,
      },
    },
    events: [
      {
        type: 'death-effects-queued',
        playerId: action.playerId,
        sourceIds: action.effects.map((e) => e.sourceId),
      },
    ],
  };
}

/** Effet du sommet -> application selon son type, indépendante de la carte source.
 * summon-token : jeton Tap sans paiement à la destination revérifiée (sinon ignoré).
 * draw / channel-exhausted : pour le propriétaire. summon-tokens-base : jetons dans sa base.
 * damage-here : dégâts de capacité aux unités du champ de la mort, morts traitées ensuite. */
export function resolveDeathEffect(
  state: GameState,
  entry: DeathEntry,
): Extract<ActionResult, { ok: true }> {
  const events: Extract<ActionResult, { ok: true }>['events'] = [
    { type: 'death-effect-resolved', sourceId: entry.sourceId },
  ];
  const effect = entry.effect;
  if (effect.type === 'summon-token') {
    const summoned = summonToken(
      state,
      entry.ownerId,
      entry.destinationId,
      effect.definitionId,
    );
    return { ...summoned, events: [...events, ...summoned.events] };
  }
  if (effect.type === 'draw') {
    for (let i = 0; i < effect.count && !state.result; i++) {
      const drawn = drawCardForPlayer(state, entry.ownerId);
      state = drawn.state;
      events.push(...drawn.events);
    }
    return { ok: true, state, events };
  }
  if (effect.type === 'channel-exhausted') {
    const channeled = channelForPlayer(state, entry.ownerId, effect.count);
    state = channeled.state;
    events.push(...channeled.events);
    for (let i = 0; i < (effect.draw ?? 0) && !state.result; i++) {
      const drawn = drawCardForPlayer(state, entry.ownerId);
      state = drawn.state;
      events.push(...drawn.events);
    }
    return { ok: true, state, events };
  }
  if (effect.type === 'summon-tokens-base') {
    const base = deathBaseId(state, entry.ownerId);
    for (let i = 0; i < effect.count; i++) {
      const summoned = summonToken(
        state,
        entry.ownerId,
        base,
        effect.definitionId,
      );
      state = summoned.state;
      events.push(...summoned.events);
    }
    return { ok: true, state, events };
  }
  const zoneId = entry.zoneId;
  if (!zoneId || !state.battlefields.some((f) => f.zoneId === zoneId))
    return { ok: true, state, events };
  const damaged = dealEffectDamage(
    state,
    { kind: 'ability', sourceId: entry.sourceId, playerId: entry.ownerId },
    state.units.filter((u) => u.zoneId === zoneId),
    effect.amount,
  );
  const settled = settleLethalUnits(damaged.state);
  return {
    ok: true,
    state: settled.state,
    events: [...events, ...damaged.events, ...settled.events],
  };
}
