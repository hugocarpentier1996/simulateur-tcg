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
        state.unitDefinitions?.find((d) => d.id === u.definitionId)?.deflect,
    ),
  ).length;
  return tax ? { ...cost, genericPower: (cost.genericPower ?? 0) + tax } : cost;
}
/** Extrait seulement les unités réellement choisies par le texte du sort, jamais son champ cible. */
export function spellChosenUnits(
  definition: SpellBlueprint,
  action: Extract<GameAction, { type: 'cast-spell' }>,
): string[] {
  return [
    ...(definition.target.kind === 'unit' ? [action.targetId] : []),
    ...(definition.effects.some((e) => e.type === 'duel') &&
    action.secondaryTargetId
      ? [action.secondaryTargetId]
      : []),
    ...(definition.effects.some(
      (e) =>
        e.type === 'damage-selected-units' ||
        e.type === 'boost-selected-allies' ||
        e.type === 'move-up-to-two-allies-to-base',
    )
      ? (action.selectedUnitIds ?? [])
      : []),
  ];
}
