import type { ActionResult, GameEvent, GameState } from '../types.js';

/** Épuisement 1v1 -> +1 à l'adversaire ou les points manquants si rien n'est recyclable.
 * Seuil par joueur : victoryTarget, 8 par défaut. Source OTHER, dernier point autorisé.
 * La règle de bénéficiaire devra être définie avant de gérer l'épuisement en FFA. */
export function applyDeckPenalty(
  state: GameState,
  unrecoverable: boolean,
): Extract<ActionResult, { ok: true }> {
  const opponents = state.players.filter(
    (player) => player.id !== state.activePlayerId,
  );
  if (opponents.length !== 1)
    throw new Error(
      'La pénalité de deck exige un adversaire unique (règle FFA à définir).',
    );
  const opponent = opponents[0]!;
  const target = opponent.victoryTarget ?? 8;
  const amount = unrecoverable ? Math.max(0, target - opponent.score) : 1;
  const score = opponent.score + amount;
  const events: GameEvent[] = [
    {
      type: 'deck-penalty',
      playerId: opponent.id,
      drawingPlayerId: state.activePlayerId,
      amount,
      source: 'OTHER',
    },
  ];
  const next: GameState = {
    ...state,
    players: state.players.map((player) =>
      player.id === opponent.id ? { ...player, score } : player,
    ),
  };
  if (score >= target) {
    next.result = {
      winnerId: opponent.id,
      loserId: state.activePlayerId,
      reason: 'DECK_EXHAUSTION',
    };
    events.push({ type: 'game-ended', ...next.result });
  }
  return { ok: true, state: next, events };
}
