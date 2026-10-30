import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './act.js';
import { hextechRay } from '../../game-data/src/index.js';

it('Hextech Ray : 1 énergie et 1 Fury, 3 dégâts à une unité sur un champ après réactions', () => {
  let s = spellScenario(hextechRay);
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  s.units[1]!.might = 4;
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: noRunes,
  });
  expect(s.resources.a).toMatchObject({ energy: 0, power: { rouge: 0 } });
  expect(s.units[1]!.damage).toBe(0);
  s = resolveTop(s);
  expect(s.units.find((u) => u.id === 'enemy')!.damage).toBe(3);
});

it('Hextech Ray refuse une unité en base', () => {
  const s = spellScenario(hextechRay);
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  s.units[1]!.zoneId = 'base-b';
  expect(
    act(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }).ok,
  ).toBe(false);
});
