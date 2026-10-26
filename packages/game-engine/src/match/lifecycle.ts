import type { GameConfig } from '../setup/create-game.js';
import { createGame } from '../setup/create-game.js';
import type { Bo3Result, Bo3State } from './types.js';

/** Configuration de partie -> BO3 neuf à 0–0. Force la manche 1, indépendamment de config.match.
 * Exige trois définitions de battlefield distinctes par joueur ; validations usuelles conservées. */
export function createBo3(config: GameConfig): Bo3Result {
  if (
    config.players.some(
      (p) => new Set(p.battlefields.map((f) => f.definitionId)).size !== 3,
    )
  )
    return { ok: false, reason: 'INVALID_BATTLEFIELD_POOL' };
  const created = createGame({
    ...config,
    match: { format: 'bo3', gameNumber: 1 },
  });
  if (!created.ok) return created;
  return {
    ok: true,
    state: {
      game: created.state,
      gameNumber: 1,
      wins: Object.fromEntries(config.players.map((p) => [p.id, 0])),
      battlefieldPools: Object.fromEntries(
        config.players.map((p) => [
          p.id,
          p.battlefields.map((f) => f.definitionId),
        ]),
      ),
      usedBattlefields: Object.fromEntries(
        config.players.map((p) => [p.id, []]),
      ),
      completedGames: [],
    },
    events: created.events,
  };
}

/** Manche enregistrée -> nouvelle partie à zéro, avec choix des champs restants puis du départ
 * par le dernier perdant. Config fournit les decks dans leur nouvel ordre mélangé serveur.
 * Refuse série gagnée, manche non terminée, changement de joueurs/réserves ou configuration invalide.
 * Ne définit pas de règle de sideboard ; les autres contraintes de deck restent celles de createGame. */
export function startNextBo3Game(
  state: Bo3State,
  config: GameConfig,
): Bo3Result {
  if (state.winnerId) return { ok: false, reason: 'MATCH_OVER' };
  const last = state.completedGames.at(-1);
  if (
    !state.game.result ||
    last?.gameNumber !== state.gameNumber ||
    state.gameNumber === 3
  )
    return { ok: false, reason: 'GAME_NOT_RECORDED' };
  const ids = Object.keys(state.wins);
  if (
    config.players.length !== ids.length ||
    config.players.some((p) => !ids.includes(p.id))
  )
    return { ok: false, reason: 'MATCH_PLAYERS_CHANGED' };
  for (const p of config.players) {
    const pool = state.battlefieldPools[p.id]!;
    const incoming = p.battlefields.map((f) => f.definitionId);
    if (
      incoming.length !== pool.length ||
      new Set(incoming).size !== pool.length ||
      incoming.some((id) => !pool.includes(id))
    )
      return { ok: false, reason: 'BATTLEFIELD_POOL_CHANGED' };
  }
  const previousLoserId = ids.find((id) => id !== last.result.winnerId)!;
  const gameNumber = state.gameNumber === 1 ? 2 : 3;
  const created = createGame({
    ...config,
    match: { format: 'bo3', gameNumber, previousLoserId },
  });
  if (!created.ok) return created;
  const setup = created.state.setup;
  if (setup?.stage !== 'choose-battlefield')
    throw new Error('Fenêtre de choix des champs attendue.');
  const game = {
    ...created.state,
    setup: {
      ...setup,
      options: Object.fromEntries(
        Object.entries(setup.options).map(([id, cards]) => [
          id,
          cards.filter(
            (c) => !state.usedBattlefields[id]!.includes(c.definitionId),
          ),
        ]),
      ),
    },
  };
  return {
    ok: true,
    state: { ...state, game, gameNumber },
    events: created.events,
  };
}
