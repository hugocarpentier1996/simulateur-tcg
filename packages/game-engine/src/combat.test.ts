import { describe, expect, it } from 'vitest';
import { act, type GameAction, type GameState } from './index.js';

function scenario(a = 3, b = 2): GameState {
  return {
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    zones: [
      { id: 'base-a', kind: 'base', ownerId: 'a' },
      { id: 'base-b', kind: 'base', ownerId: 'b' },
      { id: 'grave-a', kind: 'graveyard', ownerId: 'a' },
      { id: 'grave-b', kind: 'graveyard', ownerId: 'b' },
      { id: 'field', kind: 'battlefield' },
    ],
    units: [
      {
        id: 'attacker',
        definitionId: 'unit-a',
        ownerId: 'a',
        zoneId: 'base-a',
        ready: true,
        might: a,
        damage: 0,
      },
      {
        id: 'defender',
        definitionId: 'unit-b',
        ownerId: 'b',
        zoneId: 'field',
        ready: true,
        might: b,
        damage: 0,
      },
    ],
    cards: [],
    resources: {},
    battlefields: [{ zoneId: 'field', controllerId: 'b' }],
    scoredBattlefields: {},
    showdown: null,
  };
}
function apply(state: GameState, action: GameAction): GameState {
  const result = act(state, action);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}
function start(state = scenario()): GameState {
  state = apply(state, {
    type: 'move',
    playerId: 'a',
    unitId: 'attacker',
    destinationId: 'field',
  });
  state = apply(state, { type: 'pass', playerId: 'a' });
  return apply(state, { type: 'pass', playerId: 'b' });
}
function fight(state: GameState, a: number, b: number): GameState {
  state = apply(state, {
    type: 'assign-damage',
    playerId: 'a',
    allocations: a ? [{ targetId: 'defender', amount: a }] : [],
  });
  return apply(state, {
    type: 'assign-damage',
    playerId: 'b',
    allocations: b ? [{ targetId: 'attacker', amount: b }] : [],
  });
}

