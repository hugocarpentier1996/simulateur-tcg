import type { AttackDamageTrigger } from './attack-targets.js';
import type { ActionResult, GameEvent, GameState } from '../types.js';
import { dealEffectDamage } from './effect-damage.js';
import { settleLethalUnits } from './lethal-units.js';
/** Condition « ennemi Ready ici » attachée au champ de l'attaque, vérifiée avant et après réactions. */
export interface AttackEntry {
  kind: 'attack';
  sourceId: string;
  ownerId: string;
  battlefieldId: string;
  amount: number;
  /** Absent : bonus si un ennemi est Ready (Dune Drake). Les autres effets visent les
   * ennemis du champ à la résolution, que la source y soit encore ou non. */
  mode?: 'damage-enemies-here' | 'kill-damaged-enemies-here';
}
function hasReadyEnemy(
  state: GameState,
  ownerId: string,
  battlefieldId: string,
) {
  return state.units.some(
    (u) => u.ownerId !== ownerId && u.zoneId === battlefieldId && u.ready,
  );
}
/** Début/reprise d'un combat ou arrivée d'un attaquant -> capacités conditionnelles.
 * Aucun déclenchement en Open, en défense ou sur de simples passes. Ordre des unités déterministe. */
export function queueAttackEffects(
  before: GameState,
  state: GameState,
  events: readonly GameEvent[],
): Extract<ActionResult, { ok: true }> {
  const combat = state.showdown;
  if (state.result || combat?.kind !== 'combat' || combat.stage !== 'priority')
    return { ok: true, state, events: [] };
  const begins =
    before.showdown?.kind !== 'combat' ||
    before.showdown.battlefieldId !== combat.battlefieldId ||
    events.some((e) => e.type === 'combat-restarted');
  const entries: AttackEntry[] = [];
  const targeted: AttackDamageTrigger[] = [];
  for (const u of state.units) {
    const arrived = events.some(
      (e) =>
        e.type === 'unit-moved' &&
        e.unitId === u.id &&
        e.to === combat.battlefieldId &&
        e.from !== e.to,
    );
    if (
      u.ownerId !== combat.initiatorId ||
      u.zoneId !== combat.battlefieldId ||
      !(begins || arrived)
    )
      continue;
    const definition = state.unitDefinitions?.find(
      (d) => d.id === u.definitionId,
    );
    if (definition?.onAttackDamage !== undefined)
      targeted.push({
        sourceId: u.id,
        ownerId: u.ownerId,
        battlefieldId: combat.battlefieldId,
        amount: definition.onAttackDamage,
      });
    if (definition?.onAttackTargetEffect)
      targeted.push({
        sourceId: u.id,
        ownerId: u.ownerId,
        battlefieldId: combat.battlefieldId,
        amount: 0,
        effect: definition.onAttackTargetEffect.type,
      });
    if (definition?.onAttackDamageEnemiesHere !== undefined)
      entries.push({
        kind: 'attack',
        sourceId: u.id,
        ownerId: u.ownerId,
        battlefieldId: combat.battlefieldId,
        amount: definition.onAttackDamageEnemiesHere,
        mode: 'damage-enemies-here',
      });
    if (definition?.onAttackKillDamagedEnemiesHere)
      entries.push({
        kind: 'attack',
        sourceId: u.id,
        ownerId: u.ownerId,
        battlefieldId: combat.battlefieldId,
        amount: 0,
        mode: 'kill-damaged-enemies-here',
      });
    if (
      definition?.onAttackReadyEnemyMightBonus !== undefined &&
      hasReadyEnemy(state, u.ownerId, combat.battlefieldId)
    )
      entries.push({
        kind: 'attack',
        sourceId: u.id,
        ownerId: u.ownerId,
        battlefieldId: combat.battlefieldId,
        amount: definition.onAttackReadyEnemyMightBonus,
      });
  }
  if (!entries.length && !targeted.length)
    return { ok: true, state, events: [] };
  return {
    ok: true,
    state: {
      ...state,
      ...(targeted.length
        ? {
            pendingAttackChoices: [
              ...(state.pendingAttackChoices ?? []),
              ...targeted,
            ],
          }
        : {}),
      stack: {
        entries: [...(state.stack?.entries ?? []), ...entries],
        initiatorId: state.stack?.initiatorId ?? combat.initiatorId,
        priorityPlayerId: combat.initiatorId,
        consecutivePasses: 0,
      },
    },
    events: entries.map((e) => ({
      type: 'attack-effect-queued',
      sourceId: e.sourceId,
    })),
  };
}
/** Sommet -> bonus jusqu'à la fin du tour si la source attaque toujours ici et qu'un ennemi est Ready.
 * Une condition devenue fausse ignore le bonus, sans nouveau choix ni remboursement. */
export function resolveAttackEffect(
  state: GameState,
  entry: AttackEntry,
): Extract<ActionResult, { ok: true }> {
  const resolved = {
    type: 'attack-effect-resolved' as const,
    sourceId: entry.sourceId,
  };
  if (entry.mode) {
    const enemies = state.units.filter(
      (u) => u.ownerId !== entry.ownerId && u.zoneId === entry.battlefieldId,
    );
    if (entry.mode === 'kill-damaged-enemies-here') {
      const killed = settleLethalUnits(
        state,
        new Set(enemies.filter((u) => u.damage > 0).map((u) => u.id)),
      );
      return {
        ok: true,
        state: killed.state,
        events: [...killed.events, resolved],
      };
    }
    const damaged = dealEffectDamage(
      state,
      { kind: 'ability', sourceId: entry.sourceId, playerId: entry.ownerId },
      enemies,
      entry.amount,
    );
    const settled = settleLethalUnits(damaged.state);
    return {
      ok: true,
      state: settled.state,
      events: [...damaged.events, ...settled.events, resolved],
    };
  }
  const combat = state.showdown;
  const valid =
    combat?.kind === 'combat' &&
    combat.battlefieldId === entry.battlefieldId &&
    combat.initiatorId === entry.ownerId &&
    hasReadyEnemy(state, entry.ownerId, entry.battlefieldId);
  return {
    ok: true,
    state: valid
      ? {
          ...state,
          units: state.units.map((u) =>
            u.id === entry.sourceId &&
            u.ownerId === entry.ownerId &&
            u.zoneId === entry.battlefieldId
              ? {
                  ...u,
                  temporaryEffects: [
                    ...(u.temporaryEffects ?? []),
                    { type: 'modify-might', amount: entry.amount },
                  ],
                }
              : u,
          ),
        }
      : state,
    events: [{ type: 'attack-effect-resolved', sourceId: entry.sourceId }],
  };
}
