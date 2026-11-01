import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import {
  volibearFury,
  stupefy,
  hextechRay,
} from '../../game-data/src/index.js';

it('Volibear : en attaquant, 5 dégâts répartis entre les ennemis ici', () => {
  const s0 = spellScenario(stupefy);
  s0.unitDefinitions = [volibearFury];
  s0.units = [
    {
      ...s0.units[0]!,
      id: 'voli',
      definitionId: volibearFury.id,
      zoneId: 'base-a',
      might: 9,
    },
    { ...s0.units[1]!, might: 9 },
    { ...s0.units[1]!, id: 'enemy2', might: 9 },
  ];
  let s = step(s0, {
    type: 'move',
    playerId: 'a',
    unitId: 'voli',
    destinationId: 'g',
  });
  while (s.stack && !s.pendingModeChoice) s = resolveTop(s);
  expect(s.pendingModeChoice?.modes).toContain('split:enemy=2,enemy2=3');
  expect(s.pendingModeChoice?.modes).toContain('split:enemy=5');
  expect(s.pendingModeChoice?.modes).toHaveLength(6);
  s = step(s, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'split:enemy=2,enemy2=3',
  });
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(2);
  expect(s.units.find((u) => u.id === 'enemy2')?.damage).toBe(3);
});

it('Volibear : Deflect 2 — le choisir coûte 2 Power aux adversaires', () => {
  const s = spellScenario(hextechRay);
  s.unitDefinitions = [volibearFury];
  s.units[1] = { ...s.units[1]!, definitionId: volibearFury.id, might: 9 };
  s.resources.a = { energy: 1, power: { rouge: 2 } };
  const cast = {
    type: 'cast-spell' as const,
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: noRunes,
  };
  expect(act(s, cast).ok).toBe(false);
  s.resources.a = { energy: 1, power: { rouge: 3 } };
  expect(act(s, cast).ok).toBe(true);
});
