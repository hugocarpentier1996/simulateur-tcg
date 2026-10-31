import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { showstopper } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(showstopper);
  s.resources.a = { energy: 1, power: { jaune: 1 } };
  s.units[0] = { ...s.units[0]!, zoneId: 'base-a' };
  return s;
}
const cast = (destinationId: string) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'ally',
  destinationId,
  payment: noRunes,
});

it('Showstopper : buffe un allié de la base puis le déplace sur un champ', () => {
  const s = resolveTop(step(scenario(), cast('g')));
  expect(s.units.find((u) => u.id === 'ally')).toMatchObject({
    buffed: true,
    zoneId: 'g',
  });
});

it('Showstopper : allié en base uniquement, vers un champ', () => {
  expect(act(scenario(), cast('base-a')).ok).toBe(false);
  const options = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'cast-spell' ? [a.destinationId] : [],
  );
  expect(new Set(options)).toEqual(new Set(['f', 'g']));
});
