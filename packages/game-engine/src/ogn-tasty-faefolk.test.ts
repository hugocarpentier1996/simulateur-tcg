import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { tastyFaefolk, vengeance } from '../../game-data/src/index.js';

it('Tasty Faefolk : Deathknell, canalise 2 runes Tap puis pioche 1', () => {
  let s = spellScenario(vengeance);
  s.unitDefinitions = [tastyFaefolk];
  s.resources.a = { energy: 4, power: { jaune: 2 } };
  s.units[1] = { ...s.units[1]!, definitionId: tastyFaefolk.id, might: 6 };
  for (let i = 0; i < 3; i++)
    s.cards.push({
      id: `rb-${i}`,
      definitionId: 'rune',
      ownerId: 'b',
      zoneId: 'rune-pile-b',
      color: 'vert',
    });
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  s = step(
    s,
    getLegalActions(s, 'b').find((a) => a.type === 'queue-death-effects')!,
  );
  s = resolveTop(s);
  const runes = s.cards.filter((c) => c.zoneId === 'runes-b');
  expect(runes).toHaveLength(2);
  expect(runes.every((r) => r.ready === false)).toBe(true);
  expect(s.cards.find((c) => c.id === 'draw-b-0')!.zoneId).toBe('hand-b');
});

it('Tasty Faefolk a Accelerate (Calm)', () => {
  expect(tastyFaefolk.accelerate).toEqual({ power: 'vert' });
});
