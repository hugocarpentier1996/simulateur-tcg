import type { ActionResult, GameEvent, GameState } from '../types.js';

/** Capacité « When I hold » d'une unité, déclenchée par une tenue effectivement scorée. */
export interface HoldUnitEntry {
  kind: 'hold-unit';
  sourceId: string;
  ownerId: string;
  battlefieldId: string;
  points: number;
}

/** Tenue scorée sur un champ -> une capacité par unité du joueur présente sur ce champ et
 * portant onHoldScore, empilée avec sa fenêtre de Réaction. Rien après la victoire. */
export function queueHoldUnits(
  state: GameState,
  playerId: string,
  battlefieldId: string,
): GameState {
  if (state.result) return state;
  const entries: HoldUnitEntry[] = state.units.flatMap((u) => {
    const points = state.unitDefinitions?.find(
      (d) => d.id === u.definitionId,
    )?.onHoldScore;
    return u.ownerId === playerId && u.zoneId === battlefieldId && points
      ? [
          {
            kind: 'hold-unit' as const,
            sourceId: u.id,
            ownerId: playerId,
            battlefieldId,
            points,
          },
        ]
      : [];
  });
  if (!entries.length) return state;
  return {
    ...state,
    stack: {
      entries: [...(state.stack?.entries ?? []), ...entries],
      initiatorId: state.stack?.initiatorId ?? playerId,
      priorityPlayerId: state.activePlayerId,
      consecutivePasses: 0,
    },
  };
}

/** Capacité dépilée -> points d'effet de carte au propriétaire, même si la source a quitté le
 * champ entre-temps (la capacité est déjà déclenchée). */
export function resolveHoldUnit(
  state: GameState,
  entry: HoldUnitEntry,
): Extract<ActionResult, { ok: true }> {
  return awardPoints(state, entry.ownerId, entry.points, entry.sourceId);
}

/** Points accordés par un effet de carte (source CARD_EFFECT), avec victoire immédiate au seuil.
 * Aucun registre de champ n'est modifié. Partie terminée : aucun effet. */
export function awardPoints(
  state: GameState,
  playerId: string,
  amount: number,
  sourceId: string,
): Extract<ActionResult, { ok: true }> {
  const player = state.players.find((p) => p.id === playerId);
  if (state.result || !player || amount <= 0)
    return { ok: true, state, events: [] };
  const score = player.score + amount;
  const target = player.victoryTarget ?? 8;
  const events: GameEvent[] = [
    {
      type: 'points-gained',
      playerId,
      amount,
      sourceId,
      source: 'CARD_EFFECT',
    },
  ];
  const next: GameState = {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, score } : p,
    ),
  };
  if (score >= target) {
    next.result = { winnerId: playerId, reason: 'POINTS' };
    events.push({ type: 'game-ended', ...next.result });
  }
  return { ok: true, state: next, events };
}
