import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { stealthyPursuer, stupefy } from '../../game-data/src/index.js';

function scenario(askOptional: boolean) {
  const s0 = spellScenario(stupefy);
  if (askOptional) s0.preferences = { a: { askOptional: true } };
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
  return s0;
}

it('Stealthy Pursuer : avec « toujours demander », il peut choisir de suivre son alliée', () => {
  let s = step(scenario(true), {
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

it('Stealthy Pursuer : par défaut, ce « you may » gratuit est accepté automatiquement', () => {
  let s = step(scenario(false), {
    type: 'move',
    playerId: 'a',
    unitId: 'runner',
    destinationId: 'f',
  });
  while (s.stack) s = resolveTop(s);
  expect(s.pendingModeChoice ?? null).toBeNull();
  expect(s.units.find((u) => u.id === 'pursuer')?.zoneId).toBe('f');
});
