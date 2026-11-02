import { hasKeyword } from '../effects/modifiers.js';
import type { GameState, GameAction, UnitBlueprint } from '../types.js';
import type { SpellBlueprint } from '../spell-types.js';
/** Choix individuels adverses -> un Power quelconque par Deflect ; les zones ne passent pas ici.
 * Ne paie rien : retourne le coût total à soumettre au paiement atomique commun. */
export function withDeflect(
  state: GameState,
  playerId: string,
  cost: UnitBlueprint['cost'],
  ids: readonly string[],
): UnitBlueprint['cost'] {
  const tax = [...new Set(ids)].reduce((sum, id) => {
    const unit = state.units.find(
      (u) =>
        u.id === id &&
        u.ownerId !== playerId &&
        hasKeyword(u, state, 'deflect'),
    );
    return unit
      ? sum +
          (state.unitDefinitions?.find((d) => d.id === unit.definitionId)
            ?.deflectAmount ?? 1)
      : sum;
  }, 0);
  return tax ? { ...cost, genericPower: (cost.genericPower ?? 0) + tax } : cost;
}
/** Unités choisies soumises à la taxe Deflect (ennemies avec Deflect). */
export function deflectedUnits(
  state: GameState,
  playerId: string,
  ids: readonly string[],
): string[] {
  return [...new Set(ids)].filter((id) => {
    const unit = state.units.find((u) => u.id === id);
    return (
      !!unit && unit.ownerId !== playerId && hasKeyword(unit, state, 'deflect')
    );
  });
}
/** Extrait seulement les unités réellement choisies par le texte du sort, jamais son champ cible. */
export function spellChosenUnits(
  definition: SpellBlueprint,
  action: Extract<GameAction, { type: 'cast-spell' }>,
): string[] {
  // Toute seconde cible et toute sélection d'unités désignent des unités choisies.
  return [
    ...(definition.target.kind === 'unit' ? [action.targetId] : []),
    ...(action.secondaryTargetId ? [action.secondaryTargetId] : []),
    ...(action.selectedUnitIds ?? []),
  ];
}
