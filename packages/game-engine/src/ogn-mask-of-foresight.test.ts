import { expect, it } from 'vitest';
import { spellScenario } from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { maskOfForesight, mobilize } from '../../game-data/src/index.js';

function scenario(alone: boolean) {
  const s = spellScenario(mobilize);
  s.gearDefinitions = [maskOfForesight];
  s.gears = [
    {
      id: 'mask',
      definitionId: maskOfForesight.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  s.units[0] = { ...s.units[0]!, zoneId: 'g', might: 3 };
  if (!alone) s.units.push({ ...s.units[0]!, id: 'pal' });
  s.showdown = {
    kind: 'combat',
    battlefieldId: 'g',
    initiatorId: 'a',
    defenderId: 'b',
    participants: ['a', 'b'],
    priorityPlayerId: 'a',
    consecutivePasses: 0,
    stage: 'priority',
    assignments: {},
  };
  return s;
}

it('Mask of Foresight : +1 Might à une unité alliée qui attaque ou défend seule', () => {
  const s = scenario(true);
  expect(effectiveMight(s.units[0]!, s)).toBe(4);
  const pair = scenario(false);
  expect(effectiveMight(pair.units[0]!, pair)).toBe(3);
});
