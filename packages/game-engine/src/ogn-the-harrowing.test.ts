import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import { theHarrowing, kinkouMonk } from '../../game-data/src/index.js';

function scenario(extraPower: number) {
  const s = spellScenario(theHarrowing);
  s.unitDefinitions = [kinkouMonk];
  s.cards.push({
    id: 'monk',
    definitionId: kinkouMonk.id,
    ownerId: 'a',
    zoneId: 'graveyard-a',
  });
  s.resources.a = { energy: 6, power: { violet: 2, orange: extraPower } };
  return s;
}
const cast = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'monk',
  payment: noRunes,
};

it('The Harrowing : joue une unité de son cimetière en ne payant que son Power', () => {
  expect(act(scenario(0), cast).ok).toBe(false);
  const s = resolveTop(step(scenario(1), cast));
  expect(s.units.find((u) => u.id === 'monk')).toMatchObject({
    zoneId: 'base-a',
    ready: false,
    might: 4,
  });
  expect(s.cards.some((c) => c.id === 'monk')).toBe(false);
});
