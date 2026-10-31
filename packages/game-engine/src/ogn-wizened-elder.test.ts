import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { buffUnit } from './effects/buff.js';
import { wizenedElder, mobilize } from '../../game-data/src/index.js';

it('Wizened Elder : +1 Might supplémentaire tant qu’il est buffé', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [wizenedElder];
  s.units[0] = { ...s.units[0]!, definitionId: wizenedElder.id, might: 4 };
  expect(effectiveMight(s.units[0]!, s)).toBe(4);
  s = buffUnit(s, 'ally');
  expect(effectiveMight(s.units[0]!, s)).toBe(6);
});
