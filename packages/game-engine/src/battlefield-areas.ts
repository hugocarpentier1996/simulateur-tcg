import type { GameState, UnitState } from './types.js';

/** Sous-zone stable : un joueur sur un champ. « Allié/ennemi » dépend du point de vue,
 * jamais du contrôleur du battlefield. En 1v1 chaque unité occupe le côté de son propriétaire. */
export interface BattlefieldSide {
  readonly kind: 'battlefield-side';
  readonly battlefieldId: string;
  readonly playerId: string;
}
/** Portée explicite d'un effet de zone : champ entier ou côté particulier. */
export type BattlefieldArea =
  | BattlefieldSide
  | { readonly kind: 'battlefield'; readonly battlefieldId: string };
export type UnitLocation =
  BattlefieldSide | { readonly kind: 'zone'; readonly zoneId: string };

/** Champ existant -> côtés de tous les joueurs, même vides. Champ absent/non battlefield -> [].
 * Vue dérivée, sans état dupliqué à synchroniser lors des déplacements ou du contrôle. */
export function getBattlefieldSides(
  state: GameState,
  battlefieldId: string,
): BattlefieldSide[] {
  if (
    !state.battlefields.some((f) => f.zoneId === battlefieldId) ||
    !state.zones.some((z) => z.id === battlefieldId && z.kind === 'battlefield')
  )
    return [];
  return state.players.map((p) => ({
    kind: 'battlefield-side',
    battlefieldId,
    playerId: p.id,
  }));
}
/** ID d'unité -> position structurée courante, null si unité/zone absente.
 * Le stockage zoneId reste celui du battlefield parent ; ownerId détermine son côté.
 * Pas de règle d'alliance d'équipe ni de présence sur le côté adverse dans cette tranche. */
export function getUnitLocation(
  state: GameState,
  unitId: string,
): UnitLocation | null {
  const unit = state.units.find((u) => u.id === unitId);
  if (!unit) return null;
  const zone = state.zones.find((z) => z.id === unit.zoneId);
  if (!zone) return null;
  return zone.kind === 'battlefield'
    ? (getBattlefieldSides(state, zone.id).find(
        (side) => side.playerId === unit.ownerId,
      ) ?? null)
    : { kind: 'zone', zoneId: zone.id };
}
/** Union des zones -> unités dans l'ordre de l'état, chacune au plus une fois.
 * Références disparues/joueurs inconnus ignorés à la résolution ; aucune mutation. */
export function unitsInBattlefieldAreas(
  state: GameState,
  areas: readonly BattlefieldArea[],
): UnitState[] {
  const valid = areas.filter((area) => {
    const sides = getBattlefieldSides(state, area.battlefieldId);
    return area.kind === 'battlefield'
      ? sides.length > 0
      : sides.some((s) => s.playerId === area.playerId);
  });
  return state.units.filter((u) =>
    valid.some(
      (a) =>
        u.zoneId === a.battlefieldId &&
        (a.kind === 'battlefield' || u.ownerId === a.playerId),
    ),
  );
}
