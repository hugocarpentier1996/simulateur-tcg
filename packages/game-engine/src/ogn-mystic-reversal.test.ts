import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { mysticReversal, hextechRay } from '../../game-data/src/index.js';

it('Mystic Reversal : prend le contrôle d’un sort de la pile, qui reste sur ses cibles', () => {
  const s = spellScenario(mysticReversal);
  s.resources.a = { energy: 4, power: { vert: 3 } };
  s.activePlayerId = 'b';
  s.spellDefinitions = [mysticReversal, hextechRay];
  s.stack = {
    entries: [
      {
        card: {
          id: 'ray',
          definitionId: hextechRay.id,
          ownerId: 'b',
          zoneId: 'hand-b',
        },
        definition: hextechRay,
        casterId: 'b',
        targetId: 'enemy',
      },
    ],
    initiatorId: 'b',
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  let after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'ray',
      payment: noRunes,
    }),
  );
  expect(after.stack?.entries[0]).toMatchObject({ casterId: 'a' });
  after = resolveTop(after);
  expect(after.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(after.cards.find((c) => c.id === 'ray')?.zoneId).toBe('graveyard-b');
});
