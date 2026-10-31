import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './index.js';
import { ragingFirebrand, skySplitter } from '../../game-data/src/index.js';

it('Raging Firebrand : le prochain sort du tour coûte 5 énergie de moins, une seule fois', () => {
  let s = spellScenario(skySplitter);
  s.unitDefinitions = [ragingFirebrand];
  s.cards.push(
    {
      id: 'brand',
      definitionId: ragingFirebrand.id,
      ownerId: 'a',
      zoneId: 'hand-a',
    },
    {
      id: 'spell-2',
      definitionId: skySplitter.id,
      ownerId: 'a',
      zoneId: 'hand-a',
    },
  );
  s.units = s.units.map((u) => ({ ...u, might: 1 }));
  s.resources.a = { energy: 6 + 2, power: { rouge: 3 } };
  s = resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'brand',
      payment: noRunes,
    }),
  );
  expect(s.nextSpellDiscount).toEqual({ a: 5 });
  // Sky Splitter : 8 - 4 (Might max alliée, Firebrand) - 5 -> 0 énergie.
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'enemy',
    payment: noRunes,
  });
  expect(s.resources.a?.energy).toBe(2);
  expect(s.nextSpellDiscount?.a ?? 0).toBe(0);
  s = resolveTop(s);
  expect(
    act(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell-2',
      targetId: 'ally',
      payment: noRunes,
    }).ok,
  ).toBe(false);
});
