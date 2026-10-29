import { expect, it } from 'vitest';
import { trifarianWarCamp, gust } from '../../game-data/src/index.js';
import { spellScenario } from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
it('War Camp renforce les deux camps uniquement sur son champ, même sans contrôle', () => {
  const s = spellScenario(gust);
  s.battlefieldDefinitions = [trifarianWarCamp];
  s.battlefields[0]!.definitionId = trifarianWarCamp.id;
  s.battlefields[0]!.controllerId = null;
  expect(effectiveMight(s.units[0]!, s)).toBe(4);
  expect(effectiveMight(s.units[1]!, s)).toBe(3);
  s.units[1]!.zoneId = 'f';
  expect(effectiveMight(s.units[1]!, s)).toBe(4);
  s.units[0]!.zoneId = 'base-a';
  expect(effectiveMight(s.units[0]!, s)).toBe(3);
});
