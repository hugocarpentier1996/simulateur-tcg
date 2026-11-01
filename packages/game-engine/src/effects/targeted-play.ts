import { moveUnit } from './resolve-spell.js';
import { buffUnit, spendBuff } from './buff.js';
import type { ActionResult, GameState, UnitBlueprint } from '../types.js';
import { dealEffectDamage } from './effect-damage.js';
import { settleLethalUnits } from './lethal-units.js';
import { leaveBoard } from './leave-board.js';
import { resolveDuel } from './duel.js';
import { effectiveMight, isStunned } from './modifiers.js';

type TargetedEffect = NonNullable<
  UnitBlueprint['onPlayTargetEffect']
>['effect'];

/** Capacité de mise en jeu ciblée -> effet sur l'unité choisie si elle est encore en jeu,
 * sinon aucun effet. Modificateurs temporaires jusqu'à la fin du tour ; les dégâts sont des
 * dégâts de capacité (bonus compris) et les morts sont traitées aussitôt. */
export function resolveTargetedPlay(
  state: GameState,
  sourceId: string,
  ownerId: string,
  targetId: string | undefined,
  effect: TargetedEffect,
): Extract<ActionResult, { ok: true }> {
  const target = state.units.find((u) => u.id === targetId);
  if (!target) return { ok: true, state, events: [] };
  if (effect.type === 'swap-places') {
    const source = state.units.find((u) => u.id === sourceId);
    if (!source || source.zoneId === target.zoneId)
      return { ok: true, state, events: [] };
    const first = moveUnit(state, source, target.zoneId);
    const movedTarget = first.state.units.find((u) => u.id === target.id)!;
    const second = moveUnit(first.state, movedTarget, source.zoneId);
    return {
      ok: true,
      state: second.state,
      events: [...first.events, ...second.events],
    };
  }
  if (effect.type === 'pull-here') {
    const source = state.units.find((u) => u.id === sourceId);
    if (!source || source.zoneId === target.zoneId)
      return { ok: true, state, events: [] };
    return { ok: true, ...moveUnit(state, target, source.zoneId) };
  }
  if (effect.type === 'spend-buff-empower-self') {
    const spent = spendBuff(state, target.id);
    if (!spent) return { ok: true, state, events: [] };
    const empowered = buffUnit(spent, sourceId);
    return {
      ok: true,
      state: {
        ...empowered,
        units: empowered.units.map((u) =>
          u.id === sourceId ? { ...u, ready: true } : u,
        ),
      },
      events: [],
    };
  }
  if (effect.type === 'grant-ganking')
    return {
      ok: true,
      state: {
        ...state,
        units: state.units.map((u) =>
          u.id === target.id
            ? {
                ...u,
                temporaryEffects: [
                  ...(u.temporaryEffects ?? []),
                  { type: 'ganking' as const },
                ],
              }
            : u,
        ),
      },
      events: [],
    };
  if (effect.type === 'buff')
    return { ok: true, state: buffUnit(state, target.id), events: [] };
  if (effect.type === 'fight') {
    const source = state.units.find((u) => u.id === sourceId);
    if (!source) return { ok: true, state, events: [] };
    const fought = resolveDuel(state, source, target);
    return { ok: true, state: fought.state, events: fought.events };
  }
  if (effect.type === 'damage' || effect.type === 'might-damage') {
    const source = state.units.find((u) => u.id === sourceId);
    if (effect.type === 'might-damage' && !source)
      return { ok: true, state, events: [] };
    const damaged = dealEffectDamage(
      state,
      { kind: 'ability', sourceId, playerId: ownerId },
      [target],
      effect.type === 'damage' ? effect.amount : effectiveMight(source!, state),
    );
    const settled = settleLethalUnits(damaged.state);
    return {
      ok: true,
      state: settled.state,
      events: [...damaged.events, ...settled.events],
    };
  }
  if (
    effect.type === 'kill' ||
    (effect.type === 'kill-if-stunned-else-stun' && isStunned(target))
  ) {
    const killed = settleLethalUnits(state, new Set([target.id]));
    return { ok: true, state: killed.state, events: killed.events };
  }
  if (effect.type === 'return-to-hand') {
    const left = leaveBoard(state, target, 'hand');
    return { ok: true, state: left.state, events: left.events };
  }
  const modifier =
    effect.type === 'stun' || effect.type === 'kill-if-stunned-else-stun'
      ? { type: 'stun' as const }
      : {
          type: 'modify-might' as const,
          amount:
            effect.minimum === undefined
              ? effect.amount
              : Math.max(
                  effect.amount,
                  Math.min(0, effect.minimum - effectiveMight(target, state)),
                ),
        };
  return {
    ok: true,
    state: {
      ...state,
      units: state.units.map((u) =>
        u.id === target.id
          ? {
              ...u,
              temporaryEffects: [...(u.temporaryEffects ?? []), modifier],
            }
          : u,
      ),
    },
    events: [],
  };
}
