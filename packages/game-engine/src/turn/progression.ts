import type {
  ActionResult,
  GameEvent,
  GameState,
  TurnPhase,
} from '../types.js';
import { awaken } from './awaken.js';
import { scoreHolding } from './beginning.js';
import { channelRunes, drawCard } from './supplies.js';
import { clearResources } from './resources.js';

/**
 * Entrée : état cohérent dont la fin de tour a été autorisée, joueurs en ordre de jeu.
 * Sortie : suivant actif en Main après toutes les étapes automatiques, avec journal
 * ordonné des phases et de leurs conséquences. Aucun choix ni effet de carte n'est
 * encore pris en charge pendant ces étapes. L'entrée n'est jamais modifiée.
 */
export function startNextTurn(
  state: GameState,
): Extract<ActionResult, { ok: true }> {
  const nextPlayerId = getNextPlayerId(state);
  const end =
    state.phase === 'end'
      ? clearResources(state, 'end')
      : runPhase(state, 'end', (s) => clearResources(s, 'end'));
  const current: GameState = {
    ...end.state,
    ...(state.pendingTurnEnd ? { pendingTurnEnd: false } : {}),
    units: end.state.units.map((unit) => ({
      ...unit,
      damage: 0,
      temporaryEffects: [],
    })),
    priorityPlayerId: nextPlayerId,
    activePlayerId: nextPlayerId,
    scoredBattlefields: Object.fromEntries(
      state.players.map((player) => [player.id, []]),
    ),
  };
  const started = startTurn(current);
  return {
    ok: true,
    state: started.state,
    events: [
      ...end.events,
      {
        type: 'units-healed',
        unitIds: end.state.units.filter((u) => u.damage > 0).map((u) => u.id),
      },
      { type: 'turn-ended', playerId: state.activePlayerId },
      ...started.events,
    ],
  };
}

/** État prêt à démarrer, joueur actif déjà choisi -> Awaken à Main, sans fin de tour.
 * Réutilisé après le mulligan et après une vraie fin de tour. Arrêt immédiat si victoire. */
export function startTurn(
  state: GameState,
): Extract<ActionResult, { ok: true }> {
  if (state.result) return { ok: true, state, events: [] };
  let current = state;
  const nextPlayerId = state.activePlayerId;
  const events: GameEvent[] = [
    { type: 'turn-started', playerId: nextPlayerId },
  ];
  const steps = [
    ['awaken', awaken],
    ['beginning', scoreHolding],
    ['channel', channelRunes],
    ['draw', drawCard],
  ] as const;
  for (const [phase, effect] of steps) {
    const result = runPhase(current, phase, effect);
    current = result.state;
    events.push(...result.events);
    if (current.result) return { ok: true, state: current, events };
  }
  const cleared = clearResources(current, 'draw');
  events.push(...cleared.events, {
    type: 'phase-started',
    playerId: nextPlayerId,
    phase: 'main',
  });
  return { ok: true, state: { ...cleared.state, phase: 'main' }, events };
}

/** État + étape + traitement -> état de sortie et événement d'entrée suivi des effets. */
function runPhase(
  state: GameState,
  phase: TurnPhase,
  effect: (state: GameState) => Extract<ActionResult, { ok: true }>,
): Extract<ActionResult, { ok: true }> {
  const result = effect({ ...state, phase });
  return {
    ...result,
    events: [
      { type: 'phase-started', playerId: state.activePlayerId, phase },
      ...result.events,
    ],
  };
}

/** Ordre des joueurs + joueur actif -> ID suivant ; un état incohérent est une erreur interne. */
function getNextPlayerId(state: GameState): string {
  const currentIndex = state.players.findIndex(
    (player) => player.id === state.activePlayerId,
  );
  const nextPlayer = state.players[(currentIndex + 1) % state.players.length];
  if (currentIndex < 0 || !nextPlayer) {
    throw new Error(
      'État incohérent : aucun joueur suivant dans l’ordre des tours.',
    );
  }
  return nextPlayer.id;
}
