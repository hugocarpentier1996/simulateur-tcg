import { expect, it } from 'vitest';
import { spellScenario, step, noRunes } from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { malzahar, kinkouMonk, stupefy } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [malzahar, kinkouMonk];
  s.units = [
    { ...s.units[0]!, id: 'malz', definitionId: malzahar.id, zoneId: 'base-a' },
    { ...s.units[0]!, id: 'fodder', zoneId: 'base-a' },
    s.units[1]!,
  ];
  s.resources.a = { energy: 0, power: {} };
  return s;
}
const use = (targetId: string) => ({
  type: 'activate-gear' as const,
  playerId: 'a',
  gearId: 'malz',
  targetId,
});

it('Malzahar : tuer une unité ou un gear allié et se coucher ajoute 2 Power quelconques', () => {
  expect(getLegalActions(scenario(), 'a')).toContainEqual(use('fodder'));
  const s = step(scenario(), use('fodder'));
  expect(s.units.map((u) => u.id)).toEqual(['malz', 'enemy']);
  expect(s.units[0]?.ready).toBe(false);
  expect(s.resources.a?.anyPower).toBe(2);
  s.cards.push({
    id: 'monk',
    definitionId: kinkouMonk.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { ...s.resources.a!, energy: 4 };
  expect(
    act(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'monk',
      payment: noRunes,
    }).ok,
  ).toBe(true);
  expect(act(scenario(), use('enemy')).ok).toBe(false);
});
