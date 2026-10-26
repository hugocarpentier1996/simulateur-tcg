import type { ActionResult, GameState } from '../types.js';

/** Entrée serveur de confiance : un résultat entier de d20 par joueur, sans clé supplémentaire.
 * Égalité -> reste en attente d'une nouvelle paire ; sinon le gagnant choisira qui commence.
 * Ne pas exposer comme une intention client : le serveur produit les dés, le replay les conserve.
 * Refuse partie terminée, mauvaise étape ou résultats hors de 1..20. Aucune mutation. */
export function recordOpeningRoll(
  state: GameState,
  rolls: Readonly<Record<string, number>>,
): ActionResult {
  if (state.result) return { ok: false, reason: 'GAME_OVER' };
  if (state.setup?.stage !== 'roll')
    return { ok: false, reason: 'NO_ROLL_WINDOW' };
  if (state.players.length !== 2)
    return { ok: false, reason: 'UNSUPPORTED_MODE' };
  if (
    Object.keys(rolls).length !== state.players.length ||
    state.players.some(
      (p) =>
        !Object.hasOwn(rolls, p.id) ||
        !Number.isInteger(rolls[p.id]) ||
        rolls[p.id]! < 1 ||
        rolls[p.id]! > 20,
    )
  )
    return { ok: false, reason: 'INVALID_DICE_ROLL' };
  const highest = Math.max(...state.players.map((p) => rolls[p.id]!));
  const winners = state.players.filter((p) => rolls[p.id] === highest);
  const winnerId = winners.length === 1 ? winners[0]!.id : null;
  return {
    ok: true,
    state: {
      ...state,
      setup: winnerId
        ? { stage: 'choose-first', chooserId: winnerId }
        : { stage: 'roll' },
    },
    events: [{ type: 'opening-dice-rolled', rolls: { ...rolls }, winnerId }],
  };
}
