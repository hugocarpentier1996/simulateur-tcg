import { expect, it } from 'vitest';
import { spellScenario, resolveTop } from './origins-test-fixtures.js';
import { startTurn } from './turn/progression.js';
import { groveOfTheGodWillow, gust } from '../../game-data/src/index.js';

it('Grove of the God-Willow : tenir ce champ fait piocher 1 via la pile', () => {
  const s0 = spellScenario(gust);
  s0.battlefieldDefinitions = [groveOfTheGodWillow];
  s0.battlefields[0]!.definitionId = groveOfTheGodWillow.id;
  let s = startTurn(s0).state;
  expect(s.players[0]!.score).toBe(1);
  expect(s.stack?.entries.at(-1)).toMatchObject({
    kind: 'legend-draw',
    ownerId: 'a',
    count: 1,
  });
  s = resolveTop(s);
  expect(
    s.cards.filter((c) => c.zoneId === 'hand-a').length,
  ).toBeGreaterThanOrEqual(2);
});
