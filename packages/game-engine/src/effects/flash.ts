import type { ActionResult, GameState, GameEvent } from '../types.js';

/** Choix au lancement -> sélection explicite de 0 à 2 alliés distincts et base existante.
 * Refus des absents/adversaires/doublons. Ready/Tap n'intervient jamais. */
export function validFlashSelection(
  state: GameState,
  playerId: string,
  ids?: readonly string[],
): boolean {
  return (
    !!ids &&
    ids.length <= 2 &&
    new Set(ids).size === ids.length &&
    state.zones.some((z) => z.kind === 'base' && z.ownerId === playerId) &&
    ids.every((id) =>
      state.units.some((u) => u.id === id && u.ownerId === playerId),
    )
  );
}

/** Sélection payée -> déplacement simultané en base des alliés encore présents.
 * Conserve dégâts, Ready/Tap, modificateurs et attachements. Une cible devenue
 * illégale est ignorée indépendamment. Déjà en base : aucun déplacement émis.
 * Ne soigne pas, ne score pas ; conserve le contrôleur du showdown actif. */
export function resolveFlash(
  state: GameState,
  playerId: string,
  ids: readonly string[],
): Extract<ActionResult, { ok: true }> {
  const base = state.zones.find(
    (z) => z.kind === 'base' && z.ownerId === playerId,
  );
  if (!base) throw new Error('Base absente pour Flash.');
  const selected = new Set(ids);
  const events: GameEvent[] = [];
  const units = state.units.map((u) => {
    if (!selected.has(u.id) || u.ownerId !== playerId || u.zoneId === base.id)
      return u;
    events.push({
      type: 'unit-moved',
      unitId: u.id,
      from: u.zoneId,
      to: base.id,
    });
    return { ...u, zoneId: base.id };
  });
  return {
    ok: true,
    state: {
      ...state,
      units,
      battlefields: state.battlefields.map((f) =>
        f.zoneId !== state.showdown?.battlefieldId &&
        !units.some(
          (u) => u.ownerId === f.controllerId && u.zoneId === f.zoneId,
        )
          ? { ...f, controllerId: null }
          : f,
      ),
    },
    events,
  };
}
