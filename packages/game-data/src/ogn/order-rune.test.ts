import { expect, it } from 'vitest';
import * as cards from '../index.js';
it('Order Rune expose sa couleur et son identité', () => {
  expect(cards.orderRune).toMatchObject({
    id: 'ogn-214-298',
    type: 'rune',
    color: 'jaune',
  });
  expect(cards.createRuneCard(cards.orderRune, 'r1')).toEqual({
    id: 'r1',
    definitionId: 'ogn-214-298',
    color: 'jaune',
  });
});
