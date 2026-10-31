import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { effectiveMight } from './index.js';
import { draven, flash } from '../../game-data/src/index.js';

it.each([
  [0, 3],
  [5, 8],
])('Draven : %i point(s) -> Might %i, partout', (score, might) => {
  const s = spellScenario(flash);
  s.unitDefinitions = [draven];
  s.units[0] = { ...s.units[0]!, definitionId: draven.id, might: 3 };
  s.players[0]!.score = score;
  s.players[1]!.score = 7;
  expect(effectiveMight(s.units[0]!, s)).toBe(might);
  s.units[0]!.zoneId = 'base-a';
  expect(effectiveMight(s.units[0]!, s)).toBe(might);
});