describe('Combat Showdown sans sorts', () => {
  it('laisse le défenseur seul en place et ne marque pas pour lui', () => {
    const state = fight(start(scenario(1, 3)), 1, 1);
    expect(state.units.map((unit) => unit.id)).toEqual(['defender']);
    expect(state.cards[0]?.zoneId).toBe('grave-a');
    expect(state.battlefields[0]?.controllerId).toBe('b');
    expect(state.players.map((player) => player.score)).toEqual([0, 0]);
  });
  it('ne score pas une nouvelle conquête si le champ a déjà donné un point ce tour', () => {
    const input = scenario();
    input.scoredBattlefields.a = ['field'];
    const state = fight(start(input), 2, 2);
    expect(state.battlefields[0]?.controllerId).toBe('a');
    expect(state.players[0]?.score).toBe(0);
  });
  it('renforce un champ déjà contrôlé sans ouvrir de Showdown', () => {
    const input = scenario();
    input.units[1]!.ownerId = 'a';
    input.battlefields[0]!.controllerId = 'a';
    const state = apply(input, {
      type: 'move',
      playerId: 'a',
      unitId: 'attacker',
      destinationId: 'field',
    });
    expect(state.showdown).toBeNull();
    expect(state.units[0]?.zoneId).toBe('field');
  });
  it('ouvre le combat avec attaquant prioritaire et conserve le contrôle du défenseur', () => {
    const result = apply(scenario(), {
      type: 'move',
      playerId: 'a',
      unitId: 'attacker',
      destinationId: 'field',
    });
    expect(result.showdown).toMatchObject({
      kind: 'combat',
      initiatorId: 'a',
      defenderId: 'b',
      priorityPlayerId: 'a',
      stage: 'priority',
    });
    expect(result.battlefields[0]?.controllerId).toBe('b');
    expect(result.units[0]?.ready).toBe(false);
  });
  it('attend deux passes puis les deux répartitions avant les dégâts simultanés', () => {
    let state = start(scenario(2, 2));
    expect(state.showdown).toMatchObject({ stage: 'damage' });
    state = apply(state, {
      type: 'assign-damage',
      playerId: 'a',
      allocations: [{ targetId: 'defender', amount: 2 }],
    });
    expect(state.units).toHaveLength(2);
    expect(state.units.every((u) => u.damage === 0)).toBe(true);
    state = apply(state, {
      type: 'assign-damage',
      playerId: 'b',
      allocations: [{ targetId: 'attacker', amount: 2 }],
    });
    expect(state.units).toHaveLength(0);
    expect(state.cards.map((c) => c.zoneId)).toEqual(['grave-a', 'grave-b']);
    expect(state.battlefields[0]?.controllerId).toBeNull();
    expect(state.players.map((p) => p.score)).toEqual([0, 0]);
    expect(state.showdown).toBeNull();
  });
  it('conquiert après victoire et soigne aussi les unités hors combat', () => {
    const input = scenario();
    input.units.push({
      id: 'outside',
      definitionId: 'outside',
      ownerId: 'b',
      zoneId: 'base-b',
      ready: false,
      might: 4,
      damage: 2,
    });
    const state = fight(start(input), 2, 2);
    expect(state.battlefields[0]?.controllerId).toBe('a');
    expect(state.players[0]?.score).toBe(1);
    expect(state.units.every((u) => u.damage === 0)).toBe(true);
    expect(state.units.find((u) => u.id === 'attacker')?.zoneId).toBe('field');
  });
  it('renvoie les attaquants survivants en base quand les deux camps survivent', () => {
    const input = scenario(3, 3);
    input.units.forEach((u) => {
      u.stunned = true;
    });
    const state = fight(start(input), 0, 0);
    expect(state.units.find((u) => u.id === 'attacker')).toMatchObject({
      zoneId: 'base-a',
      ready: false,
    });
    expect(state.battlefields[0]?.controllerId).toBe('b');
    expect(state.players[0]?.score).toBe(0);
  });
  it('laisse une Might 0 vivante sans dégâts mais la tue avec un point', () => {
    expect(fight(start(scenario(0, 0)), 0, 0).units).toHaveLength(2);
    const state = fight(start(scenario(1, 0)), 1, 0);
    expect(state.cards.map((c) => c.id)).toEqual(['defender']);
    expect(state.units[0]?.id).toBe('attacker');
  });
  it('refuse dégâts anticipés, sous-attribution, mauvais camp et deuxième soumission', () => {
    expect(
      act(scenario(), { type: 'assign-damage', playerId: 'a', allocations: [] })
        .ok,
    ).toBe(false);
    const state = start();
    const before = structuredClone(state);
    for (const allocations of [
      [{ targetId: 'defender', amount: 1 }],
      [{ targetId: 'attacker', amount: 2 }],
      [{ targetId: 'defender', amount: -2 }],
      [{ targetId: 'defender', amount: Number.NaN }],
    ]) {
      expect(
        act(state, { type: 'assign-damage', playerId: 'a', allocations }).ok,
      ).toBe(false);
    }
    const submitted = apply(state, {
      type: 'assign-damage',
      playerId: 'a',
      allocations: [{ targetId: 'defender', amount: 2 }],
    });
    expect(
      act(submitted, {
        type: 'assign-damage',
        playerId: 'a',
        allocations: [{ targetId: 'defender', amount: 2 }],
      }).ok,
    ).toBe(false);
    expect(act(state, { type: 'pass', playerId: 'a' }).ok).toBe(false);
    expect(state).toEqual(before);
  });
  it('respecte Tank et Backline et exige un montant létal avant la cible suivante', () => {
    const input = scenario(6, 2);
    input.units[1]!.tank = true;
    input.units.push(
      {
        id: 'normal',
        definitionId: 'n',
        ownerId: 'b',
        zoneId: 'field',
        ready: true,
        might: 2,
        damage: 0,
      },
      {
        id: 'back',
        definitionId: 'n',
        ownerId: 'b',
        zoneId: 'field',
        ready: true,
        might: 2,
        damage: 0,
        backline: true,
      },
    );
    const state = start(input);
    for (const allocations of [
      [
        { targetId: 'normal', amount: 2 },
        { targetId: 'defender', amount: 2 },
        { targetId: 'back', amount: 2 },
      ],
      [
        { targetId: 'defender', amount: 2 },
        { targetId: 'back', amount: 2 },
        { targetId: 'normal', amount: 2 },
      ],
      [
        { targetId: 'defender', amount: 1 },
        { targetId: 'normal', amount: 2 },
        { targetId: 'back', amount: 3 },
      ],
    ])
      expect(
        act(state, { type: 'assign-damage', playerId: 'a', allocations }).ok,
      ).toBe(false);
    expect(
      act(state, {
        type: 'assign-damage',
        playerId: 'a',
        allocations: [
          { targetId: 'defender', amount: 2 },
          { targetId: 'normal', amount: 2 },
          { targetId: 'back', amount: 2 },
        ],
      }).ok,
    ).toBe(true);
  });
  it('autorise Tank + Backline avant ou après les unités normales', () => {
    const input = scenario(4, 2);
    input.units[1]!.tank = true;
    input.units[1]!.backline = true;
    input.units.push({
      id: 'normal',
      definitionId: 'n',
      ownerId: 'b',
      zoneId: 'field',
      ready: true,
      might: 2,
      damage: 0,
    });
    const state = start(input);
    for (const targets of [
      ['defender', 'normal'],
      ['normal', 'defender'],
    ])
      expect(
        act(state, {
          type: 'assign-damage',
          playerId: 'a',
          allocations: targets.map((targetId) => ({ targetId, amount: 2 })),
        }).ok,
      ).toBe(true);
  });
});
