import type { GameState, UnitState, ActionResult } from '../types.js';
import { syncAttachments } from './attachments.js';
/** Unité en jeu + zone hors terrain de son propriétaire -> carte sans état de combat.
 * Jeton : disparition. Détache les équipements sans mort ni déclenchement de mort.
 * L'appelant vérifie la cible ; zone absente : erreur de configuration. */
export function leaveBoard(
  state: GameState,
  unit: UnitState,
  kind: 'hand' | 'graveyard' | 'banished',
): Extract<ActionResult, { ok: true }> {
  const zone = state.zones.find(
    (z) => z.kind === kind && z.ownerId === unit.ownerId,
  );
  if (!zone) throw new Error('Zone de sortie absente.');
  const units = state.units.filter((u) => u.id !== unit.id);
  const next: GameState = {
    ...state,
    units,
    cards: unit.token
      ? state.cards
      : [
          ...state.cards,
          {
            id: unit.id,
            definitionId: unit.definitionId,
            ownerId: unit.ownerId,
            zoneId: zone.id,
          },
        ],
    battlefields: state.battlefields.map((f) =>
      f.zoneId !== state.showdown?.battlefieldId &&
      !units.some((u) => u.zoneId === f.zoneId && u.ownerId === f.controllerId)
        ? { ...f, controllerId: null }
        : f,
    ),
  };
  const attached = syncAttachments(next);
  return {
    ...attached,
    events: [
      { type: 'unit-left-board', unitId: unit.id, zoneId: zone.id },
      ...attached.events,
    ],
  };
}
