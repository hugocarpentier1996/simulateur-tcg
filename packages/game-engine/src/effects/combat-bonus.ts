import { activeLegends } from './legends.js';
import type { GameState, UnitState } from '../types.js';

/** Unité + état -> bonus de combat du catalogue (Assault/Shield, seul au combat) selon le rôle en Combat Showdown.
 * Actif jusqu'à sa clôture, y compris pendant les effets de mort. Ne modifie pas la carte. */
export function combatMightBonus(unit: UnitState, state: GameState): number {
  const combat = state.showdown;
  if (combat?.kind !== 'combat' || unit.zoneId !== combat.battlefieldId)
    return 0;
  const definition = state.unitDefinitions?.find(
    (d) => d.id === unit.definitionId,
  );
  const alone =
    state.units.filter(
      (u) => u.ownerId === unit.ownerId && u.zoneId === combat.battlefieldId,
    ).length === 1;
  const personal = alone ? (definition?.aloneCombatMightBonus ?? 0) : 0;
  // Mots-clés accordés par les autres unités alliées de la zone (Captain Farron, Taric).
  const granted = (key: 'otherAlliesHereAssault' | 'otherAlliesHereShield') =>
    state.units.reduce(
      (sum, source) =>
        source.id !== unit.id &&
        source.ownerId === unit.ownerId &&
        source.zoneId === unit.zoneId
          ? sum +
            (state.unitDefinitions?.find((d) => d.id === source.definitionId)?.[
              key
            ] ?? 0)
          : sum,
      0,
    );
  if (unit.ownerId === combat.initiatorId)
    return (
      (definition?.assault ?? 0) + granted('otherAlliesHereAssault') + personal
    );
  if (unit.ownerId === combat.defenderId) {
    return (
      (definition?.shield ?? 0) +
      granted('otherAlliesHereShield') +
      (combat.shieldBonuses?.[unit.id] ?? 0) +
      personal +
      (alone
        ? activeLegends(state, unit.ownerId).reduce(
            (sum, l) => sum + (l.definition.aloneDefenseBonus ?? 0),
            0,
          )
        : 0)
    );
  }
  return 0;
}
