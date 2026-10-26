import type { ActionResult, GameState } from '../types.js';

/** État + frontière de phase -> réserves flottantes de tous les joueurs à zéro.
 * Les runes physiques, leurs couleurs et leur état Ready/Tap restent inchangés. */
export function clearResources(
  state: GameState,
  boundary: 'end' | 'draw',
): Extract<ActionResult, { ok: true }> {
  return {
    ok: true,
    state: {
      ...state,
      resources: Object.fromEntries(
        state.players.map((player) => [player.id, { energy: 0, power: {} }]),
      ),
    },
    events: [{ type: 'resources-cleared', boundary }],
  };
}
