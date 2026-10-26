import { describe, expect, it } from 'vitest';
import { act, type GameState } from './index.js';
import { drawCard, channelRunes } from './turn/supplies.js';

function state(): GameState {
  return {
    activePlayerId: 'bob',
    phase: 'draw',
    randomState: 42,
    players: [
      { id: 'alice', score: 3 },
      { id: 'bob', score: 0 },
    ],
    zones: [
      { id: 'deck', kind: 'deck', ownerId: 'bob' },
      { id: 'hand', kind: 'hand', ownerId: 'bob' },
      { id: 'grave', kind: 'graveyard', ownerId: 'bob' },
      { id: 'other-grave', kind: 'graveyard', ownerId: 'alice' },
    ],
    cards: [
      ...['a', 'b', 'c', 'd'].map((id) => ({
        id,
        definitionId: id,
        ownerId: 'bob',
        zoneId: 'grave',
      })),
      {
        id: 'other',
        definitionId: 'other',
        ownerId: 'alice',
        zoneId: 'other-grave',
      },
    ],
    units: [],
    resources: {},
    battlefields: [],
    scoredBattlefields: {},
    showdown: null,
  };
}

describe('épuisement des piles', () => {
  it('pioche le sommet fourni par le mélange injecté et conserve son nouvel état', () => {
    const input = state();
    const result = drawCard(input, (cards, seed) => ({
      items: [...cards].reverse(),
      seed: seed + 1,
    }));
    expect(
      result.state.cards.filter((c) => c.zoneId === 'hand').map((c) => c.id),
    ).toEqual(['d']);
    expect(
      result.state.cards.filter((c) => c.zoneId === 'deck').map((c) => c.id),
    ).toEqual(['c', 'b', 'a']);
    expect(result.state.randomState).toBe(43);
  });

  it('ne pénalise pas une pile de runes vide', () => {
    const input = state();
    const result = channelRunes(input);
    expect(result.state).toEqual(input);
    expect(result.events).toEqual([
      { type: 'runes-channeled', playerId: 'bob', cardIds: [] },
    ]);
  });

  it('recycle uniquement sa défausse, mélange reproductiblement puis pioche et donne un point', () => {
    const input = state();
    const before = structuredClone(input);
    const result = drawCard(input);
    expect(result.state.players[0]?.score).toBe(4);
    expect(result.state.cards.filter((c) => c.zoneId === 'grave')).toHaveLength(
      0,
    );
    expect(result.state.cards.filter((c) => c.zoneId === 'hand')).toHaveLength(
      1,
    );
    expect(result.state.cards.filter((c) => c.zoneId === 'deck')).toHaveLength(
      3,
    );
    expect(result.state.cards.find((c) => c.id === 'other')?.zoneId).toBe(
      'other-grave',
    );
    expect(result.state.cards.map((c) => c.id).sort()).toEqual(
      input.cards.map((c) => c.id).sort(),
    );
    expect(result.state.randomState).not.toBe(input.randomState);
    expect(result.events.map((e) => e.type)).toEqual([
      'deck-recycled',
      'deck-penalty',
      'card-drawn',
    ]);
    expect(drawCard(input)).toEqual(result);
    expect(input).toEqual(before);
  });

  it('pioche la dernière carte sans recycler avant la prochaine demande', () => {
    const input = state();
    input.cards[0]!.zoneId = 'deck';
    const result = drawCard(input);
    expect(result.state.players[0]?.score).toBe(3);
    expect(result.state.randomState).toBe(42);
    expect(result.events).toEqual([
      { type: 'card-drawn', playerId: 'bob', cardId: 'a' },
    ]);
    expect(drawCard(result.state).state.players[0]?.score).toBe(4);
  });

  it('accorde tous les points manquants et termine la partie quand les deux piles sont vides', () => {
    const input = state();
    input.cards = [];
    input.players[0]!.victoryTarget = 10;
    const result = drawCard(input);
    expect(result.state.players[0]?.score).toBe(10);
    expect(result.state.result).toEqual({
      winnerId: 'alice',
      loserId: 'bob',
      reason: 'DECK_EXHAUSTION',
    });
    expect(result.events).toContainEqual({
      type: 'deck-penalty',
      playerId: 'alice',
      drawingPlayerId: 'bob',
      amount: 7,
      source: 'OTHER',
    });
    expect(result.events.some((e) => e.type === 'card-drawn')).toBe(false);
    expect(act(result.state, { type: 'end-turn', playerId: 'bob' })).toEqual({
      ok: false,
      reason: 'GAME_OVER',
    });
  });

  it('arrête les étapes à Draw sans entrer en Main après la défaite', () => {
    const input = state();
    input.cards = [];
    input.activePlayerId = 'alice';
    input.phase = 'main';
    const result = act(input, { type: 'end-turn', playerId: 'alice' });
    if (!result.ok) throw new Error(result.reason);
    expect(result.state.result?.winnerId).toBe('alice');
    expect(result.state.phase).toBe('draw');
    expect(
      result.events.some(
        (e) => e.type === 'phase-started' && e.phase === 'main',
      ),
    ).toBe(false);
  });

  it('termine aussi la partie si le seul point de recyclage atteint le seuil', () => {
    const input = state();
    input.players[0]!.score = 7;
    const result = drawCard(input);
    expect(result.state.players[0]?.score).toBe(8);
    expect(result.state.result?.winnerId).toBe('alice');
  });
});
