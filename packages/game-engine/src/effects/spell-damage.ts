import type { ActionResult, GameState, UnitState } from '../types.js';
import { spellAbilityDamageBonus } from './damage-bonus.js';

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
  const amount = baseAmount + spellAbilityDamageBonus(state, casterId);
  const ids = new Set(targets.map((u) => u.id));
  return {
    ok: true,
    state: {
      ...state,
      units: state.units.map((u) =>
        ids.has(u.id) ? { ...u, damage: u.damage + amount } : u,
      ),
    },
    events: targets.map((u) => ({
      type: 'spell-damage',
      cardId,
      unitId: u.id,
      amount,
    })),
  };
}
