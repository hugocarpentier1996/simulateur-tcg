import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import {
  scrapheap,
  thermoBeam,
  chemtechEnforcer,
} from '../../game-data/src/index.js';

const hand = (s: { cards: { zoneId: string }[] }) =>
  s.cards.filter((c) => c.zoneId === 'hand-a').length;

it('Scrapheap : posé, son propriétaire pioche 1', () => {
  let s = spellScenario(thermoBeam);
  s.gearDefinitions = [scrapheap];
  s.cards.push({
    id: 'heap',
    definitionId: scrapheap.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 2, power: {} };
  const before = hand(s);
  s = step(s, {
    type: 'play-gear',
    playerId: 'a',
    cardId: 'heap',
    payment: noRunes,
  });
  expect(hand(s)).toBe(before);
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
});

it('Scrapheap : détruit, son propriétaire pioche 1', () => {
  let s = spellScenario(thermoBeam);
  s.gearDefinitions = [scrapheap];
  s.gears = [
    {
      id: 'heap',
      definitionId: scrapheap.id,
      ownerId: 'a',
      zoneId: 'base-a',
      ready: true,
    },
  ];
  s.resources.a = { energy: 5, power: { rouge: 2 } };
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
});

it('Scrapheap : défaussé, son propriétaire pioche 1', () => {
  let s = spellScenario(thermoBeam);
  s.unitDefinitions = [chemtechEnforcer];
  s.gearDefinitions = [scrapheap];
  s.cards[0]!.definitionId = chemtechEnforcer.id;
  s.cards.push({
    id: 'heap',
    definitionId: scrapheap.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 2, power: {} };
  s = resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'spell',
      payment: noRunes,
    }),
  );
  s = step(s, { type: 'choose-discard', playerId: 'a', cardId: 'heap' });
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
});
