import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { theSyren, mobilize } from '../../game-data/src/index.js';

it('The Syren : 1 énergie + Tap — ramène une unité alliée d’un champ à sa base', () => {
  let s = spellScenario(mobilize);
  s.gearDefinitions = [theSyren];
  s.gears = [
    {
      id: 'syren',
      definitionId: theSyren.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  s.resources.a = { energy: 0, power: {} };
  const use = {
    type: 'activate-gear' as const,
    playerId: 'a',
    gearId: 'syren',
    targetId: 'ally',
    payment: noRunes,
  };
  expect(act(s, use).ok).toBe(false);
  s.resources.a = { energy: 1, power: {} };
  expect(
    getLegalActions(s, 'a').flatMap((a) =>
      a.type === 'activate-gear' ? [a.targetId] : [],
    ),
  ).toEqual(['ally']);
  s = resolveTop(step(s, use));
  expect(s.units[0]?.zoneId).toBe('base-a');
  expect(s.resources.a?.energy).toBe(0);
});
