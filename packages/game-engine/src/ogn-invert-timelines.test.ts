import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { invertTimelines } from '../../game-data/src/index.js';

it('Invert Timelines : chaque joueur défausse sa main puis pioche 4', () => {
  const s = spellScenario(invertTimelines);
  s.resources.a = { energy: 3, power: { violet: 1 } };
  s.cards.push(
    { id: 'keep-a', definitionId: 'x', ownerId: 'a', zoneId: 'hand-a' },
    { id: 'keep-b', definitionId: 'x', ownerId: 'b', zoneId: 'hand-b' },
    ...[0, 1, 2, 3, 4].map((i) => ({
      id: `deck-b-${i}`,
      definitionId: 'x',
      ownerId: 'b',
      zoneId: 'deck-b',
    })),
    { id: 'draw-a-3', definitionId: 'x', ownerId: 'a', zoneId: 'deck-a' },
  );
  const after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  const zone = (id: string) => after.cards.find((c) => c.id === id)?.zoneId;
  expect(zone('keep-a')).toBe('graveyard-a');
  expect(zone('keep-b')).toBe('graveyard-b');
  expect(zone('spell')).toBe('graveyard-a');
  expect(after.cards.filter((c) => c.zoneId === 'hand-a')).toHaveLength(4);
  expect(after.cards.filter((c) => c.zoneId === 'hand-b')).toHaveLength(4);
});
