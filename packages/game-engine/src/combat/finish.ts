import type { ActionResult, GameState, GameEvent } from '../types.js';
import { resolveOpenShowdown } from '../showdown/resolve-open.js';
/** Dégâts/effets terminés -> conquête, retraite ou nouveau combat si le défenseur éliminé a été remplacé.
 * Aucune fenêtre d'Action supplémentaire avant ce résultat. Le contrôle est conservé jusque-là. */
export function finishCombat(
  state: GameState,
): Extract<ActionResult, { ok: true }> {
  const combat = state.showdown;
  if (combat?.kind !== 'combat') throw new Error('Combat absent à la clôture.');
  let next = state.combatAftermath
    ? { ...state, combatAftermath: null }
    : state;
  const events: GameEvent[] = [];
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
  if (
    state.combatAftermath?.defenderEliminated &&
    attackers.length &&
    defenders.length
  ) {
    return {
      ok: true,
      state: {
        ...next,
        showdown: {
          ...combat,
          shieldBonuses: {},
          stage: 'priority',
          assignments: {},
          consecutivePasses: 0,
          priorityPlayerId: combat.initiatorId,
        },
      },
      events: [
        { type: 'showdown-ended', battlefieldId: combat.battlefieldId },
        { type: 'combat-restarted', battlefieldId: combat.battlefieldId },
        { type: 'showdown-opened', battlefieldId: combat.battlefieldId },
      ],
    };
  }
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
