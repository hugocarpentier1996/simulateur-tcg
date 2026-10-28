import type { ActionResult, GameEvent, GameState } from '../types.js';
/** Condition « ennemi Ready ici » attachée au champ de l'attaque, vérifiée avant et après réactions. */
export interface AttackEntry {
  kind: 'attack';
  sourceId: string;
  ownerId: string;
  battlefieldId: string;
  amount: number;
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
  const entries: AttackEntry[] = state.units.flatMap((u) => {
    const amount = state.unitDefinitions?.find(
      (d) => d.id === u.definitionId,
    )?.onAttackReadyEnemyMightBonus;
    const arrived = events.some(
      (e) =>
        e.type === 'unit-moved' &&
        e.unitId === u.id &&
        e.to === combat.battlefieldId &&
        e.from !== e.to,
    );
    return amount !== undefined &&
      u.ownerId === combat.initiatorId &&
      u.zoneId === combat.battlefieldId &&
      (begins || arrived) &&
      hasReadyEnemy(state, u.ownerId, combat.battlefieldId)
      ? [
          {
            kind: 'attack',
            sourceId: u.id,
            ownerId: u.ownerId,
            battlefieldId: combat.battlefieldId,
            amount,
          },
        ]
      : [];
  });
  if (!entries.length) return { ok: true, state, events: [] };
  return {
    ok: true,
    state: {
      ...state,
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
