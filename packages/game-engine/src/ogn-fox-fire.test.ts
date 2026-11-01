import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { foxFire } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(foxFire);
  s.resources.a = { energy: 3, power: {} };
  s.units = [
    { ...s.units[1]!, id: 'e1', zoneId: 'g', might: 2 },
    { ...s.units[1]!, id: 'e2', zoneId: 'g', might: 2 },
    { ...s.units[1]!, id: 'e3', zoneId: 'g', might: 3 },
    { ...s.units[1]!, id: 'e4', zoneId: 'f', might: 1 },
  ];
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

it('Fox-Fire : tue des unités d’un même champ totalisant 4 Might ou moins', () => {
  const s = resolveTop(step(scenario(), cast(['e1', 'e2'])));
  expect(s.units.map((u) => u.id)).toEqual(['e3', 'e4']);
});

it('Fox-Fire : refuse plus de 4 Might ou deux champs différents', () => {
  expect(act(scenario(), cast(['e1', 'e3'])).ok).toBe(false);
  expect(act(scenario(), cast(['e1', 'e4'])).ok).toBe(false);
  expect(act(scenario(), cast([])).ok).toBe(false);
  const options = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'cast-spell' ? [a.selectedUnitIds?.join('+')] : [],
  );
  expect(new Set(options)).toEqual(new Set(['e1', 'e2', 'e3', 'e1+e2', 'e4']));
});
