import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { act } from './index.js';
import { rhasaTheSunderer, mobilize } from '../../game-data/src/index.js';

it('Rhasa the Sunderer : coûte 1 énergie de moins par carte de son cimetière', () => {
  const s = spellScenario(mobilize);
  s.unitDefinitions = [rhasaTheSunderer];
  s.cards[0]!.definitionId = rhasaTheSunderer.id;
  s.resources.a = { energy: 3, power: { violet: 1 } };
  const play = {
    type: 'play-unit' as const,
    playerId: 'a',
    cardId: 'spell',
    payment: noRunes,
  };
  for (let i = 0; i < 6; i++)
    s.cards.push({
      id: `t${i}`,
      definitionId: 'x',
      ownerId: 'a',
      zoneId: 'graveyard-a',
    });
  expect(act(s, play).ok).toBe(false);
  s.cards.push({
    id: 't6',
    definitionId: 'x',
    ownerId: 'a',
    zoneId: 'graveyard-a',
  });
  expect(step(s, play).resources.a?.energy).toBe(0);
});
