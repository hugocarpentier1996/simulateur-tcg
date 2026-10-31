import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { startTurn } from './turn/progression.js';
import { theGrandPlaza, gust } from '../../game-data/src/index.js';

function scenario(count: number) {
  const s = spellScenario(gust);
  s.battlefieldDefinitions = [theGrandPlaza];
  s.battlefields[0]!.definitionId = theGrandPlaza.id;
  for (let i = 1; i < count; i++) s.units.push({ ...s.units[0]!, id: `u${i}` });
  return s;
}

it('The Grand Plaza : tenir ici avec 7 unités ou plus gagne la partie', () => {
  expect(startTurn(scenario(6)).state.result ?? null).toBeNull();
  expect(startTurn(scenario(7)).state.result).toEqual({
    winnerId: 'a',
    reason: 'GRAND_PLAZA',
  });
});
