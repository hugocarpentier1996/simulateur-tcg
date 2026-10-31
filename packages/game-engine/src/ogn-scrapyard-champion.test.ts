import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { scrapyardChampion, hextechRay } from '../../game-data/src/index.js';
import type { GameState } from './types.js';

function scenario() {
  const s = spellScenario(hextechRay);
  s.unitDefinitions = [scrapyardChampion];
  s.cards.push(
    {
      id: 'champ',
      definitionId: scrapyardChampion.id,
      ownerId: 'a',
      zoneId: 'hand-a',
    },
    { id: 'h0', definitionId: 'x', ownerId: 'a', zoneId: 'hand-a' },
    { id: 'h1', definitionId: 'x', ownerId: 'a', zoneId: 'hand-a' },
  );
  s.resources.a = { energy: 6, power: { rouge: 2 } };
  return s;
}
const play = (s: GameState) =>
  step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'champ',
    payment: noRunes,
  });

it('Scrapyard Champion : sans Legion, aucun effet de mise en jeu', () => {
  const s = play(scenario());
  expect(s.stack ?? null).toBeNull();
  expect(s.pendingDiscard ?? null).toBeNull();
});

it('Scrapyard Champion : Legion — défausse 2 puis pioche 2', () => {
  let s = resolveTop(
    step(scenario(), {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  s = resolveTop(play(s));
  expect(s.pendingDiscard).toMatchObject({ remaining: 2, draw: 2 });
  s = step(s, { type: 'choose-discard', playerId: 'a', cardId: 'h0' });
  s = step(s, { type: 'choose-discard', playerId: 'a', cardId: 'h1' });
  expect(
    s.cards
      .filter((c) => c.zoneId === 'hand-a')
      .map((c) => c.id)
      .sort(),
  ).toEqual(['draw-a-0', 'draw-a-1']);
});
