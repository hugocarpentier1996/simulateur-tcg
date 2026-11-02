import { expect, it } from 'vitest';
import { spellScenario, drain } from './origins-test-fixtures.js';
import { startTurn } from './turn/progression.js';
import { theGrandPlaza, gust } from '../../game-data/src/index.js';

function scenario(count: number) {
  const s = spellScenario(gust);
  s.battlefieldDefinitions = [theGrandPlaza];
  s.battlefields[0]!.definitionId = theGrandPlaza.id;
  for (let i = 1; i < count; i++) s.units.push({ ...s.units[0]!, id: `u${i}` });
  return s;
}

it('The Grand Plaza : tenir ici avec 7 unités ou plus gagne la partie (capacité sur la pile)', () => {
  expect(drain(startTurn(scenario(6)).state).result ?? null).toBeNull();
  const held = startTurn(scenario(7)).state;
  expect(held.result ?? null).toBeNull();
  expect(drain(held).result).toEqual({
    winnerId: 'a',
    reason: 'GRAND_PLAZA',
  });
});

it('The Grand Plaza : condition revérifiée à la résolution (une unité retirée en réaction)', () => {
  const held = startTurn(scenario(7)).state;
  const reacted = { ...held, units: held.units.filter((u) => u.id !== 'u1') };
  expect(drain(reacted).result ?? null).toBeNull();
});
