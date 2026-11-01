import type { GameState, UnitState } from '../types.js';

/** Unité cible + plateau -> somme des auras locales des autres unités alliées.
 * Même propriétaire et même zone, base comprise. Ni Ready ni Stun ne désactivent
 * une aura. Aucune mutation : le départ d'une source enlève aussitôt sa contribution. */
export function unitAuraMightBonus(unit: UnitState, state: GameState): number {
  return state.units.reduce((sum, source) => {
    if (
      source.id === unit.id ||
      source.ownerId !== unit.ownerId ||
      source.zoneId !== unit.zoneId
    )
      return sum;
    const definition = state.unitDefinitions?.find(
      (d) => d.id === source.definitionId,
    );
    const buffedBonus =
      unit.buffed && state.battlefields.some((f) => f.zoneId === unit.zoneId)
        ? (definition?.otherBuffedAlliesHereMight ?? 0)
        : 0;
    return sum + (definition?.otherAlliesHereMightBonus ?? 0) + buffedBonus;
  }, 0);
}

/** Bonus personnel continu dépendant du score de son propriétaire (Draven). */
export function selfScoreMightBonus(unit: UnitState, state: GameState): number {
  const definition = state.unitDefinitions?.find(
    (d) => d.id === unit.definitionId,
  );
  const trash = definition?.mightPerTrashCard
    ? definition.mightPerTrashCard *
      state.cards.filter((c) =>
        state.zones.some(
          (z) =>
            z.id === c.zoneId &&
            z.kind === 'graveyard' &&
            z.ownerId === unit.ownerId,
        ),
      ).length
    : 0;
  const perBuffed = definition?.mightPerBuffedAllyHere;
  const buffed =
    (unit.buffed ? (definition?.buffedExtraMight ?? 0) : 0) +
    (perBuffed && state.battlefields.some((f) => f.zoneId === unit.zoneId)
      ? perBuffed *
        state.units.filter(
          (u) =>
            u.ownerId === unit.ownerId && u.zoneId === unit.zoneId && u.buffed,
        ).length
      : 0);
  const perPoint = definition?.mightPerOwnPoint;
  if (!perPoint) return trash + buffed;
  const score = state.players.find((p) => p.id === unit.ownerId)?.score ?? 0;
  return trash + buffed + perPoint * score;
}

/** Joueur -> vrai si une de ses unités en jeu fait entrer Ready ses autres unités. */
export function alliesEnterReady(state: GameState, ownerId: string): boolean {
  return state.units.some(
    (u) =>
      u.ownerId === ownerId &&
      state.unitDefinitions?.find((d) => d.id === u.definitionId)
        ?.otherAlliesEnterReady,
  );
}

/** Mageseeker Warden : un adversaire de ce joueur a une telle unité sur un champ. */
export function wardenAgainst(state: GameState, playerId: string): boolean {
  return state.units.some(
    (u) =>
      u.ownerId !== playerId &&
      state.battlefields.some((f) => f.zoneId === u.zoneId) &&
      state.unitDefinitions?.find((d) => d.id === u.definitionId)
        ?.wardenLockdown,
  );
}
