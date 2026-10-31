import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { bulletTime } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(bulletTime);
  s.resources.a = { energy: 1, power: { rouge: 1, vert: 1 } };
  s.units.push({ ...s.units[1]!, id: 'enemy-2', might: 9 });
  return s;
}
const cast = (xPower: number) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'g',
  xPower,
  payment: noRunes,
});

it('Bullet Time : X Power quelconque payé -> X dégâts aux ennemis du champ', () => {
  const s = resolveTop(step(scenario(), cast(2)));
  expect(s.units.find((u) => u.id === 'enemy-2')?.damage).toBe(2);
  expect(s.units.find((u) => u.id === 'ally')?.damage).toBe(0);
  expect(s.resources.a?.power).toEqual({ rouge: 0, vert: 0 });
});

it('Bullet Time : X limité au Power disponible, variantes proposées', () => {
  expect(act(scenario(), cast(3)).ok).toBe(false);
  const xs = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'cast-spell' && a.targetId === 'g' ? [a.xPower ?? 0] : [],
  );
  expect(new Set(xs)).toEqual(new Set([0, 1, 2]));
});
