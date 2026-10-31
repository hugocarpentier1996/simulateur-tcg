import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act, getLegalActions } from './index.js';
import { dragonsRage } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(dragonsRage);
  s.resources.a = { energy: 4, power: { orange: 1 } };
  s.units[1] = { ...s.units[1]!, might: 3 };
  s.units.push({ ...s.units[1]!, id: 'other', zoneId: 'f', might: 5 });
  return s;
}
const cast = (destinationId: string, secondaryTargetId: string) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'enemy',
  destinationId,
  secondaryTargetId,
  payment: noRunes,
});

it('Dragon’s Rage : déplace un ennemi, puis il s’affronte avec un autre ennemi de sa destination', () => {
  const s = resolveTop(step(scenario(), cast('f', 'other')));
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(s.units.find((u) => u.id === 'other')).toMatchObject({
    zoneId: 'f',
    damage: 3,
  });
});

it('Dragon’s Rage : le second ennemi doit déjà être à la destination', () => {
  expect(act(scenario(), cast('f', 'ally')).ok).toBe(false);
  expect(act(scenario(), cast('base-b', 'other')).ok).toBe(false);
  const options = getLegalActions(scenario(), 'a').flatMap((a) =>
    a.type === 'cast-spell'
      ? [`${a.targetId}>${a.destinationId}:${a.secondaryTargetId}`]
      : [],
  );
  expect(new Set(options)).toEqual(new Set(['enemy>f:other', 'other>g:enemy']));
});
