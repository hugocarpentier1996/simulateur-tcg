import type { ActionResult, GameEvent, GameState } from '../types.js';
import { drawCardForPlayer } from '../turn/draw.js';

/** Champ tenu/conquis -> point ou pioche de remplacement, registre et victoire.
 * Entrées de confiance : joueur et champ existants, source validée par l'appelant.
 * Champ déjà scoré ou partie terminée : aucun effet. Au dernier point de conquête,
 * tous les autres champs doivent figurer dans le registre de CE joueur pour CE tour.
 * Le remplacement inscrit le champ avant la pioche, qui applique les pénalités usuelles.
 * Aucune mutation ; ne change ni le contrôle du champ ni le joueur actif. */
export function scoreBattlefield(
  state: GameState,
  playerId: string,
  battlefieldId: string,
  source: 'HOLD' | 'CONQUEST',
): Extract<ActionResult, { ok: true }> {
  const scored = state.scoredBattlefields[playerId] ?? [];
  if (state.result || scored.includes(battlefieldId))
    return { ok: true, state, events: [] };
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error('Joueur absent pour le score.');
  const target = player.victoryTarget ?? 8;
  const next: GameState = {
    ...state,
    scoredBattlefields: {
      ...state.scoredBattlefields,
      [playerId]: [...scored, battlefieldId],
    },
  };
  if (
    source === 'CONQUEST' &&
    player.score + 1 >= target &&
    !state.battlefields.every(
      (f) => f.zoneId === battlefieldId || scored.includes(f.zoneId),
    )
  ) {
    const drawn = drawCardForPlayer(next, playerId);
    return {
      ...drawn,
      events: [
        { type: 'conquest-point-replaced', playerId, battlefieldId },
        ...drawn.events,
      ],
    };
  }
  const score = player.score + 1;
  next.players = state.players.map((p) =>
    p.id === playerId ? { ...p, score } : p,
  );
  const events: GameEvent[] = [
    { type: 'point-scored', playerId, battlefieldId, source },
  ];
  if (score >= target) {
    next.result = { winnerId: playerId, reason: 'POINTS' };
    events.push({ type: 'game-ended', ...next.result });
  }
  return { ok: true, state: next, events };
}
