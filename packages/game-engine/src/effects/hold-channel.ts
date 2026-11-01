import type { GameState, ActionResult, GameAction } from '../types.js';
import { battlefieldDefinition } from './battlefield.js';
import { channelForPlayer } from '../turn/supplies.js';
import { continueStack } from '../actions/continue-stack.js';
export interface HoldChannelEntry {
  kind: 'hold-channel';
  ownerId: string;
  battlefieldId: string;
  count: number;
}
/** Tenue effectivement scorée -> capacité obligatoire sur la pile, choix facultatif à la résolution.
 * Aucun effet après victoire. La conquête n'appelle pas ce traitement. */
export function queueHoldChannel(
  state: GameState,
  playerId: string,
  battlefieldId: string,
): GameState {
  const count = battlefieldDefinition(state, battlefieldId)?.holdChannel;
  if (state.result || !count) return state;
  const entry: HoldChannelEntry = {
    kind: 'hold-channel',
    ownerId: playerId,
    battlefieldId,
    count,
  };
  return {
    ...state,
    stack: {
      entries: [...(state.stack?.entries ?? []), entry],
      initiatorId: state.stack?.initiatorId ?? playerId,
      priorityPlayerId: state.activePlayerId,
      consecutivePasses: 0,
    },
  };
}
/** Capacité dépilée après réactions -> choix accepter/refuser, sans ouvrir de nouvelle fenêtre. */
export function resolveHoldChannel(
  state: GameState,
  entry: HoldChannelEntry,
): Extract<ActionResult, { ok: true }> {
  return {
    ok: true,
    state: { ...state, pendingHoldChannel: entry },
    events: [],
  };
}
/** Propriétaire de la capacité -> Channel Tap facultatif, puis reprise de pile.
 * Pile de runes vide : aucun effet ; mauvais joueur/fenêtre : refus sans mutation. */
export function chooseHoldChannel(
  state: GameState,
  action: Extract<GameAction, { type: 'choose-hold-channel' }>,
): ActionResult {
  const p = state.pendingHoldChannel;
  if (!p) return { ok: false, reason: 'NO_HOLD_CHANNEL_CHOICE' };
  if (p.ownerId !== action.playerId)
    return { ok: false, reason: 'NO_PRIORITY' };
  const cleared = { ...state, pendingHoldChannel: null };
  const result = action.accept
    ? channelForPlayer(cleared, p.ownerId, p.count, false)
    : { ok: true as const, state: cleared, events: [] };
  return continueStack(result.state, [
    ...result.events,
    {
      type: 'battlefield-effect-resolved',
      battlefieldId: p.battlefieldId,
      playerId: p.ownerId,
    },
  ]);
}

/** Tenue d'un champ holdDraw / holdSummonBase -> pioche (entrée legend-draw) et/ou jeton
 * dans la base du contrôleur (entrée play-effect), empilés. */
export function queueHoldDraw(
  state: GameState,
  playerId: string,
  battlefieldId: string,
): GameState {
  const definition = battlefieldDefinition(state, battlefieldId);
  const count = definition?.holdDraw;
  const token = definition?.holdSummonBase;
  const base = state.zones.find(
    (z) => z.kind === 'base' && z.ownerId === playerId,
  );
  const buffTarget = definition?.holdBuffHere
    ? [...state.units]
        .filter((u) => u.ownerId === playerId && u.zoneId === battlefieldId)
        .sort((x, y) => Number(!!x.buffed) - Number(!!y.buffed))[0]?.id
    : undefined;
  if (state.result || (!count && !(token && base) && !buffTarget)) return state;
  return {
    ...state,
    stack: {
      entries: [
        ...(state.stack?.entries ?? []),
        ...(count
          ? [
              {
                kind: 'legend-draw' as const,
                sourceId: battlefieldId,
                ownerId: playerId,
                count,
              },
            ]
          : []),
        ...(buffTarget
          ? [
              {
                kind: 'play-effect' as const,
                sourceId: battlefieldId,
                ownerId: playerId,
                effect: {
                  type: 'targeted' as const,
                  targetId: buffTarget,
                  effect: { type: 'buff' as const },
                },
              },
            ]
          : []),
        ...(token && base
          ? [
              {
                kind: 'play-effect' as const,
                sourceId: battlefieldId,
                ownerId: playerId,
                effect: {
                  type: 'summon-base' as const,
                  destinationId: base.id,
                  definitionId: token,
                },
              },
            ]
          : []),
      ],
      initiatorId: state.stack?.initiatorId ?? playerId,
      priorityPlayerId: state.activePlayerId,
      consecutivePasses: 0,
    },
  };
}
