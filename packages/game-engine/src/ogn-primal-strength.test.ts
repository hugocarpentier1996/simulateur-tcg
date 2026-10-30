import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { effectiveMight } from './index.js';
import { primalStrength } from '../../game-data/src/index.js';

it('Primal Strength : +7 Might à une unité jusqu’à la fin du tour, y compris en base', () => {
  let s = spellScenario(primalStrength);
  s.resources.a = { energy: 4, power: { orange: 1 } };
  s.units[0]!.zoneId = 'base-a';
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'ally',
    payment: noRunes,
  });
  expect(effectiveMight(s.units[0]!, s)).toBe(3);
  s = resolveTop(s);
  expect(effectiveMight(s.units[0]!, s)).toBe(10);
  s = step(s, { type: 'end-turn', playerId: 'a' });
  expect(
    effectiveMight(
      s.units.find((u) => u.id === 'ally')!,
      s,
    ),
  ).toBe(3);
});

it('Primal Strength peut aussi viser une unité adverse', () => {
  let s = spellScenario(primalStrength);
  s.resources.a = { energy: 4, power: { orange: 1 } };
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(effectiveMight(s.units[1]!, s)).toBe(10);
});
