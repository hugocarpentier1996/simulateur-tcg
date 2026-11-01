import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { stackedDeck } from '../../game-data/src/index.js';

function cast() {
  const s = spellScenario(stackedDeck);
  s.resources.a = { energy: 1, power: {} };
  return resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
}

it('Stacked Deck : regarde les 3 cartes du dessus, en garde 1, recycle les autres', () => {
  let s = cast();
  expect(s.pendingPick).toMatchObject({
    playerId: 'a',
    cardIds: ['draw-a-0', 'draw-a-1', 'draw-a-2'],
  });
  const picks = getLegalActions(s, 'a').filter((a) => a.type === 'choose-pick');
  expect(picks).toHaveLength(3);
  expect(act(s, { type: 'end-turn', playerId: 'a' }).ok).toBe(false);
  s = step(s, { type: 'choose-pick', playerId: 'a', cardId: 'draw-a-1' });
  expect(s.pendingPick ?? null).toBeNull();
  expect(s.cards.find((c) => c.id === 'draw-a-1')?.zoneId).toBe('hand-a');
  const deck = s.cards.filter((c) => c.zoneId === 'deck-a').map((c) => c.id);
  expect(deck.slice(-2)).toEqual(['draw-a-0', 'draw-a-2']);
  expect(s.stack ?? null).toBeNull();
});
