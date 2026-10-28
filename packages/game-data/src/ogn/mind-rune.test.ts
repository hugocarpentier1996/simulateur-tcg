import { expect, it } from 'vitest';
import * as cards from '../index.js';
it('Mind Rune expose sa couleur et son identité', () => {
  expect(cards.mindRune).toMatchObject({
    id: 'ogn-089-298',
    type: 'rune',
    color: 'bleu',
  });
  expect(cards.createRuneCard(cards.mindRune, 'r1')).toEqual({
    id: 'r1',
    definitionId: 'ogn-089-298',
    color: 'bleu',
  });
});
