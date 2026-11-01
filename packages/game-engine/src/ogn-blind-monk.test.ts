import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { blindMonk, mobilize } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(mobilize);
  s.legendDefinitions = [blindMonk];
  s.zones.push({ id: 'legend-a', kind: 'legend', ownerId: 'a' });
  s.cards.push({
    id: 'monk',
    definitionId: blindMonk.id,
    ownerId: 'a',
    zoneId: 'legend-a',
    ready: true,
  });
  s.resources.a = { energy: 1, power: {} };
  return s;
}
const use = {
  type: 'activate-gear' as const,
  playerId: 'a',
  gearId: 'monk',
  targetId: 'ally',
  payment: noRunes,
};

it('Blind Monk : 1 énergie + Tap de la légende — buffe une unité alliée', () => {
  expect(
    getLegalActions(scenario(), 'a').flatMap((a) =>
      a.type === 'activate-gear' ? [a.targetId] : [],
    ),
  ).toEqual(['ally']);
  let s = resolveTop(step(scenario(), use));
  expect(s.units[0]?.buffed).toBe(true);
  expect(s.cards.find((c) => c.id === 'monk')?.ready).toBe(false);
  s = { ...s, resources: { ...s.resources, a: { energy: 1, power: {} } } };
  expect(act(s, use).ok).toBe(false);
});
