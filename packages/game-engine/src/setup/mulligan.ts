import type {
  ActionResult,
  GameAction,
  GameEvent,
  GameState,
} from '../types.js';
import { drawCardForPlayer } from '../turn/draw.js';
import { startTurn } from '../turn/progression.js';

/** Choix unique de 0..2 instances de sa main -> recyclage sous le deck dans l'ordre fourni,
 * puis autant de pioches. Après les deux choix, démarre le premier tour jusqu'à Main.
 * Refuse doublons, cartes hors main, deuxième choix ou mauvaise fenêtre, sans mutation.
 * L'état et les événements sont internes au serveur : les mains restent privées côté client. */
export function mulligan(
  state: GameState,
  action: Extract<GameAction, { type: 'mulligan' }>,
): ActionResult {
  const setup = state.setup;
  if (setup?.stage !== 'mulligan')
    return { ok: false, reason: 'NO_MULLIGAN_WINDOW' };
  if (setup.completedPlayerIds.includes(action.playerId))
    return { ok: false, reason: 'MULLIGAN_ALREADY_DONE' };
  const hand = state.zones.find(
    (z) => z.ownerId === action.playerId && z.kind === 'hand',
  )!;
  const deck = state.zones.find(
    (z) => z.ownerId === action.playerId && z.kind === 'deck',
  )!;
  const ids = new Set(action.cardIds);
  const selected = action.cardIds.map((id) =>
    state.cards.find(
      (c) =>
        c.id === id && c.ownerId === action.playerId && c.zoneId === hand.id,
    ),
  );
  if (
    action.cardIds.length > 2 ||
    ids.size !== action.cardIds.length ||
    selected.some((c) => !c)
  )
    return { ok: false, reason: 'INVALID_MULLIGAN' };
  const completedPlayerIds = [...setup.completedPlayerIds, action.playerId];
  let current: GameState = {
    ...state,
    cards: [
      ...state.cards.filter((c) => !ids.has(c.id)),
      ...selected.map((c) => ({ ...c!, zoneId: deck.id })),
    ],
    setup: { ...setup, completedPlayerIds },
  };
  const events: GameEvent[] = [
    {
      type: 'mulligan-completed',
      playerId: action.playerId,
      cardIds: [...action.cardIds],
    },
  ];
  for (let i = 0; i < selected.length && !current.result; i++) {
    const drawn = drawCardForPlayer(current, action.playerId);
    current = drawn.state;
    events.push(...drawn.events);
  }
  if (!current.result && completedPlayerIds.length === state.players.length) {
    const started = startTurn({
      ...current,
      setup: null,
      priorityPlayerId: current.activePlayerId,
    });
    current = started.state;
    events.push(...started.events);
  }
  return { ok: true, state: current, events };
}
