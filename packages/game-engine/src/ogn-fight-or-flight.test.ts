import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import { fightOrFlight } from '../../game-data/src/index.js';

const cast = (targetId: string, destinationId: string) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId,
  destinationId,
  payment: noRunes,
});
function scenario() {
  const s = spellScenario(fightOrFlight);
  s.resources.a = { energy: 2, power: {} };
  return s;
}

it('Fight or Flight : renvoie une unité d’un champ dans la base de son propriétaire', () => {
  const s = resolveTop(step(scenario(), cast('enemy', 'base-b')));
  expect(s.units.find((u) => u.id === 'enemy')?.zoneId).toBe('base-b');
});

it('Fight or Flight : seule la base du propriétaire est une destination', () => {
  expect(act(scenario(), cast('enemy', 'f')).ok).toBe(false);
  const home = scenario();
  home.units[1] = { ...home.units[1]!, zoneId: 'base-b' };
  expect(act(home, cast('enemy', 'base-b')).ok).toBe(false);
});
