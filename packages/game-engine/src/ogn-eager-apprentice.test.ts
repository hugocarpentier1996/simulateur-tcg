import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  noRunes,
  resolveTop,
} from './origins-test-fixtures.js';
import {
  confront,
  luxMind,
  ladyOfLuminosity,
} from '../../game-data/src/index.js';
import { getLegalActions } from './legal/actions.js';
import { eagerApprentice } from '../../game-data/src/index.js';
it('Eager réduit le paiement, mais Lux et Lady voient le coût imprimé', () => {
  const spell = { ...confront, cost: { energy: 5, power: {} } };
  let s = spellScenario(spell);
  s.unitDefinitions = [eagerApprentice, luxMind];
  s.legendDefinitions = [ladyOfLuminosity];
  s.zones.push({ id: 'legend-a', kind: 'legend', ownerId: 'a' });
  s.cards.push({
    id: 'legend',
    definitionId: ladyOfLuminosity.id,
    ownerId: 'a',
    zoneId: 'legend-a',
  });
  s.units[0]!.definitionId = eagerApprentice.id;
  s.units[0]!.ready = false;
  s.units.push({
    ...s.units[0]!,
    id: 'lux',
    definitionId: luxMind.id,
    zoneId: 'base-a',
    might: 5,
  });
  s.resources.a!.energy = 4;
  const cast = {
    type: 'cast-spell' as const,
    playerId: 'a',
    cardId: 'spell',
    targetId: 'a',
    payment: noRunes,
  };
  expect(getLegalActions(s, 'a')).toContainEqual(cast);
  s = step(s, cast);
  expect(s.resources.a!.energy).toBe(0);
  expect(s.stack?.entries).toHaveLength(1);
  s = resolveTop(s);
  expect(s.stack?.entries).toHaveLength(2);
});
it.each([
  [0, 'f', 0],
  [1, 'f', 1],
  [2, 'f', 1],
  [2, 'base-a', 2],
] as const)('coût %i, zone %s : paiement %i', (cost, zone, paid) => {
  let s = spellScenario({ ...confront, cost: { energy: cost, power: {} } });
  s.unitDefinitions = [eagerApprentice];
  s.units[0]!.definitionId = eagerApprentice.id;
  s.units[0]!.zoneId = zone;
  s.units.push({ ...s.units[0]!, id: 'second' });
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'a',
    payment: noRunes,
  });
  expect(s.resources.a!.energy).toBe(10 - paid);
});
