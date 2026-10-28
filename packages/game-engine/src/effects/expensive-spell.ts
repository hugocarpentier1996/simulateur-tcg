import type { ActionResult, GameState } from '../types.js';

/** Bonus déclenché indépendant du sort : source et montant figés au lancement.
 * Pas de cible à choisir. La source doit encore être une unité en jeu à la résolution. */
export interface SpellPlayEntry {
  kind: 'spell-play';
  sourceId: string;
  ownerId: string;
  amount: number;
}

/** Lancement accepté + coût imprimé -> bonus à empiler après le sort.
 * Une entrée par unité alliée portant cette capacité, quel que soit Ready/Tap ou sa zone.
 * Ordre déterministe des unités pour cette première capacité sans choix. */
export function expensiveSpellTriggers(
  state: GameState,
  playerId: string,
  energy: number,
): SpellPlayEntry[] {
  return state.units.flatMap((unit) => {
    const effect = state.unitDefinitions?.find(
      (d) => d.id === unit.definitionId,
    )?.onExpensiveSpell;
    return unit.ownerId === playerId && effect && energy >= effect.minimumEnergy
      ? [
          {
            kind: 'spell-play' as const,
            sourceId: unit.id,
            ownerId: playerId,
            amount: effect.mightBonus,
          },
        ]
      : [];
  });
}

/** Sommet de pile -> bonus temporaire sur la source encore présente, sinon aucun bonus.
 * Ne rejoue pas le sort et ne déclenche pas une nouvelle capacité. */
export function resolveSpellPlay(
  state: GameState,
  entry: SpellPlayEntry,
): Extract<ActionResult, { ok: true }> {
  return {
    ok: true,
    state: {
      ...state,
      units: state.units.map((unit) =>
        unit.id === entry.sourceId
          ? {
              ...unit,
              temporaryEffects: [
                ...(unit.temporaryEffects ?? []),
                { type: 'modify-might' as const, amount: entry.amount },
              ],
            }
          : unit,
      ),
    },
    events: [{ type: 'spell-play-effect-resolved', sourceId: entry.sourceId }],
  };
}
