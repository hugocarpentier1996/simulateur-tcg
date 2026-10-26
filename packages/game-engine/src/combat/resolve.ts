import type {
  ActionResult,
  CardInstance,
  GameEvent,
  GameState,
  UnitState,
} from '../types.js';
import { resolveOpenShowdown } from '../showdown/resolve-open.js';
import { effectiveMight } from '../effects/modifiers.js';

type Combat = Extract<NonNullable<GameState['showdown']>, { kind: 'combat' }>;

/** Deux répartitions validées -> dégâts simultanés, morts, soin global puis résultat.
 * Aucun effet de mort dans cette version. Les morts sont identifiés avant le
 * soin, puis transférés au cimetière avec leur definitionId pour pouvoir être recyclés. */
export function resolveCombat(
  state: GameState,
  combat: Combat,
): Extract<ActionResult, { ok: true }> {
  const allocations = combat.participants.flatMap(
    (id) => combat.assignments[id] ?? [],
  );
  const damage = new Map(allocations.map((a) => [a.targetId, a.amount]));
  const damaged = state.units.map((unit) =>
    damage.has(unit.id)
      ? { ...unit, damage: (unit.damage ?? 0) + damage.get(unit.id)! }
      : unit,
  );
  const dead = damaged.filter(
    (unit) =>
      unit.zoneId === combat.battlefieldId &&
      (unit.damage ?? 0) >= Math.max(1, effectiveMight(unit, state)),
  );
  const deadIds = new Set(dead.map((unit) => unit.id));
  const survivors = damaged.filter((unit) => !deadIds.has(unit.id));
  const events: GameEvent[] = [
    { type: 'combat-damage', allocations },
    {
      type: 'units-healed',
      unitIds: survivors
        .filter((unit) => (unit.damage ?? 0) > 0)
        .map((unit) => unit.id),
    },
  ];
  const graveCards = dead.map((unit) => toGraveyard(state, unit));
  events.push(
    ...graveCards.map((card) => ({
      type: 'unit-died' as const,
      unitId: card.id,
      zoneId: card.zoneId,
    })),
  );
  let next: GameState = {
    ...state,
    units: survivors.map((unit) => ({ ...unit, damage: 0 })),
    cards: [...state.cards, ...graveCards],
  };
  const attackers = next.units.filter(
    (unit) =>
      unit.zoneId === combat.battlefieldId &&
      unit.ownerId === combat.initiatorId,
  );
  const defenders = next.units.filter(
    (unit) =>
      unit.zoneId === combat.battlefieldId &&
      unit.ownerId === combat.defenderId,
  );
  if (attackers.length && !defenders.length) {
    const conquered = resolveOpenShowdown(next, combat);
    return {
      ...conquered,
      events: [
        ...events,
        ...conquered.events,
        { type: 'showdown-ended', battlefieldId: combat.battlefieldId },
      ],
    };
  }
  if (attackers.length) {
    const base = state.zones.find(
      (zone) => zone.kind === 'base' && zone.ownerId === combat.initiatorId,
    );
    if (!base) throw new Error('Base absente pour la retraite.');
    const ids = new Set(attackers.map((unit) => unit.id));
    next = {
      ...next,
      units: next.units.map((unit) =>
        ids.has(unit.id) ? { ...unit, zoneId: base.id } : unit,
      ),
    };
    events.push(
      ...attackers.map((unit) => ({
        type: 'unit-retreated' as const,
        unitId: unit.id,
        zoneId: base.id,
      })),
    );
  }
  return {
    ok: true,
    state: {
      ...next,
      showdown: null,
      battlefields: next.battlefields.map((field) =>
        field.zoneId === combat.battlefieldId
          ? {
              ...field,
              controllerId: defenders.length ? combat.defenderId : null,
            }
          : field,
      ),
    },
    events: [
      ...events,
      { type: 'showdown-ended', battlefieldId: combat.battlefieldId },
    ],
  };
}

/** Unité morte -> instance de carte au cimetière, débarrassée de son état de combat. */
function toGraveyard(state: GameState, unit: UnitState): CardInstance {
  const grave = state.zones.find(
    (zone) => zone.kind === 'graveyard' && zone.ownerId === unit.ownerId,
  );
  if (!grave || !unit.definitionId)
    throw new Error(
      'Une unité de combat doit avoir une définition et un cimetière.',
    );
  return {
    id: unit.id,
    definitionId: unit.definitionId,
    ownerId: unit.ownerId,
    zoneId: grave.id,
  };
}
