import type { ActionResult, GameState, UnitState } from '../types.js';
import { dealEffectDamage } from './effect-damage.js';

/** Sort + lanceur + cibles déjà validées -> dégâts simultanés, bonus par unité touchée.
 * Les montants sont fixés avant toute mort. Pas de soin ni retrait des unités ici :
 * l'appelant traite les morts après le sort. Ne sert pas aux dégâts directs d'unités. */
export function dealSpellDamage(
  state: GameState,
  cardId: string,
  casterId: string,
  targets: readonly UnitState[],
  baseAmount: number,
): Extract<ActionResult, { ok: true }> {
  return dealEffectDamage(
    state,
    { kind: 'spell', cardId, playerId: casterId },
    targets,
    baseAmount,
  );
}
