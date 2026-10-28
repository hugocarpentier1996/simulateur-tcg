import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { stupefy } from '../../game-data/src/index.js';
it.each([0, 1, 2, 3])(
  'Stupefy réduit %i sans remonter 0 ni descendre sous 1, puis pioche',
  (might) => {
    let s = spellScenario(stupefy);
    s = {
      ...s,
      units: s.units.map((u) => (u.id === 'enemy' ? { ...u, might } : u)),
    };
    s = step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    });
    s = resolveTop(s);
    expect(
      effectiveMight(
        s.units.find((u) => u.id === 'enemy')!,
        s,
      ),
    ).toBe(might === 0 ? 0 : Math.max(1, might - 1));
    expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
  },
);
