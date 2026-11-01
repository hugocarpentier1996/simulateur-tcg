import { expect, it } from 'vitest';
import { spellScenario, resolveTop } from './origins-test-fixtures.js';
import { startTurn } from './turn/progression.js';
import { navoriFightingPit, gust } from '../../game-data/src/index.js';

it('Navori Fighting Pit : tenir ce champ buffe une unité alliée ici', () => {
  const s0 = spellScenario(gust);
  s0.battlefieldDefinitions = [navoriFightingPit];
  s0.battlefields[0]!.definitionId = navoriFightingPit.id;
  let s = startTurn(s0).state;
  s = resolveTop(s);
  expect(s.units.find((u) => u.id === 'ally')?.buffed).toBe(true);
});
