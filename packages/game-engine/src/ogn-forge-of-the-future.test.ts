import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import {
  forgeOfTheFuture,
  recruitToken,
  stupefy,
} from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.gearDefinitions = [forgeOfTheFuture];
  s.unitDefinitions = [recruitToken];
  s.cards.push(
    {
      id: 'forge',
      definitionId: forgeOfTheFuture.id,
      ownerId: 'a',
      zoneId: 'hand-a',
    },
    { id: 'ta', definitionId: 'filler', ownerId: 'a', zoneId: 'graveyard-a' },
    { id: 'tb', definitionId: 'filler', ownerId: 'b', zoneId: 'graveyard-b' },
  );
  s.resources.a = { energy: 2, power: {} };
  return step(s, {
    type: 'play-gear',
    playerId: 'a',
    cardId: 'forge',
    payment: noRunes,
  });
}

it('Forge of the Future : posé, joue un jeton Recrue 1 dans sa base', () => {
  const s = scenario();
  expect(
    s.units.some(
      (u) => u.definitionId === recruitToken.id && u.zoneId === 'base-a',
    ),
  ).toBe(true);
});

it('Forge of the Future : le détruire recycle jusqu’à 4 cartes des cimetières, au choix', () => {
  let s = resolveTop(
    step(scenario(), {
      type: 'activate-gear',
      playerId: 'a',
      gearId: 'forge',
      payment: noRunes,
    }),
  );
  expect(s.cards.find((c) => c.id === 'forge')?.zoneId).toBe('graveyard-a');
  expect(s.pendingModeChoice?.modes).toEqual([
    'skip',
    'recycle-any:ta',
    'recycle-any:tb',
    'recycle-any:forge',
  ]);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'recycle-any:tb' });
  expect(s.cards.find((c) => c.id === 'tb')?.zoneId).toBe('deck-b');
  expect(s.pendingModeChoice?.modes).toEqual([
    'skip',
    'recycle-any:ta',
    'recycle-any:forge',
  ]);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'skip' });
  expect(s.pendingModeChoice ?? null).toBeNull();
  expect(s.cards.find((c) => c.id === 'ta')?.zoneId).toBe('graveyard-a');
});
