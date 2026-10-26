import { describe, expect, it } from 'vitest';
import {
  createBo3,
  actBo3,
  rollBo3,
  startNextBo3Game,
  type Bo3Result,
  type Bo3State,
  type GameConfig,
} from './index.js';

function config(): GameConfig {
  return {
    players: ['a', 'b'].map((id) => ({
      id,
      deck: Array.from({ length: 39 }, (_, i) => ({
        id: `${id}-c${i}`,
        definitionId: 'unit',
      })),
      runes: Array.from({ length: 12 }, (_, i) => ({
        id: `${id}-r${i}`,
        definitionId: 'rune',
        color: 'rouge',
      })),
      legend: {
        id: `${id}-legend`,
        definitionId: 'legend',
        colors: ['rouge', 'bleu'],
      },
      champion: { id: `${id}-champion`, definitionId: 'champion' },
      battlefields: [0, 1, 2].map((i) => ({
        id: `${id}-f${i}`,
        definitionId: `field-${i}`,
      })),
    })),
  };
}
function ok(result: Bo3Result): Bo3State {
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}
function begin(state: Bo3State, field: number): Bo3State {
  for (const playerId of ['a', 'b'])
    state = ok(
      actBo3(state, {
        type: 'choose-battlefield',
        playerId,
        battlefieldId: `${playerId}-f${field}`,
      }),
    );
  if (state.gameNumber === 1) state = ok(rollBo3(state, { a: 20, b: 1 }));
  const setup = state.game.setup;
  if (setup?.stage !== 'choose-first') throw new Error('Choix attendu');
  state = ok(
    actBo3(state, {
      type: 'choose-first-player',
      playerId: setup.chooserId,
      firstPlayerId: 'a',
    }),
  );
  for (const playerId of ['a', 'b'])
    state = ok(actBo3(state, { type: 'mulligan', playerId, cardIds: [] }));
  return state;
}
function win(input: Bo3State, winner: string): Bo3Result {
  const state = structuredClone(input);
  state.game.activePlayerId = winner === 'a' ? 'b' : 'a';
  state.game.priorityPlayerId = state.game.activePlayerId;
  state.game.players.find((p) => p.id === winner)!.score = 7;
  state.game.battlefields[0]!.controllerId = winner;
  return actBo3(state, {
    type: 'end-turn',
    playerId: state.game.activePlayerId,
  });
}

