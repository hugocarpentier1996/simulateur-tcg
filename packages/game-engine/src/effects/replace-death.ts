import { payCost } from '../cost/payment.js';
import { activeLegends } from './legends.js';
import { findPayment } from '../legal/payment.js';
import type { GameEvent, GameState, UnitState } from '../types.js';

/** The Boss : légendes utilisées -> couchées, 1 Power payé chacune (plan automatique). */
export function payBossLegends(
  state: GameState,
  legendIds: readonly string[],
  recallPayments: readonly { playerId: string; power: string }[] = [],
): GameState {
  let next = state;
  for (const { playerId, power } of recallPayments) {
    const cost = { energy: 0, power: { [power]: 1 } };
    const plan = findPayment(next, playerId, cost);
    const paid = plan && payCost(next, playerId, cost, plan);
    if (paid && paid.ok) next = paid.state;
  }
  for (const id of legendIds) {
    const card = next.cards.find((c) => c.id === id);
    if (!card) continue;
    const plan = findPayment(next, card.ownerId, ONE_POWER);
    const paid = plan && payCost(next, card.ownerId, ONE_POWER, plan);
    if (paid && paid.ok) next = paid.state;
    next = {
      ...next,
      cards: next.cards.map((c) => (c.id === id ? { ...c, ready: false } : c)),
    };
  }
  return next;
}

/** Unités condamnées simultanément + état après dégâts -> remplacements avant mort.
 * Consomme une protection par unité : rappel Tap en base, soin immédiat, reste conservé.
 * Renvoie les unités encore condamnées et les événements ; aucune mutation, déplacement
 * ou capacité de mort. Une base absente est une incohérence de l'état fourni. */
export const ONE_POWER = { energy: 0, power: {}, genericPower: 1 };

export function replaceDeaths(
  state: GameState,
  lethalIds: ReadonlySet<string>,
): {
  units: UnitState[];
  dead: UnitState[];
  events: GameEvent[];
  /** Gears sacrifiés à la place d'une unité (Zhonya's Hourglass), à détruire par l'appelant. */
  consumedGearIds: string[];
  /** Légendes The Boss utilisées : l'appelant les couche et fait payer 1 Power. */
  bossLegendIds: string[];
  /** Rappels payants (Unlicensed Armory) : l'appelant fait payer ces Power. */
  recallPayments: { playerId: string; power: string }[];
} {
  const recallPayments: { playerId: string; power: string }[] = [];
  const dead: UnitState[] = [];
  const events: GameEvent[] = [];
  const consumedGearIds: string[] = [];
  const bossLegendIds: string[] = [];
  const units = state.units.map((unit) => {
    if (!lethalIds.has(unit.id)) return unit;
    // Protection gratuite, ou payante (Unlicensed Armory) si son Power est payable.
    const protection =
      unit.temporaryEffects?.findIndex(
        (e) =>
          e.type === 'recall-on-death' &&
          (!e.power ||
            findPayment(state, unit.ownerId, {
              energy: 0,
              power: { [e.power]: 1 },
            })),
      ) ?? -1;
    const protectionPower = (
      unit.temporaryEffects?.[protection] as { power?: string } | undefined
    )?.power;
    if (protectionPower)
      recallPayments.push({ playerId: unit.ownerId, power: protectionPower });
    const hourglass =
      protection < 0
        ? state.gears?.find(
            (g) =>
              g.ownerId === unit.ownerId &&
              !consumedGearIds.includes(g.id) &&
              state.gearDefinitions?.find((d) => d.id === g.definitionId)
                ?.saveAllyFromDeath,
          )
        : undefined;
    const boss =
      protection < 0 && !hourglass && unit.buffed
        ? activeLegends(state, unit.ownerId).find(
            (l) =>
              l.definition.saveBuffedFromDeath &&
              l.card.ready !== false &&
              !bossLegendIds.includes(l.card.id) &&
              findPayment(state, unit.ownerId, ONE_POWER),
          )
        : undefined;
    if (protection < 0 && !hourglass && !boss) {
      dead.push(unit);
      return unit;
    }
    if (boss) bossLegendIds.push(boss.card.id);
    if (hourglass) consumedGearIds.push(hourglass.id);
    const base = state.zones.find(
      (z) => z.kind === 'base' && z.ownerId === unit.ownerId,
    );
    if (!base) throw new Error('Base absente pour le rappel de l’unité.');
    events.push({ type: 'unit-recalled', unitId: unit.id, zoneId: base.id });
    const recalled: UnitState = {
      ...unit,
      zoneId: base.id,
      ready: false,
      damage: 0,
      temporaryEffects: (unit.temporaryEffects ?? []).filter(
        (_, i) => i !== protection,
      ),
    };
    if (boss) delete recalled.buffed;
    return recalled;
  });
  return {
    units,
    dead,
    events,
    consumedGearIds,
    bossLegendIds,
    recallPayments,
  };
}
