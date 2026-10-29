import type {
  GameState,
  GameAction,
  ActionResult,
  PaymentPlan,
  GameEvent,
} from '../types.js';
import { withDeflect } from '../cost/deflect.js';
import { payCost } from '../cost/payment.js';
import { findPayment } from '../legal/payment.js';
import { dealEffectDamage } from './effect-damage.js';
import { settleLethalUnits } from './lethal-units.js';
export interface AttackDamageTrigger {
  sourceId: string;
  ownerId: string;
  battlefieldId: string;
  amount: number;
}
export interface AttackDamageEntry extends AttackDamageTrigger {
  kind: 'attack-damage';
  targetId?: string;
}
const free = { energy: 0, power: {} };
type Selection = { sourceId: string; targetId?: string; payment: PaymentPlan };
/** Ennemis ici dont Deflect peut être payé ; aucun choix payable -> capacité sans cible. */
function options(state: GameState, t: AttackDamageTrigger): Selection[] {
  const choices = state.units
    .filter((u) => u.ownerId !== t.ownerId && u.zoneId === t.battlefieldId)
    .flatMap((u) => {
      const payment = findPayment(
        state,
        t.ownerId,
        withDeflect(state, t.ownerId, free, [u.id]),
      );
      return payment ? [{ sourceId: t.sourceId, targetId: u.id, payment }] : [];
    });
  return choices.length
    ? choices
    : [{ sourceId: t.sourceId, payment: { energyRunes: [], powerRunes: [] } }];
}
/** Tous les choix du propriétaire attendu, dans son ordre d'empilement ; coûts payés avant réactions.
 * Refus atomique des sources manquantes/dupliquées, cibles illégales ou paiements insuffisants. */
export function chooseAttackTargets(
  state: GameState,
  action: Extract<GameAction, { type: 'choose-attack-targets' }>,
): ActionResult {
  const pending = state.pendingAttackChoices;
  if (!pending?.length) return { ok: false, reason: 'NO_ATTACK_CHOICES' };
  if (pending[0]!.ownerId !== action.playerId)
    return { ok: false, reason: 'NO_PRIORITY' };
  const owned = pending.filter((t) => t.ownerId === action.playerId);
  if (
    action.effects.length !== owned.length ||
    new Set(action.effects.map((e) => e.sourceId)).size !== owned.length
  )
    return { ok: false, reason: 'INVALID_ATTACK_CHOICES' };
  let next = state;
  const entries: AttackDamageEntry[] = [];
  const events: GameEvent[] = [];
  for (const choice of action.effects) {
    const t = owned.find((t) => t.sourceId === choice.sourceId);
    if (!t || !options(next, t).some((o) => o.targetId === choice.targetId))
      return { ok: false, reason: 'INVALID_TARGET' };
    const cost = withDeflect(
      next,
      action.playerId,
      free,
      choice.targetId ? [choice.targetId] : [],
    );
    const paid = payCost(next, action.playerId, cost, choice.payment);
    if (!paid.ok) return paid;
    next = paid.state;
    entries.push({
      ...t,
      kind: 'attack-damage',
      ...(choice.targetId ? { targetId: choice.targetId } : {}),
    });
    if (cost.genericPower)
      events.push({
        type: 'cost-paid',
        playerId: action.playerId,
        cardId: t.sourceId,
        ...cost,
      });
  }
  const remaining = pending.filter((t) => t.ownerId !== action.playerId);
  return {
    ok: true,
    state: {
      ...next,
      pendingAttackChoices: remaining.length ? remaining : null,
      stack: {
        entries: [...(next.stack?.entries ?? []), ...entries],
        initiatorId: next.stack?.initiatorId ?? action.playerId,
        priorityPlayerId: next.showdown?.initiatorId ?? next.activePlayerId,
        consecutivePasses: 0,
      },
    },
    events: [
      ...events,
      ...entries.map((e) => ({
        type: 'attack-effect-queued' as const,
        sourceId: e.sourceId,
      })),
    ],
  };
}
/** Actions de choix complètes, paiements successifs et ordres possibles ; aucun état modifié. */
export function* attackTargetActions(
  state: GameState,
  playerId: string,
): Generator<GameAction> {
  if (state.pendingAttackChoices?.[0]?.ownerId !== playerId) return;
  function* combinations(
    current: GameState,
    remaining: AttackDamageTrigger[],
    chosen: Selection[],
  ): Generator<GameAction> {
    if (!remaining.length) {
      yield { type: 'choose-attack-targets', playerId, effects: chosen };
      return;
    }
    for (const t of remaining)
      for (const choice of options(current, t)) {
        const paid = payCost(
          current,
          playerId,
          withDeflect(
            current,
            playerId,
            free,
            choice.targetId ? [choice.targetId] : [],
          ),
          choice.payment,
        );
        if (paid.ok)
          yield* combinations(
            paid.state,
            remaining.filter((r) => r.sourceId !== t.sourceId),
            [...chosen, choice],
          );
      }
  }
  yield* combinations(
    state,
    state.pendingAttackChoices.filter((t) => t.ownerId === playerId),
    [],
  );
}
/** Capacité ciblée -> dégâts de capacité, puis morts ; source sortie du terrain ou cible hors champ ignorée. */
export function resolveAttackDamage(
  state: GameState,
  entry: AttackDamageEntry,
): Extract<ActionResult, { ok: true }> {
  const target = state.units.find(
    (u) =>
      u.id === entry.targetId &&
      u.ownerId !== entry.ownerId &&
      u.zoneId === entry.battlefieldId,
  );
  const damaged =
    target && state.units.some((u) => u.id === entry.sourceId)
      ? dealEffectDamage(
          state,
          {
            kind: 'ability',
            sourceId: entry.sourceId,
            playerId: entry.ownerId,
          },
          [target],
          entry.amount,
        )
      : { ok: true as const, state, events: [] };
  const settled = settleLethalUnits(damaged.state);
  return {
    ...settled,
    events: [
      ...damaged.events,
      ...settled.events,
      { type: 'attack-effect-resolved', sourceId: entry.sourceId },
    ],
  };
}
