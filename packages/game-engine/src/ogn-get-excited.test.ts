import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { getExcited, skySplitter } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(getExcited);
  s.resources.a = { energy: 2, power: { rouge: 1 } };
  s.spellDefinitions = [getExcited, skySplitter];
  s.units = s.units.map((u) => ({ ...u, might: 10 }));
  s.cards.push({
    id: 'big',
    definitionId: skySplitter.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  return s;
}
const cast = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'enemy',
  payment: noRunes,
};

it('Get Excited! : à la résolution, le lanceur choisit la carte défaussée ; la cible subit son coût en énergie', () => {
  let s = resolveTop(step(scenario(), cast));
  expect(s.pendingModeChoice?.modes).toEqual(['discard-dmg:big']);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'discard-dmg:big' });
  expect(s.cards.find((c) => c.id === 'big')?.zoneId).toBe('graveyard-a');
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(8);
});

it('Get Excited! : la carte est choisie parmi la main au moment de la résolution', () => {
  const s0 = scenario();
  s0.cards = s0.cards.filter((c) => c.id !== 'big');
  let s = step(s0, cast);
  s = {
    ...s,
    cards: [
      ...s.cards,
      {
        id: 'big',
        definitionId: skySplitter.id,
        ownerId: 'a',
        zoneId: 'hand-a',
      },
    ],
  };
  s = resolveTop(s);
  expect(s.pendingModeChoice?.modes).toEqual(['discard-dmg:big']);
});

it('Get Excited! : main vide à la résolution, aucun dégât', () => {
  const s0 = scenario();
  s0.cards = s0.cards.filter((c) => c.id !== 'big');
  expect(act(s0, cast).ok).toBe(true);
  const s = resolveTop(step(s0, cast));
  expect(s.pendingModeChoice ?? null).toBeNull();
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(0);
  expect(
    getLegalActions(scenario(), 'a').some((a) => a.type === 'cast-spell'),
  ).toBe(true);
});
