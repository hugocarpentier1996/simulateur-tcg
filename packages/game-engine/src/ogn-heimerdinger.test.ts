import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { heimerdinger, leeSin, stupefy } from '../../game-data/src/index.js';

it('Heimerdinger : utilise la capacité Tap d’une unité alliée en se couchant lui-même', () => {
  const s0 = spellScenario(stupefy);
  s0.unitDefinitions = [heimerdinger, leeSin];
  s0.units = [
    { ...s0.units[0]!, id: 'heimer', definitionId: heimerdinger.id, might: 3 },
    { ...s0.units[0]!, id: 'lee', definitionId: leeSin.id, might: 5 },
    s0.units[1]!,
  ];
  const borrow = getLegalActions(s0, 'a').find(
    (a) =>
      a.type === 'activate-gear' &&
      a.gearId === 'heimer' &&
      a.borrowFromId === 'lee',
  );
  expect(borrow).toBeDefined();
  const s = resolveTop(step(s0, borrow!));
  expect(s.units.find((u) => u.id === 'heimer')).toMatchObject({
    ready: false,
    buffed: true,
  });
  expect(s.units.find((u) => u.id === 'lee')?.ready).toBe(true);
});
