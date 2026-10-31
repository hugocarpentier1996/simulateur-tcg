import { battlefieldDefinition } from './battlefield.js';
import type { GameState, UnitState } from '../types.js';
import { gearMightBonus } from './gear-bonus.js';
import { combatMightBonus } from './combat-bonus.js';
import { runeMightBonus } from './rune-bonus.js';
import { selfScoreMightBonus, unitAuraMightBonus } from './unit-aura.js';

/** Unité + état -> Might actuelle avec auras/équipement et Assault/Shield, sans modifier la valeur imprimée.
 * Sans état : seulement Might de base et modificateurs temporaires (compatibilité des anciens appels). */
export function effectiveMight(unit: UnitState, state?: GameState): number {
  const total = Math.max(
    0,
    unit.might +
      (state
        ? (battlefieldDefinition(state, unit.zoneId)?.unitMightBonus ?? 0)
        : 0) +
      (state ? gearMightBonus(unit, state) : 0) +
      (state ? combatMightBonus(unit, state) : 0) +
      (state ? runeMightBonus(unit, state) : 0) +
      (state ? unitAuraMightBonus(unit, state) : 0) +
      (state ? selfScoreMightBonus(unit, state) : 0) +
      (unit.temporaryEffects ?? []).reduce(
        (sum, effect) =>
          sum + (effect.type === 'modify-might' ? effect.amount : 0),
        0,
      ),
  );
  // Leona : malus des ennemis Stun de sa zone, plancher 1 (sans relever une Might < 1).
  const malus =
    state && isStunned(unit)
      ? state.units.reduce(
          (sum, source) =>
            source.ownerId !== unit.ownerId && source.zoneId === unit.zoneId
              ? sum +
                (state.unitDefinitions?.find(
                  (d) => d.id === source.definitionId,
                )?.stunnedEnemiesHereMalus ?? 0)
              : sum,
          0,
        )
      : 0;
  return malus ? Math.max(Math.min(total, 1), total - malus) : total;
}
/** Unité -> présence d'un Stun actif. */
export function isStunned(unit: UnitState): boolean {
  return (
    !!unit.stunned ||
    !!unit.temporaryEffects?.some((effect) => effect.type === 'stun')
  );
}

/** Unité + état -> vrai si elle ne subit actuellement aucun dégât (Kayn après deux
 * déplacements ce tour). Les sources de dégâts appliquent alors 0. */
export function preventsDamage(unit: UnitState, state: GameState): boolean {
  const threshold = state.unitDefinitions?.find(
    (d) => d.id === unit.definitionId,
  )?.noDamageAfterMoves;
  return threshold !== undefined && (unit.movesThisTurn ?? 0) >= threshold;
}

/** Unité + état -> Deflect ou Ganking imprimé, ou accordé tant qu'elle est Mighty. */
export function hasKeyword(
  unit: UnitState,
  state: GameState,
  key: 'deflect' | 'ganking',
): boolean {
  const definition = state.unitDefinitions?.find(
    (d) => d.id === unit.definitionId,
  );
  if (definition?.[key]) return true;
  if (
    key === 'ganking' &&
    definition?.ifDiscardedThisTurn?.ganking &&
    state.discardedThisTurn?.includes(unit.ownerId)
  )
    return true;
  return !!definition?.mightyKeywords && effectiveMight(unit, state) >= 5;
}
