import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { partyFavors } from '../../game-data/src/index.js';

function cast() {
  const s = spellScenario(partyFavors);
  s.resources.a = { energy: 3, power: {} };
  s.cards.push(
    { id: 'b-card', definitionId: 'filler', ownerId: 'b', zoneId: 'deck-b' },
    ...['a', 'b'].map((p) => ({
      id: `rune-${p}`,
      definitionId: 'rune',
      ownerId: p,
      zoneId: `rune-pile-${p}`,
      color: 'vert',
    })),
  );
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

it('Party Favors : l’adversaire choisit Cartes ou Runes', () => {
  const s = cast();
  expect(s.pendingModeChoice).toMatchObject({ ownerId: 'b', partnerId: 'a' });
  expect(getLegalActions(s, 'b')).toEqual([
    { type: 'choose-mode', playerId: 'b', mode: 'favor-cards' },
    { type: 'choose-mode', playerId: 'b', mode: 'favor-runes' },
  ]);
  expect(
    act(s, { type: 'choose-mode', playerId: 'a', mode: 'favor-cards' }).ok,
  ).toBe(false);
});

it('Party Favors : Cartes -> chacun pioche 1 ; Runes -> chacun canalise 1 rune Tap', () => {
  const cards = step(cast(), {
    type: 'choose-mode',
    playerId: 'b',
    mode: 'favor-cards',
  });
  expect(cards.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
  expect(cards.cards.filter((c) => c.zoneId === 'hand-b')).toHaveLength(1);
  const runes = step(cast(), {
    type: 'choose-mode',
    playerId: 'b',
    mode: 'favor-runes',
  });
  expect(runes.cards.find((c) => c.id === 'rune-a')).toMatchObject({
    zoneId: 'runes-a',
    ready: false,
  });
  expect(runes.cards.find((c) => c.id === 'rune-b')).toMatchObject({
    zoneId: 'runes-b',
    ready: false,
  });
});
