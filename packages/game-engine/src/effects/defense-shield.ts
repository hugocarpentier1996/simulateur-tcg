import type {
  ActionResult,
  GameAction,
  GameEvent,
  GameState,
} from '../types.js';
import { battlefieldDefinition } from './battlefield.js';
import { withDeflect } from '../cost/deflect.js';
import { payCost } from '../cost/payment.js';
import { findPayment } from '../legal/payment.js';
export interface DefenseShieldTrigger {
  ownerId: string;
  battlefieldId: string;
  amount: number;
}
export interface DefenseShieldEntry extends DefenseShieldTrigger {
  kind: 'defense-shield';
  targetId: string;
}
const free = { energy: 0, power: {} };
/** Début/reprise de Combat sur ce champ -> choix du défenseur ; jamais en Open ou à chaque passe. */
export function queueDefenseShield(
  before: GameState,
  state: GameState,
  events: readonly GameEvent[],
): GameState {
  const c = state.showdown;
  if (state.result || c?.kind !== 'combat' || c.stage !== 'priority')
    return state;
  const begins =
    before.showdown?.kind !== 'combat' ||
    before.showdown.battlefieldId !== c.battlefieldId ||
    events.some((e) => e.type === 'combat-restarted');
  const amount = battlefieldDefinition(state, c.battlefieldId)?.defenseShield;
  if (!begins || !amount) return state;
  return {
    ...state,
    pendingDefenseShield: {
      ownerId: c.defenderId,
      battlefieldId: c.battlefieldId,
      amount,
    },
  };
}
/** Choix avant réactions, toute unité selon le texte ; Deflect adverse reste dû.
 * Refus du mauvais joueur, d'une cible absente ou d'un paiement insuffisant, sans mutation. */
export function chooseDefenseShield(
  state: GameState,
  action: Extract<GameAction, { type: 'choose-defense-shield' }>,
): ActionResult {
  const p = state.pendingDefenseShield;
  if (!p) return { ok: false, reason: 'NO_DEFENSE_CHOICE' };
  if (p.ownerId !== action.playerId)
    return { ok: false, reason: 'NO_PRIORITY' };
  if (!state.units.some((u) => u.id === action.targetId))
    return { ok: false, reason: 'INVALID_TARGET' };
  const cost = withDeflect(state, p.ownerId, free, [action.targetId]);
  const paid = payCost(state, p.ownerId, cost, action.payment);
  if (!paid.ok) return paid;
  return {
    ok: true,
    state: {
      ...paid.state,
      pendingDefenseShield: null,
      stack: {
        entries: [
          ...(state.stack?.entries ?? []),
          { ...p, kind: 'defense-shield', targetId: action.targetId },
        ],
        initiatorId: state.stack?.initiatorId ?? state.showdown!.initiatorId,
        priorityPlayerId: state.showdown!.initiatorId,
        consecutivePasses: 0,
      },
    },
    events: [
      {
        type: 'battlefield-effect-queued',
        battlefieldId: p.battlefieldId,
        playerId: p.ownerId,
      },
    ],
  };
}
/** Choix payables du défenseur ; le demandeur ne reçoit aucun choix adverse. */
export function defenseShieldActions(
  state: GameState,
  playerId: string,
): GameAction[] {
  if (state.pendingDefenseShield?.ownerId !== playerId) return [];
  return state.units.flatMap((u) => {
    const payment = findPayment(
      state,
      playerId,
      withDeflect(state, playerId, free, [u.id]),
    );
    return payment
      ? [
          {
            type: 'choose-defense-shield' as const,
            playerId,
            targetId: u.id,
            payment,
          },
        ]
      : [];
  });
}
/** Après réactions -> Shield lié au combat courant ; cible disparue : aucun bonus.
 * Le rôle défenseur est vérifié lors du calcul de Might, pas lors du choix. */
export function resolveDefenseShield(
  state: GameState,
  entry: DefenseShieldEntry,
): Extract<ActionResult, { ok: true }> {
  const c = state.showdown;
  const valid =
    c?.kind === 'combat' &&
    c.battlefieldId === entry.battlefieldId &&
    state.units.some((u) => u.id === entry.targetId);
  return {
    ok: true,
    state: valid
      ? {
          ...state,
          showdown: {
            ...c,
            shieldBonuses: {
              ...c.shieldBonuses,
              [entry.targetId]:
                (c.shieldBonuses?.[entry.targetId] ?? 0) + entry.amount,
            },
          },
        }
      : state,
    events: [
      {
        type: 'battlefield-effect-resolved',
        battlefieldId: entry.battlefieldId,
        playerId: entry.ownerId,
      },
    ],
  };
}
