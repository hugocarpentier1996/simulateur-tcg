import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import { findYourCenter } from '../../game-data/src/index.js';

const cast = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'a',
  payment: noRunes,
};
function scenario(opponentScore: number) {
  const s = spellScenario(findYourCenter);
  s.resources.a = { energy: 1, power: {} };
  s.cards.push({
    id: 'rune-0',
    definitionId: 'rune',
    ownerId: 'a',
    zoneId: 'rune-pile-a',
    color: 'vert',
  });
  s.players = s.players.map((p) =>
    p.id === 'b' ? { ...p, score: opponentScore } : p,
  );
  return s;
}

it('Find Your Center : coûte 2 de moins si un adversaire est à 3 points de la victoire', () => {
  expect(act(scenario(4), cast).ok).toBe(false);
  const s = resolveTop(step(scenario(5), cast));
  expect(s.cards.find((c) => c.id === 'draw-a-0')!.zoneId).toBe('hand-a');
  expect(s.cards.find((c) => c.id === 'rune-0')).toMatchObject({
    zoneId: 'runes-a',
    ready: false,
  });
});
