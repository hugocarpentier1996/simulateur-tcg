import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { jinx, mobilize } from '../../game-data/src/index.js';

function scenario(handSize: number) {
  const s = spellScenario(mobilize);
  s.unitDefinitions = [jinx];
  s.cards[0]!.definitionId = jinx.id;
  s.resources.a = { energy: 3, power: { rouge: 1 } };
  for (let i = 0; i < handSize; i++)
    s.cards.push({
      id: `h${i}`,
      definitionId: 'x',
      ownerId: 'a',
      zoneId: 'hand-a',
    });
  return s;
}
const play = {
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'spell',
  payment: noRunes,
};

it('Jinx : à la mise en jeu, défausse 2 cartes choisies, sans pioche', () => {
  let s = resolveTop(step(scenario(3), play));
  expect(s.pendingDiscard).toMatchObject({ playerId: 'a', remaining: 2 });
  expect(
    getLegalActions(s, 'a').filter((a) => a.type === 'choose-discard'),
  ).toHaveLength(3);
  s = step(s, { type: 'choose-discard', playerId: 'a', cardId: 'h0' });
  expect(s.pendingDiscard).toMatchObject({ remaining: 1 });
  s = step(s, { type: 'choose-discard', playerId: 'a', cardId: 'h2' });
  expect(s.pendingDiscard ?? null).toBeNull();
  const zone = (id: string) => s.cards.find((c) => c.id === id)?.zoneId;
  expect([zone('h0'), zone('h1'), zone('h2')]).toEqual([
    'graveyard-a',
    'hand-a',
    'graveyard-a',
  ]);
  expect(zone('draw-a-0')).toBe('deck-a');
});

it('Jinx : main plus petite -> défausse ce qui reste ; Assault 2', () => {
  let s = resolveTop(step(scenario(1), play));
  s = step(s, { type: 'choose-discard', playerId: 'a', cardId: 'h0' });
  expect(s.pendingDiscard ?? null).toBeNull();
  expect(jinx.assault).toBe(2);
  expect(resolveTop(step(scenario(0), play)).pendingDiscard ?? null).toBeNull();
});
