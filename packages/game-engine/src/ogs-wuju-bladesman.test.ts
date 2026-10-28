import { expect, it } from 'vitest';
import { effectiveMight, type GameState } from './index.js';
import { wujuBladesman } from '../../game-data/src/index.js';
const legend = wujuBladesman;
export function legendFixture(): GameState {
  return {
    players: [
      { id: 'a', score: 0 },
      { id: 'b', score: 0 },
    ],
    activePlayerId: 'a',
    phase: 'main',
    resources: {},
    cards: [
      {
        id: 'legend',
        definitionId: legend.id,
        ownerId: 'b',
        zoneId: 'legend-b',
        ready: false,
      },
    ],
    legendDefinitions: [legend],
    zones: [
      { id: 'f', kind: 'battlefield' },
      { id: 'base-b', kind: 'base', ownerId: 'b' },
      { id: 'legend-b', kind: 'legend', ownerId: 'b' },
    ],
    battlefields: [{ zoneId: 'f', controllerId: 'b' }],
    scoredBattlefields: {},
    units: [
      {
        id: 'u',
        definitionId: 'unit',
        ownerId: 'b',
        zoneId: 'f',
        ready: false,
        might: 3,
        damage: 0,
      },
    ],
    showdown: {
      kind: 'combat',
      battlefieldId: 'f',
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
it('donne +2 au seul défenseur, même légende Tap et pendant les effets', () => {
  const s = legendFixture();
  expect(effectiveMight(s.units[0]!, s)).toBe(5);
  if (s.showdown?.kind === 'combat') s.showdown.stage = 'effects';
  expect(effectiveMight(s.units[0]!, s)).toBe(5);
  s.units.push({ ...s.units[0]!, id: 'other', zoneId: 'base-b' });
  expect(effectiveMight(s.units[0]!, s)).toBe(5);
  s.units[1]!.zoneId = 'f';
  expect(effectiveMight(s.units[0]!, s)).toBe(3);
});
it('ne donne rien en attaque, en Open, hors combat ou hors zone légende', () => {
  const s = legendFixture();
  s.units[0]!.ownerId = 'a';
  expect(effectiveMight(s.units[0]!, s)).toBe(3);
  s.units[0]!.ownerId = 'b';
  s.cards[0]!.zoneId = 'base-b';
  expect(effectiveMight(s.units[0]!, s)).toBe(3);
  s.cards[0]!.zoneId = 'legend-b';
  s.showdown = null;
  expect(effectiveMight(s.units[0]!, s)).toBe(3);
  s.showdown = {
    kind: 'open',
    battlefieldId: 'f',
    initiatorId: 'a',
    participants: ['a', 'b'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  expect(effectiveMight(s.units[0]!, s)).toBe(3);
});
