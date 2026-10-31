import { expect, it } from 'vitest';
import { spellScenario, resolveTop } from './origins-test-fixtures.js';
import { startTurn } from './turn/progression.js';
import { altarToUnity, recruitToken, gust } from '../../game-data/src/index.js';

it('Altar to Unity : tenir ce champ joue une Recrue 1 dans la base', () => {
  const s0 = spellScenario(gust);
  s0.unitDefinitions = [recruitToken];
  s0.battlefieldDefinitions = [altarToUnity];
  s0.battlefields[0]!.definitionId = altarToUnity.id;
  let s = startTurn(s0).state;
  s = resolveTop(s);
  expect(
    s.units
      .filter((u) => u.definitionId === recruitToken.id)
      .map((u) => u.zoneId),
  ).toEqual(['base-a']);
});
