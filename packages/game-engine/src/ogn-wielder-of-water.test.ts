import { expect, it } from 'vitest';
import { act, effectiveMight, type GameState } from './index.js';
import { wujuBladesman, wielderOfWater } from '../../game-data/src/index.js';
const definition = wielderOfWater;
function fixture(attacking: boolean): GameState {
  return {
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    activePlayerId: 'a',
    phase: 'main',
    resources: { a: { energy: 3, power: {} } },
    cards: [],
    zones: [
      { id: 'f', kind: 'battlefield' },
      { id: 'base', kind: 'base', ownerId: 'a' },
      { id: 'hand', kind: 'hand', ownerId: 'a' },
      { id: 'legend', kind: 'legend', ownerId: 'a' },
    ],
    battlefields: [{ zoneId: 'f', controllerId: attacking ? 'b' : 'a' }],
    scoredBattlefields: {},
    unitDefinitions: [definition],
    units: [
      {
        id: 'w',
        definitionId: definition.id,
        ownerId: 'a',
        zoneId: 'f',
        ready: false,
        might: 2,
        damage: 0,
      },
    ],
    showdown: {
      kind: 'combat',
      battlefieldId: 'f',
      initiatorId: attacking ? 'a' : 'b',
      defenderId: attacking ? 'b' : 'a',
      participants: ['a', 'b'],
      priorityPlayerId: 'a',
      consecutivePasses: 0,
      stage: 'priority',
      assignments: {},
    },
  };
}
it.each([true, false])(
  'Wielder of Water : bonus dynamique seul en combat, attaquant=%s',
  (attacking) => {
    const s = fixture(attacking);
    expect(effectiveMight(s.units[0]!, s)).toBe(4);
    s.units.push({ ...s.units[0]!, id: 'reinforcement', zoneId: 'base' });
    expect(effectiveMight(s.units[0]!, s)).toBe(4);
    s.units[1]!.zoneId = 'f';
    expect(effectiveMight(s.units[0]!, s)).toBe(2);
    s.units.pop();
    expect(effectiveMight(s.units[0]!, s)).toBe(4);
    s.showdown = {
      kind: 'open',
      battlefieldId: 'f',
      initiatorId: 'a',
      participants: ['a', 'b'],
      priorityPlayerId: 'a',
      consecutivePasses: 0,
    };
    expect(effectiveMight(s.units[0]!, s)).toBe(2);
  },
);
it('cumule son bonus personnel avec Wuju en défense et paie 3 énergie pour entrer Tap', () => {
  const s = fixture(false);
  s.legendDefinitions = [wujuBladesman];
  s.cards.push({
    id: 'legend',
    definitionId: wujuBladesman.id,
    ownerId: 'a',
    zoneId: 'legend',
  });
  expect(effectiveMight(s.units[0]!, s)).toBe(6);
  s.showdown = null;
  s.cards.push({
    id: 'second',
    definitionId: definition.id,
    ownerId: 'a',
    zoneId: 'hand',
  });
  const r = act(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'second',
    payment: { energyRunes: [], powerRunes: [] },
  });
  expect(r.ok).toBe(true);
  if (!r.ok) throw new Error(r.reason);
  expect(r.state.units.find((u) => u.id === 'second')).toMatchObject({
    might: 2,
    ready: false,
  });
  expect(r.state.resources.a!.energy).toBe(0);
});
