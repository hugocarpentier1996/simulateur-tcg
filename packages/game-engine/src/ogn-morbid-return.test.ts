import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './act.js';
import { getLegalActions } from './legal/actions.js';
import { morbidReturn } from '../../game-data/src/index.js';
const cast = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'dead',
  payment: noRunes,
};
function setup() {
  const s = spellScenario(morbidReturn);
  return {
    ...s,
    unitDefinitions: [
      {
        id: 'soldier',
        type: 'unit' as const,
        might: 3,
        cost: { energy: 1, power: {} },
      },
    ],
    cards: [
      ...s.cards,
      {
        id: 'dead',
        definitionId: 'soldier',
        ownerId: 'a',
        zoneId: 'graveyard-a',
      },
    ],
  };
}
it('Morbid Return récupère une unité de sa défausse, jamais un sort, adversaire ou unité en jeu', () => {
  const s = setup();
  expect(getLegalActions(s, 'a')).toContainEqual(cast);
  const resolved = resolveTop(step(s, cast));
  expect(resolved.cards.find((c) => c.id === 'dead')?.zoneId).toBe('hand-a');
  for (const replacement of [
    { definitionId: morbidReturn.id },
    { ownerId: 'b', zoneId: 'graveyard-b' },
    { zoneId: 'hand-a' },
  ]) {
    const bad = {
      ...s,
      cards: s.cards.map((c) =>
        c.id === 'dead' ? { ...c, ...replacement } : c,
      ),
    };
    expect(act(bad, cast)).toEqual({ ok: false, reason: 'INVALID_TARGET' });
  }
  expect(act(s, { ...cast, targetId: 'ally' })).toEqual({
    ok: false,
    reason: 'INVALID_TARGET',
  });
});
it('Morbid Return revérifie le cimetière après les réactions', () => {
  let s = step(setup(), cast);
  s = {
    ...s,
    cards: s.cards.map((c) =>
      c.id === 'dead' ? { ...c, zoneId: 'deck-a' } : c,
    ),
  };
  s = resolveTop(s);
  expect(s.cards.find((c) => c.id === 'dead')?.zoneId).toBe('deck-a');
});
