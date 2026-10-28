import { summonToken } from './summon-token.js';
import type {
  ActionResult,
  GameState,
  GameAction,
  UnitState,
} from '../types.js';
import type { DeathEntry, DeathTrigger } from '../death-types.js';
import { canSummonAt } from '../actions/unit-destination.js';

/** Morts identifiés -> déclenchements de confiance dans l'ordre attaquant puis défenseur.
 * Les choix de destination n'ont lieu qu'après le transfert au cimetière. */
export function deathTriggers(
  state: GameState,
  dead: readonly UnitState[],
): DeathTrigger[] {
  return dead.flatMap((unit) => {
    const effect = state.unitDefinitions?.find(
      (d) => d.id === unit.definitionId,
    )?.onDeath;
    return effect ? [{ sourceId: unit.id, ownerId: unit.ownerId, effect }] : [];
  });
}

/** Liste complète ordonnée des effets du joueur attendu -> empilement, sans résolution.
 * Refuse omission/doublon, mauvais joueur ou destination non contrôlée. Le dernier effet
 * fourni résoudra en premier. Aucune réaction avant que tous les choix soient terminés. */
export function queueDeathEffects(
  state: GameState,
  action: Extract<GameAction, { type: 'queue-death-effects' }>,
): ActionResult {
  const pending = state.pendingDeaths;
  if (!pending || pending.playerOrder[0] !== action.playerId)
    return { ok: false, reason: 'NO_DEATH_CHOICE' };
  const own = pending.triggers.filter((t) => t.ownerId === action.playerId);
  if (
    action.effects.length !== own.length ||
    new Set(action.effects.map((e) => e.sourceId)).size !== own.length ||
    action.effects.some(
      (e) =>
        !own.some((t) => t.sourceId === e.sourceId) ||
        !canSummonAt(state, action.playerId, e.destinationId),
    )
  )
    return { ok: false, reason: 'INVALID_DEATH_CHOICES' };
  const entries: DeathEntry[] = action.effects.map((e) => ({
    ...own.find((t) => t.sourceId === e.sourceId)!,
    kind: 'death',
    destinationId: e.destinationId,
  }));
  const first = state.showdown?.initiatorId ?? state.activePlayerId;
  const remaining = pending.playerOrder.slice(1);
  return {
    ok: true,
    state: {
      ...state,
      pendingDeaths: remaining.length
        ? {
            ...pending,
            playerOrder: remaining,
            triggers: pending.triggers.filter(
              (t) => t.ownerId !== action.playerId,
            ),
          }
        : null,
      stack: {
        entries: [...(state.stack?.entries ?? []), ...entries],
        initiatorId: state.stack?.initiatorId ?? first,
        priorityPlayerId: first,
        consecutivePasses: 0,
      },
    },
    events: [
      {
        type: 'death-effects-queued',
        playerId: action.playerId,
        sourceIds: action.effects.map((e) => e.sourceId),
      },
    ],
  };
}

/** Effet du sommet -> jeton Tap sans paiement ; vérifie à nouveau le contrôle.
 * Si la destination n'est plus légale, l'invocation est ignorée. IDs déterministes,
 * distincts des cartes existantes ; les jetons ne rejoignent pas le cimetière à leur mort. */
export function resolveDeathEffect(
  state: GameState,
  entry: DeathEntry,
): Extract<ActionResult, { ok: true }> {
  const events: Extract<ActionResult, { ok: true }>['events'] = [
    { type: 'death-effect-resolved', sourceId: entry.sourceId },
  ];
  const summoned = summonToken(
    state,
    entry.ownerId,
    entry.destinationId,
    entry.effect.definitionId,
  );
  return { ...summoned, events: [...events, ...summoned.events] };
}
