import type { GameState } from '../types.js';
import { battlefieldDefinition } from '../effects/battlefield.js';

/** Joueur -> points nécessaires pour gagner : seuil du joueur (8 par défaut) plus les
 * bonus des champs en jeu (Aspirant's Climb). */
export function victoryTarget(state: GameState, playerId: string): number {
  const base = state.players.find((p) => p.id === playerId)?.victoryTarget ?? 8;
  return (
    base +
    state.battlefields.reduce(
      (sum, f) =>
        sum + (battlefieldDefinition(state, f.zoneId)?.victoryTargetBonus ?? 0),
      0,
    )
  );
}
