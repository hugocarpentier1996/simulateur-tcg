import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { dariusFury, hextechRay } from '../../game-data/src/index.js';

it('Darius (Fury) : à la deuxième carte jouée du tour, +2 Might et se redresse', () => {
  let s = spellScenario(hextechRay);
  s.unitDefinitions = [dariusFury];
  s.units[0] = {
    ...s.units[0]!,
    definitionId: dariusFury.id,
    might: 5,
    ready: false,
  };
  s.cards.push({
    id: 'ray-2',
    definitionId: hextechRay.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 2, power: { rouge: 2 } };
  s.units[1] = { ...s.units[1]!, might: 20 };
  const cast = (cardId: string) => ({
    type: 'cast-spell' as const,
    playerId: 'a',
    cardId,
    targetId: 'enemy',
    payment: noRunes,
  });
  s = resolveTop(step(s, cast('spell')));
  expect(s.units[0]?.ready).toBe(false);
  s = step(s, cast('ray-2'));
  expect(s.units[0]?.ready).toBe(true);
  expect(effectiveMight(s.units[0]!, s)).toBe(7);
});
