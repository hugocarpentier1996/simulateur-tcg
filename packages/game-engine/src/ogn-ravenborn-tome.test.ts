import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { ravenbornTome, hextechRay } from '../../game-data/src/index.js';

it('Ravenborn Tome : le prochain sort joué ce tour inflige 1 dégât bonus par instance', () => {
  let s = spellScenario(hextechRay);
  s.gearDefinitions = [ravenbornTome];
  s.gears = [
    {
      id: 'tome',
      definitionId: ravenbornTome.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  s.units[1] = { ...s.units[1]!, might: 9 };
  s.cards.push({
    id: 'ray2',
    definitionId: hextechRay.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 2, power: { rouge: 2 } };
  s = resolveTop(
    step(s, {
      type: 'activate-gear',
      playerId: 'a',
      gearId: 'tome',
      payment: noRunes,
    }),
  );
  const cast = (cardId: string) => ({
    type: 'cast-spell' as const,
    playerId: 'a',
    cardId,
    targetId: 'enemy',
    payment: noRunes,
  });
  s = resolveTop(step(s, cast('spell')));
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(4);
  s = resolveTop(step(s, cast('ray2')));
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(7);
});
