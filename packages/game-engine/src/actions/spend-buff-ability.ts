import type { ActionResult, GameAction, GameState } from '../types.js';
import type { PlayEffectEntry } from '../effects/play-effect.js';
import { spendBuff } from '../effects/buff.js';

/** « Spend my buff » : son tour, Main en état ouvert ; unité alliée buffée dotée de la
 * capacité -> buff dépensé (coût) et bonus de Might empilé (réactions possibles). */
export function spendBuffAbility(
  state: GameState,
  action: Extract<GameAction, { type: 'spend-buff-ability' }>,
): ActionResult {
  if (
    state.phase !== 'main' ||
    state.activePlayerId !== action.playerId ||
    state.stack ||
    state.showdown
  )
    return { ok: false, reason: 'ABILITY_WINDOW_CLOSED' };
  const unit = state.units.find(
    (u) => u.id === action.unitId && u.ownerId === action.playerId,
  );
  const might = state.unitDefinitions?.find(
    (d) => d.id === unit?.definitionId,
  )?.buffSpendMight;
  if (!unit || !might) return { ok: false, reason: 'NO_ABILITY' };
  const spent = spendBuff(state, unit.id);
  if (!spent) return { ok: false, reason: 'NOT_BUFFED' };
  const entry: PlayEffectEntry = {
    kind: 'play-effect',
    sourceId: unit.id,
    ownerId: action.playerId,
    effect: { type: 'self-might', amount: might },
  };
  return {
    ok: true,
    state: {
      ...spent,
      stack: {
        entries: [entry],
        initiatorId: action.playerId,
        priorityPlayerId: action.playerId,
        consecutivePasses: 0,
      },
    },
    events: [{ type: 'unit-play-effect-queued', sourceId: unit.id }],
  };
}
