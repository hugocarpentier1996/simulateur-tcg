import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './act.js';
import { rideTheWind } from '../../game-data/src/index.js';

const cast = (targetId: string, destinationId: string) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId,
  destinationId,
  payment: noRunes,
});

it('Ride the Wind : déplace une unité alliée Tap vers sa base et la redresse', () => {
  let s = spellScenario(rideTheWind);
  s.resources.a = { energy: 2, power: { violet: 1 } };
  s.units[0]!.ready = false;
  s = resolveTop(step(s, cast('ally', 'base-a')));
  expect(s.units.find((u) => u.id === 'ally')).toMatchObject({
    zoneId: 'base-a',
    ready: true,
  });
});

it('Ride the Wind refuse une unité ennemie', () => {
  const s = spellScenario(rideTheWind);
  s.resources.a = { energy: 2, power: { violet: 1 } };
  expect(act(s, cast('enemy', 'f')).ok).toBe(false);
});
