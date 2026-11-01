import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import {
  missFortuneBody,
  sealOfRage,
  stupefy,
} from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [missFortuneBody];
  s.gearDefinitions = [sealOfRage];
  s.units = [
    {
      ...s.units[0]!,
      id: 'mf',
      definitionId: missFortuneBody.id,
      zoneId: 'base-a',
      ready: true,
    },
    { ...s.units[0]!, id: 'tired', zoneId: 'base-a', ready: false },
    s.units[1]!,
  ];
  s.gears = [
    {
      id: 'seal',
      definitionId: sealOfRage.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: false,
    },
  ];
  s.battlefields[0]!.controllerId = null;
  return s;
}

it('Miss Fortune : son premier déplacement du tour peut redresser autre chose de Tap', () => {
  let s = step(scenario(), {
    type: 'move',
    playerId: 'a',
    unitId: 'mf',
    destinationId: 'f',
  });
  expect(
    s.stack?.entries.some((e) => 'sourceId' in e && e.sourceId === 'mf'),
  ).toBe(true);
  while (s.stack && !s.pendingModeChoice) s = resolveTop(s);
  expect(s.pendingModeChoice?.modes).toEqual([
    'skip',
    'ready:tired',
    'ready:seal',
  ]);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'ready:seal' });
  expect(s.gears?.[0]?.ready).toBe(true);
  expect(missFortuneBody).toMatchObject({
    ganking: true,
    accelerate: { power: 'orange' },
  });
});
