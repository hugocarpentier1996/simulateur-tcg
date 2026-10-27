import { expect, it } from 'vitest';
import { zephyrSage } from '../../game-data/src/ogs/zephyr-sage.js';
import {
  act,
  effectiveMight,
  type GameState,
  type GameAction,
} from './index.js';
import { combatPower, lethalDamage } from './combat/allocation.js';

function scenario(): GameState {
  return {
    activePlayerId: 'a',
    phase: 'main',
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    unitDefinitions: [zephyrSage],
    zones: [
      { id: 'field', kind: 'battlefield' },
      ...['a', 'b'].flatMap((ownerId) => [
        { id: `base-${ownerId}`, kind: 'base' as const, ownerId },
        { id: `grave-${ownerId}`, kind: 'graveyard' as const, ownerId },
      ]),
    ],
    cards: [],
    resources: {},
    scoredBattlefields: {},
    battlefields: [{ zoneId: 'field', controllerId: 'b' }],
    units: [
      {
        id: 'attacker',
        definitionId: 'fixture',
        ownerId: 'a',
        zoneId: 'field',
        might: 6,
        ready: false,
        damage: 0,
      },
      {
        id: 'sage',
        definitionId: zephyrSage.id,
        ownerId: 'b',
        zoneId: 'field',
        might: 6,
        ready: false,
        damage: 0,
      },
    ],
    showdown: {
      kind: 'combat',
      battlefieldId: 'field',
      initiatorId: 'a',
      defenderId: 'b',
      participants: ['a', 'b'],
      priorityPlayerId: 'a',
      consecutivePasses: 0,
      stage: 'priority',
      assignments: {},
    },
  };
}
function step(state: GameState, action: GameAction) {
  const result = act(state, action);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

it('Shield augmente dégâts et seuil létal dans toutes les étapes du Combat Showdown défendu', () => {
  const s = scenario();
  const sage = s.units[1]!;
  for (const stage of ['priority', 'damage', 'effects'] as const) {
    if (s.showdown?.kind !== 'combat') throw new Error('Fixture');
    s.showdown.stage = stage;
    expect(effectiveMight(sage, s)).toBe(7);
    expect(combatPower([sage], s)).toBe(7);
    expect(lethalDamage({ ...sage, damage: 3 }, s)).toBe(4);
  }
  expect(sage.might).toBe(6);
});

it('Shield ne donne rien hors combat, en Open, à l’attaquant ou ailleurs sur le plateau', () => {
  const s = scenario();
  const sage = s.units[1]!;
  expect(effectiveMight(sage, { ...s, showdown: null })).toBe(6);
  expect(
    effectiveMight(sage, {
      ...s,
      showdown: {
        kind: 'open',
        battlefieldId: 'field',
        initiatorId: 'a',
        participants: ['a', 'b'],
        priorityPlayerId: 'a',
        consecutivePasses: 0,
      },
    }),
  ).toBe(6);
  expect(effectiveMight({ ...sage, ownerId: 'a' }, s)).toBe(6);
  expect(effectiveMight({ ...sage, zoneId: 'base-b' }, s)).toBe(6);
  expect(effectiveMight({ ...sage, definitionId: 'ordinary' }, s)).toBe(6);
});

it('survit à 6 dégâts en défense, est soigné puis retrouve 6 Might à la clôture', () => {
  let s = scenario();
  s = step(s, { type: 'pass', playerId: 'a' });
  s = step(s, { type: 'pass', playerId: 'b' });
  s = step(s, {
    type: 'assign-damage',
    playerId: 'a',
    allocations: [{ targetId: 'sage', amount: 6 }],
  });
  s = step(s, {
    type: 'assign-damage',
    playerId: 'b',
    allocations: [{ targetId: 'attacker', amount: 6 }],
  });
  expect(s.showdown).toBeNull();
  expect(s.units).toHaveLength(1);
  expect(s.units[0]).toMatchObject({ id: 'sage', damage: 0 });
  expect(effectiveMight(s.units[0]!, s)).toBe(6);
  expect(s.battlefields[0]!.controllerId).toBe('b');
  expect(s.players[0]!.score).toBe(0);
});

it('se joue Tap contre 6 énergie et 1 Power vert', () => {
  const s = scenario();
  s.showdown = null;
  s.activePlayerId = 'b';
  s.units = [];
  s.resources.b = { energy: 6, power: { vert: 1 } };
  s.zones.push({ id: 'hand', kind: 'hand', ownerId: 'b' });
  s.cards.push({
    id: 'card',
    definitionId: zephyrSage.id,
    ownerId: 'b',
    zoneId: 'hand',
  });
  const played = step(s, {
    type: 'play-unit',
    playerId: 'b',
    cardId: 'card',
    payment: { energyRunes: [], powerRunes: [] },
  });
  expect(played.units[0]).toMatchObject({
    might: 6,
    ready: false,
    zoneId: 'base-b',
  });
  expect(played.resources.b).toEqual({ energy: 0, power: { vert: 0 } });
});
