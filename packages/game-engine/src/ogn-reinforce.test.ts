import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import {
  reinforce,
  kinkouMonk,
  soulgorger,
} from '../../game-data/src/index.js';

function cast(orange: number) {
  const s = spellScenario(reinforce);
  s.unitDefinitions = [kinkouMonk, soulgorger];
  s.cards = s.cards.filter((c) => c.zoneId !== 'deck-a');
  s.cards.push(
    { id: 'd0', definitionId: 'filler', ownerId: 'a', zoneId: 'deck-a' },
    { id: 'monk', definitionId: kinkouMonk.id, ownerId: 'a', zoneId: 'deck-a' },
    {
      id: 'gorger',
      definitionId: soulgorger.id,
      ownerId: 'a',
      zoneId: 'deck-a',
    },
    { id: 'd3', definitionId: 'filler', ownerId: 'a', zoneId: 'deck-a' },
    { id: 'd4', definitionId: 'filler', ownerId: 'a', zoneId: 'deck-a' },
    { id: 'd5', definitionId: 'filler', ownerId: 'a', zoneId: 'deck-a' },
  );
  s.resources.a = { energy: 5, power: { orange } };
  return resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
}

it('Reinforce : joue une unité parmi les 5 du dessus avec 5 énergie de moins, recycle le reste', () => {
  const s = cast(1);
  expect(s.pendingModeChoice?.modes).toEqual(['skip', 'reinforce:monk']);
  const after = step(s, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'reinforce:monk',
  });
  expect(after.units.find((u) => u.id === 'monk')?.zoneId).toBe('base-a');
  expect(
    after.cards.filter((c) => c.zoneId === 'deck-a').map((c) => c.id),
  ).toEqual(['d5', 'd0', 'gorger', 'd3', 'd4']);
  expect(after.resources.a?.power.orange ?? 0).toBe(0);
});

it('Reinforce : sans pouvoir payer le reste, seulement recycler', () => {
  const s = cast(0);
  expect(s.pendingModeChoice?.modes).toEqual(['skip']);
  const after = step(s, { type: 'choose-mode', playerId: 'a', mode: 'skip' });
  expect(
    after.cards.filter((c) => c.zoneId === 'deck-a').map((c) => c.id)[0],
  ).toBe('d5');
});
