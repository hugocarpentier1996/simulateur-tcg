import { killGears } from '../effects/kill-gear.js';
import { isLethal } from '../effects/lethal-units.js';
import type {
  ActionResult,
  CardInstance,
  GameEvent,
  GameState,
  UnitState,
} from '../types.js';
import { finishCombat } from './finish.js';
import { deathTriggers } from '../effects/death.js';
import { effectiveMight, preventsDamage } from '../effects/modifiers.js';
import {
  bossCandidate,
  payBossLegends,
  replaceDeaths,
} from '../effects/replace-death.js';

type Combat = Extract<NonNullable<GameState['showdown']>, { kind: 'combat' }>;

/** Deux répartitions validées -> dégâts simultanés, morts, soin global puis choix des effets.
 * Les sources mortes déclenchent après le soin, puis quittent le terrain avant les choix.
 * Les jetons disparaissent. Sans effet en attente, clôture immédiate via finishCombat. */
export function resolveCombat(
  state: GameState,
  combat: Combat,
): Extract<ActionResult, { ok: true }> {
  const allocations = combat.participants.flatMap(
    (id) => combat.assignments[id] ?? [],
  );
  const damage = new Map(allocations.map((a) => [a.targetId, a.amount]));
  const damaged = state.units.map((unit) =>
    damage.has(unit.id) && !preventsDamage(unit, state)
      ? { ...unit, damage: (unit.damage ?? 0) + damage.get(unit.id)! }
      : unit,
  );
  const lethal = damaged.filter(
    (unit) =>
      unit.zoneId === combat.battlefieldId &&
      ((unit.damage ?? 0) >= Math.max(1, effectiveMight(unit, state)) ||
        isLethal(unit, state)),
  );
  // The Boss : décision demandée avant les morts du combat ; la résolution reprend ensuite.
  const candidate = bossCandidate(
    { ...state, units: damaged },
    new Set(lethal.map((unit) => unit.id)),
  );
  if (candidate)
    return {
      ok: true,
      state: {
        ...state,
        showdown: combat,
        pendingModeChoice: {
          kind: 'mode-choice',
          sourceId: candidate.legendId,
          ownerId: candidate.ownerId,
          modes: ['skip', 'accept'],
          bossSave: { unitId: candidate.unitId, combat: true },
        },
      },
      events: [],
    };
  const replaced = replaceDeaths(
    { ...state, units: damaged },
    new Set(lethal.map((unit) => unit.id)),
  );
  const dead = replaced.dead;
  const deadIds = new Set(dead.map((unit) => unit.id));
  const survivors = replaced.units.filter((unit) => !deadIds.has(unit.id));
  const events: GameEvent[] = [
    { type: 'combat-damage', allocations },
    ...replaced.events,
    {
      type: 'units-healed',
      unitIds: survivors
        .filter((unit) => (unit.damage ?? 0) > 0)
        .map((unit) => unit.id),
    },
  ];
  events.push(
    ...deathTriggers(state, dead).map((t) => ({
      type: 'death-triggered' as const,
      sourceId: t.sourceId,
      playerId: t.ownerId,
    })),
  );
  const graveCards = dead
    .filter((unit) => !unit.token)
    .map((unit) => toGraveyard(state, unit));
  events.push(
    ...dead
      .filter((unit) => unit.token)
      .map((unit) => ({ type: 'token-removed' as const, unitId: unit.id })),
  );
  events.push(
    ...graveCards.map((card) => ({
      type: 'unit-died' as const,
      unitId: card.id,
      zoneId: card.zoneId,
    })),
  );
  // Dégâts excédentaires de l'attaquant : au-delà de ce qui était létal pour chaque cible.
  const excess = (combat.assignments[combat.initiatorId] ?? []).reduce(
    (sum, a) => {
      const target = state.units.find((u) => u.id === a.targetId);
      if (!target) return sum;
      const left =
        Math.max(1, effectiveMight(target, state)) - (target.damage ?? 0);
      return sum + Math.max(0, a.amount - Math.max(0, left));
    },
    0,
  );
  let next: GameState = {
    ...state,
    units: survivors.map((unit) => ({ ...unit, damage: 0 })),
    cards: [...state.cards, ...graveCards],
    combatExcess: {
      battlefieldId: combat.battlefieldId,
      playerId: combat.initiatorId,
      amount: excess,
    },
  };
  if (replaced.bossLegendIds.length || replaced.recallPayments.length)
    next = payBossLegends(
      next,
      replaced.bossLegendIds,
      replaced.recallPayments,
    );
  if (replaced.consumedGearIds.length) {
    const broken = killGears(next, replaced.consumedGearIds);
    next = broken.state;
    events.push(...broken.events);
  }
  const triggers = deathTriggers(state, dead);
  if (triggers.length) {
    const order = [
      combat.initiatorId,
      ...combat.participants.filter((id) => id !== combat.initiatorId),
    ].filter((id) => triggers.some((t) => t.ownerId === id));
    next = {
      ...next,
      showdown: { ...combat, stage: 'effects' },
      combatAftermath: {
        defenderEliminated: !survivors.some(
          (u) =>
            u.zoneId === combat.battlefieldId &&
            u.ownerId === combat.defenderId,
        ),
      },
      pendingDeaths: { playerOrder: order, triggers },
    };
    return { ok: true, state: next, events };
  }
  const finished = finishCombat(next);
  return { ...finished, events: [...events, ...finished.events] };
}

/** Unité morte -> instance de carte au cimetière, débarrassée de son état de combat. */
function toGraveyard(state: GameState, unit: UnitState): CardInstance {
  const grave = state.zones.find(
    (zone) =>
      zone.kind === 'graveyard' &&
      zone.ownerId === (unit.cardOwnerId ?? unit.ownerId),
  );
  if (!grave || !unit.definitionId)
    throw new Error(
      'Une unité de combat doit avoir une définition et un cimetière.',
    );
  return {
    id: unit.id,
    definitionId: unit.definitionId,
    ownerId: unit.cardOwnerId ?? unit.ownerId,
    zoneId: grave.id,
  };
}
