import { expect, it } from 'vitest';
import { spellScenario, resolveTop } from './origins-test-fixtures.js';
import { startTurn } from './turn/progression.js';
import { reckonersArena, kaiSaFury, gust } from '../../game-data/src/index.js';

it('Reckoner’s Arena : tenir ici active les effets de conquête des unités présentes', () => {
  const s0 = spellScenario(gust);
  s0.unitDefinitions = [kaiSaFury];
  s0.battlefieldDefinitions = [reckonersArena];
  s0.battlefields[0]!.definitionId = reckonersArena.id;
  s0.units[0] = { ...s0.units[0]!, definitionId: kaiSaFury.id };
  let s = startTurn(s0).state;
  expect(s.stack?.entries.at(-1)).toMatchObject({
    kind: 'legend-draw',
    sourceId: 'ally',
    count: 1,
  });
  s = resolveTop(s);
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
});
