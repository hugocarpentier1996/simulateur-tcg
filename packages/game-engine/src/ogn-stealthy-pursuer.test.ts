import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { stealthyPursuer, stupefy } from '../../game-data/src/index.js';

it('Stealthy Pursuer : quand une alliée quitte sa zone, il peut la suivre', () => {
  const s0 = spellScenario(stupefy);
  s0.unitDefinitions = [stealthyPursuer];
  s0.units = [
    { ...s0.units[0]!, id: 'runner', zoneId: 'base-a' },
    {
      ...s0.units[0]!,
      id: 'pursuer',
      definitionId: stealthyPursuer.id,
      zoneId: 'base-a',
    },
    s0.units[1]!,
  ];
  s0.battlefields[0]!.controllerId = null;
  let s = step(s0, {
    type: 'move',
    playerId: 'a',
    unitId: 'runner',
    destinationId: 'f',
  });
  expect(s.stack?.entries.at(-1)).toMatchObject({
    kind: 'mode-choice',
    sourceId: 'pursuer',
  });
  while (s.stack && !s.pendingModeChoice) s = resolveTop(s);
  expect(s.pendingModeChoice?.modes).toEqual(['skip', 'follow']);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'follow' });
  expect(s.units.find((u) => u.id === 'pursuer')?.zoneId).toBe('f');
});
