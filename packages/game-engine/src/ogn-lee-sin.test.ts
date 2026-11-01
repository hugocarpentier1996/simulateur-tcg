import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { leeSin, stupefy } from '../../game-data/src/index.js';
import { effectiveMight } from './effects/modifiers.js';
import { spendBuff } from './effects/buff.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [leeSin];
  s.units[0] = { ...s.units[0]!, id: 'lee', definitionId: leeSin.id, might: 5 };
  return s;
}
const tap = {
  type: 'activate-gear' as const,
  playerId: 'a',
  gearId: 'lee',
  payment: noRunes,
};

it('Lee Sin : Tap — se buffe, sans limite de buffs', () => {
  let s = resolveTop(step(scenario(), tap));
  expect(effectiveMight(s.units[0]!, s)).toBe(6);
  s.units[0] = { ...s.units[0]!, ready: true };
  s = resolveTop(step(s, tap));
  expect(s.units[0]).toMatchObject({ buffed: true, extraBuffs: 1 });
  expect(effectiveMight(s.units[0]!, s)).toBe(7);
  const spent = spendBuff(s, 'lee')!;
  expect(effectiveMight(spent.units[0]!, spent)).toBe(6);
  expect(leeSin.shield).toBe(1);
});
