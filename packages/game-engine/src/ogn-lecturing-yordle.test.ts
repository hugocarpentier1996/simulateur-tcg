import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { mobilize } from '../../game-data/src/index.js';
import { lecturingYordle } from '../../game-data/src/index.js';
it('Lecturing Yordle est Tank ; sa pioche résout même si la source disparaît', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [lecturingYordle];
  s.cards[0]!.definitionId = lecturingYordle.id;
  s = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'spell',
    payment: noRunes,
  });
  expect(s.units.find((u) => u.id === 'spell')?.tank).toBe(true);
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('deck-a');
  s = { ...s, units: s.units.filter((u) => u.id !== 'spell') };
  s = resolveTop(s);
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
});
