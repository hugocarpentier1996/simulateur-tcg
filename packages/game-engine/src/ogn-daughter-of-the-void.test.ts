import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import {
  daughterOfTheVoid,
  hextechRay,
  pakaaCub,
} from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(hextechRay);
  s.legendDefinitions = [daughterOfTheVoid];
  s.unitDefinitions = [pakaaCub];
  s.zones.push({ id: 'legend-a', kind: 'legend', ownerId: 'a' });
  s.cards.push({
    id: 'void',
    definitionId: daughterOfTheVoid.id,
    ownerId: 'a',
    zoneId: 'legend-a',
    ready: true,
  });
  s.units[1] = { ...s.units[1]!, might: 9 };
  s.resources.a = { energy: 1, power: {} };
  return step(s, { type: 'activate-gear', playerId: 'a', gearId: 'void' });
}

it('Daughter of the Void : Tap, ajoute 1 Power de n’importe quel domaine réservé aux sorts', () => {
  const s = scenario();
  expect(s.resources.a?.spellPower).toBe(1);
  const cast = {
    type: 'cast-spell' as const,
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: noRunes,
  };
  expect(getLegalActions(s, 'a')).toContainEqual(cast);
  const after = resolveTop(step(s, cast));
  expect(after.units.find((u) => u.id === 'enemy')?.damage).toBe(3);
  expect(after.resources.a?.spellPower ?? 0).toBe(0);
});

it('Daughter of the Void : ce Power ne paie pas une unité', () => {
  const s = scenario();
  s.cards.push({
    id: 'cub',
    definitionId: pakaaCub.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.unitDefinitions = [
    { ...pakaaCub, cost: { energy: 0, power: { orange: 1 } } },
  ];
  expect(
    act(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'cub',
      payment: noRunes,
    }).ok,
  ).toBe(false);
});
