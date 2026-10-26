import { describe, expect, it } from 'vitest';
import { act, getLegalActions, type GameState } from './index.js';
import { testSpells } from '../../game-data/src/index.js';

function scenario(): GameState {
  return {
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    zones: [
      { id: 'hand', kind: 'hand', ownerId: 'a' },
      { id: 'base', kind: 'base', ownerId: 'a' },
      { id: 'champ', kind: 'champion', ownerId: 'a' },
      { id: 'runes', kind: 'runes', ownerId: 'a' },
      { id: 'pile', kind: 'rune-pile', ownerId: 'a' },
      { id: 'grave', kind: 'graveyard', ownerId: 'a' },
      { id: 'field', kind: 'battlefield' },
    ],
    unitDefinitions: [
      {
        id: 'u',
        type: 'unit',
        might: 2,
        cost: { energy: 1, power: { 'color-1': 1 } },
      },
    ],
    spellDefinitions: testSpells,
    cards: [
      { id: 'chosen', definitionId: 'u', ownerId: 'a', zoneId: 'champ' },
      ...testSpells.map((d) => ({
        id: d.id,
        definitionId: d.id,
        ownerId: 'a',
        zoneId: 'hand',
      })),
      {
        id: 'r',
        definitionId: 'rune',
        ownerId: 'a',
        zoneId: 'runes',
        ready: true,
        color: 'color-1',
      },
    ],
    units: [
      {
        id: 'target',
        definitionId: 'u',
        ownerId: 'a',
        zoneId: 'base',
        might: 2,
        damage: 0,
        ready: true,
      },
    ],
    resources: {},
    battlefields: [{ zoneId: 'field', controllerId: null }],
    scoredBattlefields: {},
    showdown: null,
  };
}
describe('actions jouables', () => {
  it('inclut le champion avec un paiement réel utilisant la même rune en énergie puis Power', () => {
    const input = scenario(),
      before = structuredClone(input);
    const actions = getLegalActions(input, 'a');
    expect(actions).toContainEqual({
      type: 'play-unit',
      playerId: 'a',
      cardId: 'chosen',
      destinationId: 'base',
      payment: { energyRunes: ['r'], powerRunes: ['r'] },
    });
    expect(actions.every((a) => act(input, a).ok)).toBe(true);
    expect(input).toEqual(before);
    expect(getLegalActions(input, 'b')).toEqual([]);
  });
  it('retire les cartes impayables mais accepte une rune Tap pour du Power si l’énergie flotte', () => {
    const s = scenario();
    s.cards.find((c) => c.id === 'r')!.ready = false;
    expect(getLegalActions(s, 'a').some((a) => a.type === 'play-unit')).toBe(
      false,
    );
    s.resources.a = { energy: 1, power: {} };
    expect(getLegalActions(s, 'a').some((a) => a.type === 'play-unit')).toBe(
      true,
    );
  });
  it('distingue Main, priorité ouverte, pile de Réaction et phase de dégâts', () => {
    const s = scenario();
    s.resources.a = { energy: 20, power: { 'color-1': 20, 'color-2': 20 } };
    s.showdown = {
      kind: 'open',
      battlefieldId: 'field',
      initiatorId: 'a',
      participants: ['a', 'b'],
      priorityPlayerId: 'a',
      consecutivePasses: 0,
    };
    const open = getLegalActions(s, 'a');
    expect(open.some((a) => a.type === 'play-unit')).toBe(false);
    expect(
      open.some(
        (a) => a.type === 'cast-spell' && a.cardId === 'test-reposition',
      ),
    ).toBe(true);
    expect(
      open.some(
        (a) => a.type === 'cast-spell' && a.cardId === 'test-weaken-draw',
      ),
    ).toBe(false);
    const cast = open.find(
      (a) => a.type === 'cast-spell' && a.cardId === 'test-reinforce',
    )!;
    const r = act(s, cast);
    if (!r.ok) throw new Error(r.reason);
    expect(
      getLegalActions(r.state, 'a').every(
        (a) =>
          a.type === 'pass' ||
          (a.type === 'cast-spell' &&
            a.cardId !== 'test-reposition' &&
            a.cardId !== 'test-weaken-draw'),
      ),
    ).toBe(true);
    s.showdown = {
      ...s.showdown,
      kind: 'combat',
      defenderId: 'b',
      stage: 'damage',
      assignments: {},
    };
    expect(getLegalActions(s, 'a')).toEqual([
      { type: 'assign-damage', playerId: 'a', allocations: [] },
    ]);
    s.result = { winnerId: 'a', reason: 'POINTS' };
    expect(getLegalActions(s, 'a')).toEqual([]);
  });
  it('énumère les choix de destination de mort légaux et les ordres de dégâts', () => {
    const s = scenario();
    s.pendingDeaths = {
      playerOrder: ['a'],
      triggers: [
        {
          sourceId: 'dead',
          ownerId: 'a',
          effect: { type: 'summon-token', definitionId: 'u' },
        },
      ],
    };
    expect(getLegalActions(s, 'a')).toEqual([
      {
        type: 'queue-death-effects',
        playerId: 'a',
        effects: [{ sourceId: 'dead', destinationId: 'base' }],
      },
    ]);
    s.pendingDeaths = null;
    s.units = [
      { ...s.units[0]!, zoneId: 'field', might: 3 },
      {
        id: 'b1',
        definitionId: 'u',
        ownerId: 'b',
        zoneId: 'field',
        ready: false,
        might: 1,
        damage: 0,
      },
      {
        id: 'b2',
        definitionId: 'u',
        ownerId: 'b',
        zoneId: 'field',
        ready: false,
        might: 3,
        damage: 0,
      },
    ];
    s.showdown = {
      kind: 'combat',
      battlefieldId: 'field',
      initiatorId: 'a',
      defenderId: 'b',
      stage: 'damage',
      assignments: {},
      participants: ['a', 'b'],
      priorityPlayerId: 'a',
      consecutivePasses: 0,
    };
    const actions = getLegalActions(s, 'a');
    expect(actions).toHaveLength(2);
    expect(actions.every((a) => act(s, a).ok)).toBe(true);
  });
});
