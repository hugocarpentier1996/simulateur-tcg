import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './act.js';
import { progressDay } from '../../game-data/src/index.js';

const cast = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'a',
  payment: noRunes,
};

it('Progress Day : sort normal, pioche 4 après réactions', () => {
  let s = spellScenario(progressDay);
  s.resources.a = { energy: 6, power: { bleu: 1 } };
  for (let i = 3; i < 6; i++)
    s.cards.push({
      id: `draw-a-${i}`,
      definitionId: 'test',
      ownerId: 'a',
      zoneId: 'deck-a',
    });
  s = step(s, cast);
  expect(s.cards.filter((c) => c.zoneId === 'hand-a')).toHaveLength(0);
  s = resolveTop(s);
  expect(s.cards.filter((c) => c.zoneId === 'hand-a')).toHaveLength(4);
  expect(s.cards.filter((c) => c.zoneId === 'deck-a')).toHaveLength(2);
});

it('Progress Day ne se joue pas pendant un Showdown', () => {
  const s = spellScenario(progressDay);
  s.resources.a = { energy: 6, power: { bleu: 1 } };
  s.showdown = {
    kind: 'open',
    battlefieldId: 'g',
    initiatorId: 'a',
    participants: ['a', 'b'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
  };
  expect(act(s, cast).ok).toBe(false);
});
