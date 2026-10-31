import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import { retreat } from '../../game-data/src/index.js';

const cast = (targetId: string) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId,
  payment: noRunes,
});

it('Retreat : renvoie une unité alliée en main et canalise 1 rune Tap', () => {
  let s = spellScenario(retreat);
  s.resources.a = { energy: 1, power: {} };
  s.cards.push({
    id: 'rune-0',
    definitionId: 'rune',
    ownerId: 'a',
    zoneId: 'rune-pile-a',
    color: 'bleu',
  });
  expect(act(s, cast('enemy')).ok).toBe(false);
  s = resolveTop(step(s, cast('ally')));
  expect(s.units.some((u) => u.id === 'ally')).toBe(false);
  expect(s.cards.find((c) => c.id === 'ally')?.zoneId).toBe('hand-a');
  expect(s.cards.find((c) => c.id === 'rune-0')).toMatchObject({
    zoneId: 'runes-a',
    ready: false,
  });
});
