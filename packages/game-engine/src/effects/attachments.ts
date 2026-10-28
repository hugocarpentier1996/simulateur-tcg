import type { GameState, GameEvent, ActionResult } from '../types.js';

/** Après une action acceptée -> synchronise les équipements avec leurs porteurs.
 * Un porteur sorti de units rend le gear à la base de son propriétaire, sans changer Ready/Tap.
 * Toute sortie du terrain détache le gear : mort, retour en main ou bannissement.
 * Refuse par erreur interne un état sans base de retour. Aucune mutation ni conquête par un gear. */
export function syncAttachments(
  state: GameState,
): Extract<ActionResult, { ok: true }> {
  if (!state.gears?.length) return { ok: true, state, events: [] };
  const events: GameEvent[] = [];
  const gears = state.gears.map((gear) => {
    if (gear.attachedUnitId === undefined) return gear;
    const unit = state.units.find((u) => u.id === gear.attachedUnitId);
    if (unit) {
      if (gear.zoneId === unit.zoneId) return gear;
      events.push({
        type: 'gear-followed',
        gearId: gear.id,
        unitId: unit.id,
        from: gear.zoneId,
        to: unit.zoneId,
      });
      return { ...gear, zoneId: unit.zoneId };
    }
    const base = state.zones.find(
      (z) => z.ownerId === gear.ownerId && z.kind === 'base',
    );
    if (!base) throw new Error('Base absente pour le retour de l’équipement.');
    const { attachedUnitId, ...free } = gear;
    events.push({
      type: 'gear-detached',
      gearId: gear.id,
      unitId: attachedUnitId,
      zoneId: base.id,
    });
    return { ...free, zoneId: base.id };
  });
  return {
    ok: true,
    state: events.length ? { ...state, gears } : state,
    events,
  };
}
