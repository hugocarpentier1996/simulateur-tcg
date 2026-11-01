import { expect, it } from 'vitest';
import { spellScenario, step, resolveTop } from './origins-test-fixtures.js';
import { act } from './index.js';
import { udyr, stupefy } from '../../game-data/src/index.js';
import { hasKeyword } from './effects/modifiers.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [udyr];
  s.units[0] = {
    ...s.units[0]!,
    id: 'udyr',
    definitionId: udyr.id,
    buffed: true,
    ready: false,
  };
  return s;
}
const spend = {
  type: 'spend-buff-ability' as const,
  playerId: 'a',
  unitId: 'udyr',
};

it('Udyr : dépenser son buff — choisir un mode pas encore choisi ce tour', () => {
  let s = resolveTop(step(scenario(), spend));
  expect(s.pendingModeChoice?.modes).toEqual([
    'udyr-damage:udyr',
    'udyr-damage:enemy',
    'stun:udyr',
    'stun:enemy',
    'udyr-ready',
    'udyr-ganking',
  ]);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'udyr-ready' });
  expect(s.units.find((u) => u.id === 'udyr')?.ready).toBe(true);
  s.units = s.units.map((u) => (u.id === 'udyr' ? { ...u, buffed: true } : u));
  s = resolveTop(step(s, spend));
  expect(s.pendingModeChoice?.modes).not.toContain('udyr-ready');
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'udyr-ganking' });
  expect(
    hasKeyword(
      s.units.find((u) => u.id === 'udyr')!,
      s,
      'ganking',
    ),
  ).toBe(true);
  expect(act(s, spend).ok).toBe(false);
});

it('Udyr : 2 dégâts à une unité sur un champ', () => {
  let s = resolveTop(step(scenario(), spend));
  s = step(s, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'udyr-damage:enemy',
  });
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(2);
});
