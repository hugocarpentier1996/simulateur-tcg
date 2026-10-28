import { expect, it } from 'vitest';
import * as cards from '../index.js';
it('Body Rune fournit une instance orange compatible avec le moteur', () => {
  expect(cards.bodyRune).toMatchObject({
    id: 'ogn-126-298',
    type: 'rune',
    color: 'orange',
  });
  expect(cards.createRuneCard(cards.bodyRune, 'r1')).toEqual({
    id: 'r1',
    definitionId: 'ogn-126-298',
    color: 'orange',
  });
});