describe('série BO3', () => {
  it('initialise les scores et interdit de passer à la manche suivante avant un résultat', () => {
    const input = config();
    const before = structuredClone(input);
    const state = ok(createBo3(input));
    expect(state.wins).toEqual({ a: 0, b: 0 });
    expect(state.gameNumber).toBe(1);
    expect(state.completedGames).toEqual([]);
    expect(startNextBo3Game(state, input).ok).toBe(false);
    expect(input).toEqual(before);
  });
  it('termine à 2–0 sans troisième manche ni double comptage', () => {
    const first = begin(ok(createBo3(config())), 0);
    const before = structuredClone(first);
    let state = ok(win(first, 'a'));
    expect(first).toEqual(before);
    expect(state.wins).toEqual({ a: 1, b: 0 });
    expect(state.winnerId).toBeUndefined();
    expect(actBo3(state, { type: 'end-turn', playerId: 'b' }).ok).toBe(false);
    state = ok(startNextBo3Game(state, config()));
    expect(state.game.players.map((p) => p.score)).toEqual([0, 0]);
    state = begin(state, 1);
    const result = win(state, 'a');
    state = ok(result);
    expect(state.wins).toEqual({ a: 2, b: 0 });
    expect(state.winnerId).toBe('a');
    expect(state.completedGames).toHaveLength(2);
    if (result.ok)
      expect(result.events.at(-1)).toEqual({
        type: 'match-ended',
        winnerId: 'a',
      });
    expect(startNextBo3Game(state, config())).toEqual({
      ok: false,
      reason: 'MATCH_OVER',
    });
    expect(rollBo3(state, { a: 1, b: 2 }).ok).toBe(false);
  });
  it('joue la troisième manche à 1–1 et donne le choix au dernier perdant', () => {
    let state = ok(win(begin(ok(createBo3(config())), 0), 'a'));
    state = ok(startNextBo3Game(state, config()));
    for (const playerId of ['a', 'b'])
      state = ok(
        actBo3(state, {
          type: 'choose-battlefield',
          playerId,
          battlefieldId: `${playerId}-f1`,
        }),
      );
    expect(state.game.setup).toEqual({ stage: 'choose-first', chooserId: 'b' });
    state = ok(
      actBo3(state, {
        type: 'choose-first-player',
        playerId: 'b',
        firstPlayerId: 'a',
      }),
    );
    for (const playerId of ['a', 'b'])
      state = ok(actBo3(state, { type: 'mulligan', playerId, cardIds: [] }));
    state = ok(win(state, 'b'));
    expect(state.wins).toEqual({ a: 1, b: 1 });
    state = ok(startNextBo3Game(state, config()));
    expect(state.gameNumber).toBe(3);
    for (const playerId of ['a', 'b'])
      state = ok(
        actBo3(state, {
          type: 'choose-battlefield',
          playerId,
          battlefieldId: `${playerId}-f2`,
        }),
      );
    expect(state.game.setup).toEqual({ stage: 'choose-first', chooserId: 'a' });
    state = ok(
      actBo3(state, {
        type: 'choose-first-player',
        playerId: 'a',
        firstPlayerId: 'a',
      }),
    );
    for (const playerId of ['a', 'b'])
      state = ok(actBo3(state, { type: 'mulligan', playerId, cardIds: [] }));
    state = ok(win(state, 'b'));
    expect(state.winnerId).toBe('b');
    expect(state.wins).toEqual({ a: 1, b: 2 });
  });
  it('interdit un champ déjà utilisé même avec un nouvel identifiant, sans bloquer celui de l’adversaire', () => {
    let state = ok(createBo3(config()));
    state = ok(
      actBo3(state, {
        type: 'choose-battlefield',
        playerId: 'a',
        battlefieldId: 'a-f0',
      }),
    );
    state = ok(
      actBo3(state, {
        type: 'choose-battlefield',
        playerId: 'b',
        battlefieldId: 'b-f1',
      }),
    );
    state = ok(rollBo3(state, { a: 20, b: 1 }));
    state = ok(
      actBo3(state, {
        type: 'choose-first-player',
        playerId: 'a',
        firstPlayerId: 'a',
      }),
    );
    for (const playerId of ['a', 'b'])
      state = ok(actBo3(state, { type: 'mulligan', playerId, cardIds: [] }));
    state = ok(win(state, 'a'));
    const nextConfig = config();
    const players = nextConfig.players.map((p) => ({
      ...p,
      battlefields: p.battlefields.map((f) => ({ ...f, id: `${f.id}-new` })),
    }));
    state = ok(startNextBo3Game(state, { ...nextConfig, players }));
    const before = structuredClone(state);
    expect(
      actBo3(state, {
        type: 'choose-battlefield',
        playerId: 'a',
        battlefieldId: 'a-f0-new',
      }).ok,
    ).toBe(false);
    expect(state).toEqual(before);
    state = ok(
      actBo3(state, {
        type: 'choose-battlefield',
        playerId: 'a',
        battlefieldId: 'a-f1-new',
      }),
    );
    state = ok(
      actBo3(state, {
        type: 'choose-battlefield',
        playerId: 'b',
        battlefieldId: 'b-f0-new',
      }),
    );
    expect(state.usedBattlefields).toEqual({
      a: ['field-0', 'field-1'],
      b: ['field-1', 'field-0'],
    });
  });
  it('refuse les réserves dupliquées et le remplacement des joueurs ou des trois champs', () => {
    const input = config();
    const duplicate = structuredClone(input);
    duplicate.players[0]!.battlefields[1]!.definitionId = 'field-0';
    expect(createBo3(duplicate).ok).toBe(false);
    const state = ok(win(begin(ok(createBo3(input)), 0), 'a'));
    const changed = structuredClone(input);
    changed.players[0]!.battlefields[0]!.definitionId = 'new-field';
    expect(startNextBo3Game(state, changed).ok).toBe(false);
    const stranger = structuredClone(input);
    stranger.players[0]!.id = 'c';
    expect(startNextBo3Game(state, stranger).ok).toBe(false);
  });
  it('compte aussi une victoire par épuisement du deck', () => {
    const input = begin(ok(createBo3(config())), 0);
    input.game.cards = input.game.cards.filter(
      (c) =>
        c.ownerId !== 'b' ||
        !input.game.zones.some(
          (z) => z.id === c.zoneId && ['deck', 'graveyard'].includes(z.kind),
        ),
    );
    const state = ok(actBo3(input, { type: 'end-turn', playerId: 'a' }));
    expect(state.wins.a).toBe(1);
    expect(state.completedGames[0]?.result.reason).toBe('DECK_EXHAUSTION');
  });
});
