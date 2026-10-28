import { expect, it } from 'vitest';
import * as cards from '../index.js';
it('Fury Rune expose sa couleur et son identité', () => {
  expect(cards.furyRune).toMatchObject({
    id: 'ogn-007-298',
    type: 'rune',
    color: 'rouge',
  });
  expect(cards.createRuneCard(cards.furyRune, 'r1')).toEqual({
    id: 'r1',
    definitionId: 'ogn-007-298',
    color: 'rouge',
  });
});
