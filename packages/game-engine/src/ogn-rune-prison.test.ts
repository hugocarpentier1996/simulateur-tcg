import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { isStunned } from './effects/modifiers.js';
import { runePrison } from '../../game-data/src/index.js';

it('Rune Prison : étourdit une unité quelconque jusqu’à la fin du tour', () => {
  let s = spellScenario(runePrison);
  s.resources.a = { energy: 2, power: { vert: 1 } };
  s.units[1]!.zoneId = 'base-b';
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: noRunes,
  });
  expect(isStunned(s.units[1]!)).toBe(false);
  s = resolveTop(s);
  expect(isStunned(s.units.find((u) => u.id === 'enemy')!)).toBe(true);
  s = step(s, { type: 'end-turn', playerId: 'a' });
  expect(isStunned(s.units.find((u) => u.id === 'enemy')!)).toBe(false);
});
