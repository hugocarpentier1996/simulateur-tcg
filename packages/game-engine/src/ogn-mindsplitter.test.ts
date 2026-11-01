import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { mindsplitter, stupefy } from '../../game-data/src/index.js';

it('Mindsplitter : à la mise en jeu, choisit une carte de la main adverse, défaussée', () => {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [mindsplitter];
  s.cards.push(
    {
      id: 'mind',
      definitionId: mindsplitter.id,
      ownerId: 'a',
      zoneId: 'hand-a',
    },
    { id: 'b1', definitionId: 'filler', ownerId: 'b', zoneId: 'hand-b' },
    { id: 'b2', definitionId: 'filler', ownerId: 'b', zoneId: 'hand-b' },
  );
  s.resources.a = { energy: 7, power: { violet: 2 } };
  let after = resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'mind',
      payment: noRunes,
    }),
  );
  expect(after.pendingModeChoice).toMatchObject({
    ownerId: 'a',
    modes: ['discard-opp:b1', 'discard-opp:b2'],
  });
  after = step(after, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'discard-opp:b2',
  });
  expect(after.cards.find((c) => c.id === 'b2')?.zoneId).toBe('graveyard-b');
  expect(after.cards.find((c) => c.id === 'b1')?.zoneId).toBe('hand-b');
});
