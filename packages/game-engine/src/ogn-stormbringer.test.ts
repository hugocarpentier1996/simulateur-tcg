import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { stormbringer } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(stormbringer);
  s.resources.a = { energy: 6, power: { rouge: 1, orange: 1 } };
  s.units[0] = { ...s.units[0]!, zoneId: 'base-a', might: 4 };
  s.units.push({ ...s.units[1]!, id: 'enemy-2', might: 9 });
  return s;
}
const cast = (targetId: string, destinationId: string) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId,
  destinationId,
  payment: noRunes,
});

it('Stormbringer : la Might de l’allié en base frappe les ennemis du champ, puis il s’y déplace', () => {
  const s = resolveTop(step(scenario(), cast('ally', 'g')));
  expect(s.units.find((u) => u.id === 'enemy-2')?.damage).toBe(4);
  expect(s.units.find((u) => u.id === 'ally')?.zoneId).toBe('g');
});

it('Stormbringer : allié en base uniquement, destination = champ', () => {
  expect(act(scenario(), cast('ally', 'base-a')).ok).toBe(false);
  const moved = scenario();
  moved.units[0] = { ...moved.units[0]!, zoneId: 'f' };
  expect(act(moved, cast('ally', 'g')).ok).toBe(false);
  const options = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'cast-spell' ? [`${a.targetId}:${a.destinationId}`] : [],
  );
  expect(new Set(options)).toEqual(new Set(['ally:f', 'ally:g']));
});
