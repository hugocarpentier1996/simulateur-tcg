import type { GameEvent, GameState, UnitState } from '../types.js';

/** Unités condamnées simultanément + état après dégâts -> remplacements avant mort.
 * Consomme une protection par unité : rappel Tap en base, soin immédiat, reste conservé.
 * Renvoie les unités encore condamnées et les événements ; aucune mutation, déplacement
 * ou capacité de mort. Une base absente est une incohérence de l'état fourni. */
export function replaceDeaths(
  state: GameState,
  lethalIds: ReadonlySet<string>,
): {
  units: UnitState[];
  dead: UnitState[];
  events: GameEvent[];
  /** Gears sacrifiés à la place d'une unité (Zhonya's Hourglass), à détruire par l'appelant. */
  consumedGearIds: string[];
} {
  const dead: UnitState[] = [];
  const events: GameEvent[] = [];
  const consumedGearIds: string[] = [];
  const units = state.units.map((unit) => {
    if (!lethalIds.has(unit.id)) return unit;
    const protection =
      unit.temporaryEffects?.findIndex((e) => e.type === 'recall-on-death') ??
      -1;
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
    if (protection < 0 && !hourglass) {
      dead.push(unit);
      return unit;
    }
    if (hourglass) consumedGearIds.push(hourglass.id);
    const base = state.zones.find(
      (z) => z.kind === 'base' && z.ownerId === unit.ownerId,
    );
    if (!base) throw new Error('Base absente pour le rappel de l’unité.');
    events.push({ type: 'unit-recalled', unitId: unit.id, zoneId: base.id });
    return {
      ...unit,
      zoneId: base.id,
      ready: false,
      damage: 0,
      temporaryEffects: (unit.temporaryEffects ?? []).filter(
        (_, i) => i !== protection,
      ),
    };
  });
  return { units, dead, events, consumedGearIds };
}
