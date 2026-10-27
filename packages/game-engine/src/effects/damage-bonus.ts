import type { GameState } from '../types.js';

/** État + propriétaire de l'effet -> bonus continu à ajouter à chaque instance
 * de dégâts de sort/capacité. Cumule les sources alliées encore en jeu, toutes zones,
 * Ready ou Tap. Ne doit jamais être appelé pour un combat ou un duel d'unités.
 * Les capacités infligeant des dégâts seront raccordées lors de leur introduction. */
export function spellAbilityDamageBonus(
  state: GameState,
  playerId: string,
): number {
  return state.units.reduce((sum, source) => {
    if (source.ownerId !== playerId) return sum;
    return (
      sum +
      (state.unitDefinitions?.find((d) => d.id === source.definitionId)
        ?.spellAbilityDamageBonus ?? 0)
    );
  }, 0);
}
