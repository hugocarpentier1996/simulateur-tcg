import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { cannonBarrage } from '../../game-data/src/index.js';
it.each(['combat', 'open'] as const)(
  'Cannon Barrage ne blesse que les ennemis du combat actif : %s',
  (kind) => {
    let s = spellScenario(cannonBarrage);
    s = {
      ...s,
      units: [
        ...s.units.map((u) => (u.id === 'ally' ? { ...u, zoneId: 'g' } : u)),
        { ...s.units[1]!, id: 'other', zoneId: 'f' },
        { ...s.units[1]!, id: 'base-enemy', zoneId: 'base-b' },
      ],
      showdown:
        kind === 'combat'
          ? {
              kind,
              battlefieldId: 'g',
              initiatorId: 'a',
              defenderId: 'b',
              participants: ['a', 'b'],
              priorityPlayerId: 'a',
              consecutivePasses: 0,
              stage: 'priority',
              assignments: {},
            }
          : {
              kind,
              battlefieldId: 'g',
              initiatorId: 'a',
              participants: ['a', 'b'],
              priorityPlayerId: 'a',
              consecutivePasses: 0,
            },
    };
    s = step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    });
    s = resolveTop(s);
    expect(s.units.map((u) => [u.id, u.damage])).toEqual([
      ['ally', 0],
      ['enemy', kind === 'combat' ? 2 : 0],
      ['other', 0],
      ['base-enemy', 0],
    ]);
  },
);
