import type { ActionResult, GameAction, GameState } from '../types.js';
import type { GameConfig, StartingCard } from './create-game.js';
import { shuffle } from '../random/shuffle.js';

/** Configuration validée -> sélection BO1 reproductible ou fenêtre de choix BO3.
 * Le perdant précédent est une donnée de confiance du serveur, pas un choix du client. */
export function prepareBattlefields(
  state: GameState,
  config: GameConfig,
): Extract<ActionResult, { ok: true }> {
  if (config.match?.format === 'bo3')
    return {
      ok: true,
      state: {
        ...state,
        setup: {
          stage: 'choose-battlefield',
          options: Object.fromEntries(
            config.players.map((p) => [
              p.id,
              p.battlefields.map((b) => ({ ...b })),
            ]),
          ),
          selections: {},
          nextChooserId:
            config.match.gameNumber === 1 ? null : config.match.previousLoserId,
        },
      },
      events: [],
    };
  let seed = state.randomState ?? 1;
  const chosen = config.players.map((p) => {
    const mixed = shuffle(p.battlefields, seed);
    seed = mixed.seed;
    return { playerId: p.id, card: mixed.items[0]! };
  });
  return {
    ok: true,
    state: {
      ...placeBattlefields(
        state,
        chosen.map((c) => c.card),
      ),
      randomState: seed,
    },
    events: chosen.map((c) => ({
      type: 'battlefield-selected',
      playerId: c.playerId,
      battlefieldId: c.card.id,
      method: 'random',
    })),
  };
}

/** Choix BO3 unique dans ses trois champs -> enregistrement, puis placement des deux champs.
 * Dés bloqués tant que les deux choix ne sont pas terminés. Les sélections intermédiaires
 * sont internes au serveur et ne doivent pas révéler le choix adverse au client. */
export function chooseBattlefield(
  state: GameState,
  action: Extract<GameAction, { type: 'choose-battlefield' }>,
): ActionResult {
  const setup = state.setup;
  if (setup?.stage !== 'choose-battlefield')
    return { ok: false, reason: 'NO_BATTLEFIELD_CHOICE' };
  if (Object.hasOwn(setup.selections, action.playerId))
    return { ok: false, reason: 'BATTLEFIELD_ALREADY_CHOSEN' };
  const card = setup.options[action.playerId]?.find(
    (c) => c.id === action.battlefieldId,
  );
  if (!card) return { ok: false, reason: 'INVALID_BATTLEFIELD_CHOICE' };
  const selections = { ...setup.selections, [action.playerId]: card };
  let next: GameState = { ...state, setup: { ...setup, selections } };
  if (state.players.every((p) => Object.hasOwn(selections, p.id))) {
    next = placeBattlefields(
      next,
      state.players.map((p) => selections[p.id]!),
    );
    next = {
      ...next,
      setup: setup.nextChooserId
        ? { stage: 'choose-first', chooserId: setup.nextChooserId }
        : { stage: 'roll' },
    };
  }
  return {
    ok: true,
    state: next,
    events: [
      {
        type: 'battlefield-selected',
        playerId: action.playerId,
        battlefieldId: card.id,
        method: 'choice',
      },
    ],
  };
}

function placeBattlefields(
  state: GameState,
  cards: readonly StartingCard[],
): GameState {
  return {
    ...state,
    zones: [
      ...state.zones,
      ...cards.map((c) => ({ id: c.id, kind: 'battlefield' as const })),
    ],
    battlefields: cards.map((c) => ({
      zoneId: c.id,
      definitionId: c.definitionId,
      controllerId: null,
    })),
  };
}
