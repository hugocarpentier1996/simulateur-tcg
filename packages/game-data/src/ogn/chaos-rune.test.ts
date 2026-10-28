import { expect, it } from 'vitest';
import * as cards from '../index.js';
it('Chaos Rune expose sa couleur et son identité', () => {
  expect(cards.chaosRune).toMatchObject({
    id: 'ogn-166-298',
    type: 'rune',
    color: 'violet',
  });
  expect(cards.createRuneCard(cards.chaosRune, 'r1')).toEqual({
    id: 'r1',
    definitionId: 'ogn-166-298',
    color: 'violet',
  });
});
