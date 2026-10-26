import { describe, expect, it } from 'vitest';
import { act, type GameState } from './index.js';

function scenario(): GameState {
  return {
    activePlayerId: 'alice',
    phase: 'main',
    players: [
      { id: 'alice', score: 0 },
      { id: 'bob', score: 3 },
    ],
    zones: [
      { id: 'base-a', kind: 'base', ownerId: 'alice' },
      { id: 'deck-a', kind: 'deck', ownerId: 'alice' },
      { id: 'hand-a', kind: 'hand', ownerId: 'alice' },
      { id: 'base-b', kind: 'base', ownerId: 'bob' },
      { id: 'deck-b', kind: 'deck', ownerId: 'bob' },
      { id: 'hand-b', kind: 'hand', ownerId: 'bob' },
      { id: 'pile-b', kind: 'rune-pile', ownerId: 'bob' },
      { id: 'runes-b', kind: 'runes', ownerId: 'bob' },
      { id: 'legend-b', kind: 'legend', ownerId: 'bob' },
      { id: 'grave-b', kind: 'graveyard', ownerId: 'bob' },
      { id: 'field', kind: 'battlefield' },
    ],
    units: [
      {
        id: 'ua',
        definitionId: 'fixture',
        might: 1,
        damage: 0,
        ownerId: 'alice',
        zoneId: 'base-a',
        ready: false,
      },
      {
        id: 'ub',
        definitionId: 'fixture',
        might: 1,
        damage: 0,
        ownerId: 'bob',
        zoneId: 'field',
        ready: false,
      },
    ],
    cards: [
      {
        id: 'dead',
        definitionId: 'unit',
        ownerId: 'bob',
        zoneId: 'grave-b',
        ready: false,
      },
      {
        id: 'alice-card',
        definitionId: 'fixture',
        ownerId: 'alice',
        zoneId: 'deck-a',
      },
      { id: 'c1', definitionId: 'sample', ownerId: 'bob', zoneId: 'deck-b' },
      { id: 'c2', definitionId: 'sample', ownerId: 'bob', zoneId: 'deck-b' },
      {
        id: 'r0',
        definitionId: 'rune',
        ownerId: 'bob',
        zoneId: 'runes-b',
        ready: false,
        color: 'color-1',
      },
      {
        id: 'r1',
        definitionId: 'rune',
        ownerId: 'bob',
        zoneId: 'pile-b',
        ready: false,
        color: 'color-1',
      },
      {
        id: 'r2',
        definitionId: 'rune',
        ownerId: 'bob',
        zoneId: 'pile-b',
        ready: false,
        color: 'color-2',
      },
      {
        id: 'r3',
        definitionId: 'rune',
        ownerId: 'bob',
        zoneId: 'pile-b',
        ready: false,
        color: 'color-1',
      },
      {
        id: 'legend',
        definitionId: 'legend',
        ownerId: 'bob',
        zoneId: 'legend-b',
        ready: false,
      },
    ],
    resources: {
      alice: { energy: 2, power: { 'color-1': 1 } },
      bob: { energy: 1, power: { 'color-2': 2 } },
    },
    battlefields: [{ zoneId: 'field', controllerId: 'bob' }],
    scoredBattlefields: { alice: [], bob: ['field'] },
    showdown: null,
  };
}

function finish(state: GameState) {
  const result = act(state, {
    type: 'end-turn',
    playerId: state.activePlayerId,
  });
  if (!result.ok) throw new Error(result.reason);
  return result;
}

