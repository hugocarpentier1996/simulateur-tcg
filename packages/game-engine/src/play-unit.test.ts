import { describe, expect, it } from 'vitest';
import { testUnits } from '../../game-data/src/index.js';
import { act, type GameState } from './index.js';
import { withDrawSupplies } from './test-fixtures.js';

function scenario(): GameState {
  return {
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    unitDefinitions: testUnits,
    zones: [
      { id: 'hand', kind: 'hand', ownerId: 'a' },
      { id: 'base', kind: 'base', ownerId: 'a' },
      { id: 'runes', kind: 'runes', ownerId: 'a' },
      { id: 'pile', kind: 'rune-pile', ownerId: 'a' },
    ],
    cards: [
      { id: 'card', definitionId: 'test-relic', ownerId: 'a', zoneId: 'hand' },
      {
        id: 'r1',
        definitionId: 'rune',
        ownerId: 'a',
        zoneId: 'runes',
        ready: true,
        color: 'color-2',
      },
      {
        id: 'r2',
        definitionId: 'rune',
        ownerId: 'a',
        zoneId: 'runes',
        ready: false,
        color: 'color-2',
      },
      {
        id: 'bottom',
        definitionId: 'rune',
        ownerId: 'a',
        zoneId: 'pile',
        color: 'color-1',
      },
    ],
    units: [],
    resources: { a: { energy: 0, power: {} } },
    battlefields: [],
    scoredBattlefields: {},
    showdown: null,
  };
}
const play = {
  type: 'play-unit',
  playerId: 'a',
  cardId: 'card',
  payment: { energyRunes: ['r1'], powerRunes: ['r2'] },
} as const;

describe('mise en jeu et paiement', () => {
  it('enchaîne paiement, deux tours, redressement puis combat avec une carte du catalogue', () => {
    let state = withDrawSupplies(scenario());
    state.cards[0]!.definitionId = 'test-guard';
    state.resources.a = { energy: 2, power: { 'color-2': 1 } };
    state.zones.push(
      { id: 'field', kind: 'battlefield' },
      { id: 'grave-a', kind: 'graveyard', ownerId: 'a' },
      { id: 'grave-b', kind: 'graveyard', ownerId: 'b' },
    );
    state.battlefields = [{ zoneId: 'field', controllerId: 'b' }];
    state.units = [
      {
        id: 'enemy',
        definitionId: 'test-scout',
        ownerId: 'b',
        zoneId: 'field',
        ready: true,
        might: 1,
        damage: 0,
      },
    ];
    const played = act(state, {
      ...play,
      payment: { energyRunes: [], powerRunes: [] },
    });
    if (!played.ok) throw new Error(played.reason);
    state = played.state;
    expect(
      act(state, {
        type: 'move',
        playerId: 'a',
        unitId: 'card',
        destinationId: 'field',
      }).ok,
    ).toBe(false);
    for (const action of [
      { type: 'end-turn', playerId: 'a' },
      { type: 'end-turn', playerId: 'b' },
      { type: 'move', playerId: 'a', unitId: 'card', destinationId: 'field' },
      { type: 'pass', playerId: 'a' },
      { type: 'pass', playerId: 'b' },
      {
        type: 'assign-damage',
        playerId: 'a',
        allocations: [{ targetId: 'enemy', amount: 1 }],
      },
      {
        type: 'assign-damage',
        playerId: 'b',
        allocations: [{ targetId: 'card', amount: 1 }],
      },
    ] as const) {
      const result = act(state, action);
      if (!result.ok) throw new Error(result.reason);
      state = result.state;
    }
    expect(state.units.find((unit) => unit.id === 'card')).toMatchObject({
      zoneId: 'field',
      might: 3,
      damage: 0,
    });
    expect(state.cards.find((card) => card.id === 'enemy')).toMatchObject({
      definitionId: 'test-scout',
      zoneId: 'grave-b',
    });
    expect(state.battlefields[0]?.controllerId).toBe('a');
    expect(state.players[0]?.score).toBe(1);
  });
  it('paie avec une rune Ready et une rune Tap puis met la Might 0 en base Tap', () => {
    const input = scenario();
    const before = structuredClone(input);
    const result = act(input, play);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.state.units).toEqual([
      {
        id: 'card',
        definitionId: 'test-relic',
        ownerId: 'a',
        zoneId: 'base',
        ready: false,
        might: 0,
        damage: 0,
      },
    ]);
    expect(result.state.cards.some((c) => c.id === 'card')).toBe(false);
    expect(result.state.cards.find((c) => c.id === 'r1')?.ready).toBe(false);
    expect(
      result.state.cards.filter((c) => c.zoneId === 'pile').map((c) => c.id),
    ).toEqual(['bottom', 'r2']);
    expect(result.state.resources.a).toEqual({
      energy: 0,
      power: { 'color-2': 0 },
    });
    expect(input).toEqual(before);
  });
  it('permet de Tap puis recycler la même rune pour payer énergie et Power', () => {
    expect(
      act(scenario(), {
        ...play,
        payment: { energyRunes: ['r1'], powerRunes: ['r1'] },
      }).ok,
    ).toBe(true);
  });
  it('consomme les ressources flottantes et conserve le surplus', () => {
    const input = scenario();
    input.resources.a = { energy: 3, power: { 'color-2': 2, 'color-1': 1 } };
    const result = act(input, {
      ...play,
      payment: { energyRunes: [], powerRunes: [] },
    });
    if (!result.ok) throw new Error(result.reason);
    expect(result.state.resources.a).toEqual({
      energy: 2,
      power: { 'color-2': 1, 'color-1': 1 },
    });
  });
  it.each([
    'insufficient',
    'wrong-color',
    'duplicate',
    'tap-energy',
    'enemy-rune',
    'enemy-player',
    'outside-hand',
    'unknown-definition',
  ])('refuse %s sans paiement partiel', (reason) => {
    const input = scenario();
    const action = {
      ...play,
      payment: { energyRunes: ['r1'], powerRunes: ['r2'] },
    };
    if (reason === 'insufficient') action.payment.powerRunes = [];
    if (reason === 'wrong-color') input.cards[2]!.color = 'color-1';
    if (reason === 'duplicate') action.payment.energyRunes = ['r1', 'r1'];
    if (reason === 'tap-energy') action.payment.energyRunes = ['r2'];
    if (reason === 'enemy-rune') input.cards[2]!.ownerId = 'b';
    if (reason === 'enemy-player') input.activePlayerId = 'b';
    if (reason === 'outside-hand') input.cards[0]!.zoneId = 'base';
    if (reason === 'unknown-definition')
      input.cards[0]!.definitionId = 'missing';
    const before = structuredClone(input);
    expect(act(input, action).ok).toBe(false);
    expect(input).toEqual(before);
  });
  it('refuse de jouer une unité pendant un Showdown', () => {
    const input = scenario();
    input.showdown = {
      kind: 'open',
      battlefieldId: 'field',
      initiatorId: 'a',
      participants: ['a', 'b'],
      priorityPlayerId: 'a',
      consecutivePasses: 0,
    };
    expect(act(input, play)).toEqual({
      ok: false,
      reason: 'PLAY_WINDOW_CLOSED',
    });
  });
});
