import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './act.js';
import { rebuke } from '../../game-data/src/index.js';

const cast = {
  type: 'cast-spell' as const,
  playerId: 'a',
  cardId: 'spell',
  targetId: 'enemy',
  payment: noRunes,
};

it('Rebuke : renvoie dans la main de son propriétaire une unité sur un champ, même puissante', () => {
  let s = spellScenario(rebuke);
  s.resources.a = { energy: 2, power: { violet: 2 } };
  s.units[1]!.might = 9;
  s = resolveTop(step(s, cast));
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(s.cards.find((c) => c.id === 'enemy')?.zoneId).toBe('hand-b');
});

it('Rebuke refuse une unité en base', () => {
  const s = spellScenario(rebuke);
  s.resources.a = { energy: 2, power: { violet: 2 } };
  s.units[1]!.zoneId = 'base-b';
  expect(act(s, cast).ok).toBe(false);
});