describe('étapes automatiques du tour', () => {
  it('traverse les étapes dans l’ordre et arrive directement en Main sans muter la source', () => {
    const state = scenario();
    const before = structuredClone(state);
    const result = finish(state);
    expect(result.state.phase).toBe('main');
    expect(result.state.activePlayerId).toBe('bob');
    expect(
      result.events
        .filter((e) => e.type === 'phase-started')
        .map((e) => e.phase),
    ).toEqual(['end', 'awaken', 'beginning', 'channel', 'draw', 'main']);
    expect(state).toEqual(before);
    expect(finish(state)).toEqual(result);
  });

  it('redresse seulement les cartes en jeu du nouveau joueur, y compris runes et légende', () => {
    const { state } = finish(scenario());
    expect(state.units.map((u) => [u.id, u.ready])).toEqual([
      ['ua', false],
      ['ub', true],
    ]);
    expect(state.cards.find((c) => c.id === 'r0')?.ready).toBe(true);
    expect(state.cards.find((c) => c.id === 'dead')?.ready).toBe(false);
    expect(state.cards.find((c) => c.id === 'legend')?.ready).toBe(true);
    expect(state.cards.find((c) => c.id === 'r3')?.ready).toBe(false);
  });

  it('score chaque champ tenu après la remise à zéro du registre et avant Channel', () => {
    const input = scenario();
    input.battlefields.push(
      { zoneId: 'empty', controllerId: null },
      { zoneId: 'enemy', controllerId: 'alice' },
      { zoneId: 'second', controllerId: 'bob' },
    );
    const { state, events } = finish(input);
    expect(state.players.map((p) => p.score)).toEqual([0, 5]);
    expect(state.scoredBattlefields).toEqual({
      alice: [],
      bob: ['field', 'second'],
    });
    expect(events.filter((e) => e.type === 'point-scored')).toEqual([
      {
        type: 'point-scored',
        playerId: 'bob',
        battlefieldId: 'field',
        source: 'HOLD',
      },
      {
        type: 'point-scored',
        playerId: 'bob',
        battlefieldId: 'second',
        source: 'HOLD',
      },
    ]);
    expect(events.findIndex((e) => e.type === 'point-scored')).toBeLessThan(
      events.findIndex(
        (e) => e.type === 'phase-started' && e.phase === 'channel',
      ),
    );
  });

  it('prend deux runes Ready et une carte au sommet des piles sans créer de copies', () => {
    const input = scenario();
    const { state } = finish(input);
    expect(
      state.cards
        .filter((c) => c.zoneId === 'runes-b')
        .map((c) => [c.id, c.ready]),
    ).toEqual([
      ['r0', true],
      ['r1', true],
      ['r2', true],
    ]);
    expect(
      state.cards.filter((c) => c.zoneId === 'pile-b').map((c) => c.id),
    ).toEqual(['r3']);
    expect(
      state.cards.filter((c) => c.zoneId === 'hand-b').map((c) => c.id),
    ).toEqual(['c1']);
    expect(
      state.cards.filter((c) => c.zoneId === 'deck-b').map((c) => c.id),
    ).toEqual(['c2']);
    expect(state.cards.map((c) => c.id)).toEqual(input.cards.map((c) => c.id));
  });

  it('vide les ressources de tous les joueurs à la fin du tour et de Draw', () => {
    const { state, events } = finish(scenario());
    expect(state.resources).toEqual({
      alice: { energy: 0, power: {} },
      bob: { energy: 0, power: {} },
    });
    expect(events.filter((e) => e.type === 'resources-cleared')).toEqual([
      { type: 'resources-cleared', boundary: 'end' },
      { type: 'resources-cleared', boundary: 'draw' },
    ]);
    const draw = events.findIndex((e) => e.type === 'card-drawn');
    const cleared = events.findIndex(
      (e) => e.type === 'resources-cleared' && e.boundary === 'draw',
    );
    const main = events.findIndex(
      (e) => e.type === 'phase-started' && e.phase === 'main',
    );
    expect(draw).toBeLessThan(cleared);
    expect(cleared).toBeLessThan(main);
  });

  it('prend seulement les runes disponibles sans pénalité', () => {
    const input = scenario();
    input.cards = input.cards.filter((c) => !['r2', 'r3'].includes(c.id));
    const { state, events } = finish(input);
    expect(state.phase).toBe('main');
    expect(
      state.cards.filter((c) => c.zoneId === 'runes-b').map((c) => c.id),
    ).toEqual(['r0', 'r1']);
    expect(events.some((e) => e.type === 'deck-penalty')).toBe(false);
  });

  it('permet plusieurs tours sans réutiliser les cartes déjà piochées', () => {
    let state = finish(scenario()).state;
    state = finish(state).state;
    state = finish(state).state;
    expect(state.activePlayerId).toBe('bob');
    expect(
      state.cards.filter((c) => c.zoneId === 'hand-b').map((c) => c.id),
    ).toEqual(['c1', 'c2']);
    expect(state.players[1]?.score).toBe(5);
  });
});
