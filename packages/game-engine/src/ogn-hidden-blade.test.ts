import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { hiddenBlade } from '../../game-data/src/index.js';

it('Hidden Blade : tue une unité sur un champ, son contrôleur pioche 2', () => {
  const s = spellScenario(hiddenBlade);
  s.resources.a = { energy: 2, power: { jaune: 1 } };
  s.cards.push(
    ...['b0', 'b1'].map((id) => ({
      id,
      definitionId: 'filler',
      ownerId: 'b',
      zoneId: 'deck-b',
    })),
  );
  const after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(after.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(after.cards.filter((c) => c.zoneId === 'hand-b')).toHaveLength(2);
});
