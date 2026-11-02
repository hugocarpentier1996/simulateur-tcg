import type { GameState } from '../types.js';

/** Perte de contrôle des champs (réponse 18) : seulement en état ouvert — aucune pile, aucun
 * choix en attente — et hors du champ d'un showdown en cours (sa fin tranche). Un champ dont
 * le contrôleur n'a plus aucune carte visible (unité ou gear) devient neutre. Un champ vidé
 * puis réoccupé avant le retour à l'état ouvert (Deathknell qui réinvoque) reste contrôlé. */
export function settleControl(state: GameState): GameState {
  if (
    state.stack?.entries.length ||
    state.pendingModeChoice ||
    state.pendingVision ||
    state.pendingDiscard ||
    state.pendingPick ||
    state.pendingDeaths ||
    state.pendingAttackChoices?.length ||
    state.pendingDefenseShield ||
    state.pendingHoldChannel
  )
    return state;
  const visible = (playerId: string, zoneId: string) =>
    state.units.some((u) => u.ownerId === playerId && u.zoneId === zoneId) ||
    (state.gears ?? []).some(
      (g) => g.ownerId === playerId && g.zoneId === zoneId,
    );
  let changed = false;
  const battlefields = state.battlefields.map((f) => {
    if (
      !f.controllerId ||
      f.zoneId === state.showdown?.battlefieldId ||
      visible(f.controllerId, f.zoneId)
    )
      return f;
    changed = true;
    return { ...f, controllerId: null };
  });
  return changed ? { ...state, battlefields } : state;
}
