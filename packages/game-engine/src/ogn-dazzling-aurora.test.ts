import { expect, it } from 'vitest';
import { spellScenario, step } from './origins-test-fixtures.js';
import {
  dazzlingAurora,
  kinkouMonk,
  stupefy,
} from '../../game-data/src/index.js';

it('Dazzling Aurora : fin de tour, révèle jusqu’à une unité, la joue gratuitement, recycle le reste', () => {
  const s0 = spellScenario(stupefy);
  s0.gearDefinitions = [dazzlingAurora];
  s0.unitDefinitions = [kinkouMonk];
  s0.gears = [
    {
      id: 'aurora',
      definitionId: dazzlingAurora.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  s0.cards = s0.cards.filter((c) => c.zoneId !== 'deck-a');
  s0.cards.push(
    { id: 'x1', definitionId: 'filler', ownerId: 'a', zoneId: 'deck-a' },
    { id: 'x2', definitionId: 'filler', ownerId: 'a', zoneId: 'deck-a' },
    { id: 'monk', definitionId: kinkouMonk.id, ownerId: 'a', zoneId: 'deck-a' },
    { id: 'x3', definitionId: 'filler', ownerId: 'a', zoneId: 'deck-a' },
  );
  let s = step(s0, { type: 'end-turn', playerId: 'a' });
  expect(s.stack?.entries.at(-1)).toMatchObject({
    kind: 'play-effect',
    sourceId: 'aurora',
  });
  s = step(s, { type: 'pass', playerId: 'a' });
  s = step(s, { type: 'pass', playerId: 'b' });
  expect(s.units.find((u) => u.id === 'monk')?.zoneId).toBe('base-a');
  const deck = s.cards.filter((c) => c.zoneId === 'deck-a').map((c) => c.id);
  expect(deck.slice(-2)).toEqual(['x1', 'x2']);
});
