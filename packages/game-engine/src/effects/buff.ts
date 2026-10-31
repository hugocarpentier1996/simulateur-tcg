import type { GameState } from '../types.js';

/** Buff : une unité sans buff en reçoit un (+1 Might permanent tant qu'elle reste en jeu) ;
 * une unité déjà buffée reste inchangée. Unité absente : état inchangé. */
export function buffUnit(state: GameState, unitId: string): GameState {
  if (!state.units.some((u) => u.id === unitId && !u.buffed)) return state;
  return {
    ...state,
    units: state.units.map((u) =>
      u.id === unitId ? { ...u, buffed: true } : u,
    ),
  };
}

/** Dépense le buff d'une unité (coût) : null si elle n'en a pas. */
export function spendBuff(state: GameState, unitId: string): GameState | null {
  const unit = state.units.find((u) => u.id === unitId);
  if (!unit?.buffed) return null;
  return {
    ...state,
    units: state.units.map((u) => {
      if (u.id !== unitId) return u;
      const next = { ...u };
      delete next.buffed;
      return next;
    }),
  };
}
