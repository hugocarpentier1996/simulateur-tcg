import { expect, it } from 'vitest';
import * as cards from '../index.js';
it('Calm Rune expose sa couleur et son identité', () => {
  expect(cards.calmRune).toMatchObject({
    id: 'ogn-042-298',
    type: 'rune',
    color: 'vert',
  });
  expect(cards.createRuneCard(cards.calmRune, 'r1')).toEqual({
    id: 'r1',
    definitionId: 'ogn-042-298',
    color: 'vert',
  });
});
