import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { orbOfRegret, mobilize } from '../../game-data/src/index.js';

it('Orb of Regret : Tap — -1 Might à une unité ce tour, minimum 1', () => {
  let s = spellScenario(mobilize);
  s.gearDefinitions = [orbOfRegret];
  s.gears = [
    {
      id: 'orb',
      definitionId: orbOfRegret.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  s.units[1] = { ...s.units[1]!, might: 1 };
  s.units[0] = { ...s.units[0]!, might: 3 };
  s = resolveTop(
    step(s, {
      type: 'activate-gear',
      playerId: 'a',
      gearId: 'orb',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(effectiveMight(s.units[1]!, s)).toBe(1);
  s = { ...s, gears: s.gears!.map((g) => ({ ...g, ready: true })) };
  s = resolveTop(
    step(s, {
      type: 'activate-gear',
      playerId: 'a',
      gearId: 'orb',
      targetId: 'ally',
      payment: noRunes,
    }),
  );
  expect(effectiveMight(s.units[0]!, s)).toBe(2);
});
