import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { sealOfRage, thermoBeam } from '../../game-data/src/index.js';

it('Thermo Beam : détruit tous les équipements, alliés comme adverses, posés ou attachés', () => {
  const s = spellScenario(thermoBeam);
  s.resources.a = { energy: 5, power: { rouge: 2 } };
  s.gearDefinitions = [sealOfRage];
  s.gears = [
    {
      id: 'g1',
      definitionId: sealOfRage.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
    {
      id: 'g2',
      definitionId: sealOfRage.id,
      ownerId: 'b',
      zoneId: 'g',
      ready: false,
      attachedUnitId: 'enemy',
    },
  ];
  const after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  expect(after.gears ?? []).toEqual([]);
  expect(after.cards.find((c) => c.id === 'g1')?.zoneId).toBe('graveyard-a');
  expect(after.cards.find((c) => c.id === 'g2')?.zoneId).toBe('graveyard-b');
  expect(after.units.some((u) => u.id === 'enemy')).toBe(true);
});
