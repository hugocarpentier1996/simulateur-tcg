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
const cast = (discardCardId?: string) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'enemy',
  ...(discardCardId ? { discardCardId } : {}),
  payment: noRunes,
});

it('Get Excited! : défausse la carte choisie et inflige son coût en énergie', () => {
  const s = resolveTop(step(scenario(), cast('big')));
  expect(s.cards.find((c) => c.id === 'big')?.zoneId).toBe('graveyard-a');
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(8);
});

it('Get Excited! : la carte à défausser doit être dans la main du lanceur', () => {
  expect(act(scenario(), cast()).ok).toBe(false);
  expect(act(scenario(), cast('draw-a-0')).ok).toBe(false);
  const discards = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'cast-spell' && a.cardId === 'spell' ? [a.discardCardId] : [],
  );
  expect(new Set(discards)).toEqual(new Set(['big']));
});
