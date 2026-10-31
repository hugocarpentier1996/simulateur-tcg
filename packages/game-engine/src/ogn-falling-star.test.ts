import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { fallingStar } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(fallingStar);
  s.resources.a = { energy: 2, power: { rouge: 2 } };
  s.units = s.units.map((u) => ({ ...u, might: 8 }));
  return s;
}
const cast = (selectedUnitIds: string[]) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'a',
  selectedUnitIds,
  payment: noRunes,
});

it('Falling Star : deux fois 3 dégâts, sur deux unités ou deux fois la même', () => {
  const split = resolveTop(step(scenario(), cast(['ally', 'enemy'])));
  expect(split.units.map((u) => u.damage)).toEqual([3, 3]);
  const same = resolveTop(step(scenario(), cast(['enemy', 'enemy'])));
  expect(same.units.find((u) => u.id === 'enemy')?.damage).toBe(6);
});

it('Falling Star : exactement deux cibles, parmi les unités en jeu', () => {
  expect(act(scenario(), cast(['enemy'])).ok).toBe(false);
  expect(act(scenario(), cast(['enemy', 'ghost'])).ok).toBe(false);
  const options = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'cast-spell' ? [a.selectedUnitIds?.join('+')] : [],
  );
  expect(new Set(options)).toEqual(
    new Set(['ally+ally', 'ally+enemy', 'enemy+enemy']),
  );
});
