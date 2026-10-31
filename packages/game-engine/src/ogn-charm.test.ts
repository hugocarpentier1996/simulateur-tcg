import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './act.js';
import { charm } from '../../game-data/src/index.js';

const cast = (targetId: string, destinationId: string) => ({
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId,
  destinationId,
  payment: noRunes,
});

it('Charm : déplace une unité ennemie, ici vers sa base, sans changer Ready/Tap', () => {
  let s = spellScenario(charm);
  s.resources.a = { energy: 1, power: { vert: 1 } };
  s = resolveTop(step(s, cast('enemy', 'base-b')));
  expect(s.units.find((u) => u.id === 'enemy')).toMatchObject({
    zoneId: 'base-b',
    ready: true,
  });
});

it('Charm refuse une unité alliée', () => {
  const s = spellScenario(charm);
  s.resources.a = { energy: 1, power: { vert: 1 } };
  expect(act(s, cast('ally', 'base-a')).ok).toBe(false);
});
