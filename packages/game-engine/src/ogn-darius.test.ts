import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { darius, hextechRay } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(hextechRay);
  s.unitDefinitions = [darius];
  s.cards.push({
    id: 'darius',
    definitionId: darius.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 7, power: { jaune: 1, rouge: 1 } };
  return s;
}
const play = {
  type: 'play-unit' as const,
  playerId: 'a',
  cardId: 'darius',
  destinationId: 'f',
  payment: noRunes,
};

it('Darius : Legion — entre Ready si une autre carte a été jouée ce tour', () => {
  const alone = step(scenario(), play);
  expect(alone.units.find((u) => u.id === 'darius')?.ready).toBe(false);
  let s = step(scenario(), {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: noRunes,
  });
  s = resolveTop(s);
  expect(s.cardsPlayedThisTurn).toEqual({ a: 1 });
  s = step(s, play);
  expect(s.units.find((u) => u.id === 'darius')?.ready).toBe(true);
});

it('Darius : +1 Might aux autres unités alliées de sa zone', () => {
  const s = step(scenario(), play);
  const ally = s.units.find((u) => u.id === 'ally')!;
  expect(effectiveMight(ally, s)).toBe(ally.might + 1);
  expect(
    effectiveMight(
      s.units.find((u) => u.id === 'darius')!,
      s,
    ),
  ).toBe(6);
});
