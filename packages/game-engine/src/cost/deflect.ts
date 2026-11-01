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
  const tax = [...new Set(ids)].filter((id) =>
    state.units.some(
      (u) =>
        u.id === id &&
        u.ownerId !== playerId &&
        hasKeyword(u, state, 'deflect'),
    ),
  ).length;
  return tax ? { ...cost, genericPower: (cost.genericPower ?? 0) + tax } : cost;
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
