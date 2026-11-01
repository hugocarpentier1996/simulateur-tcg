import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { arenaBar, mobilize } from '../../game-data/src/index.js';

it('Arena Bar : Tap — buffe une unité alliée Tap', () => {
  let s = spellScenario(mobilize);
  s.gearDefinitions = [arenaBar];
  s.gears = [
    {
      id: 'bar',
      definitionId: arenaBar.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  s.units[0] = { ...s.units[0]!, ready: false };
  s.units.push(
    { ...s.units[0]!, id: 'fresh', ready: true },
    { ...s.units[1]!, id: 'foe', ready: false },
  );
  const targets = getLegalActions(s, 'a').flatMap((a) =>
    a.type === 'activate-gear' ? [a.targetId] : [],
  );
  expect(targets).toEqual(['ally']);
  s = resolveTop(
    step(s, {
      type: 'activate-gear',
      playerId: 'a',
      gearId: 'bar',
      targetId: 'ally',
      payment: noRunes,
    }),
  );
  expect(s.units[0]?.buffed).toBe(true);
});
