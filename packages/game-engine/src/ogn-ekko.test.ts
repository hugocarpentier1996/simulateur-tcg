import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { ekko, hextechRay } from '../../game-data/src/index.js';

it('Ekko : Deathknell — se recycle sous le deck pour redresser les runes du propriétaire', () => {
  let s = spellScenario(hextechRay);
  s.unitDefinitions = [ekko];
  s.resources.a = { energy: 1, power: { rouge: 1 } };
  s.units[1] = { ...s.units[1]!, definitionId: ekko.id, might: 1 };
  s.cards.push(
    {
      id: 'rb0',
      definitionId: 'rune',
      ownerId: 'b',
      zoneId: 'runes-b',
      color: 'bleu',
      ready: false,
    },
    {
      id: 'rb1',
      definitionId: 'rune',
      ownerId: 'b',
      zoneId: 'runes-b',
      color: 'bleu',
      ready: false,
    },
    {
      id: 'ra0',
      definitionId: 'rune',
      ownerId: 'a',
      zoneId: 'runes-a',
      color: 'rouge',
      ready: false,
    },
  );
  s = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(s.cards.find((c) => c.id === 'enemy')?.zoneId).toBe('graveyard-b');
  s = step(
    s,
    getLegalActions(s, 'b').find((a) => a.type === 'queue-death-effects')!,
  );
  s = resolveTop(s);
  const ready = (id: string) => s.cards.find((c) => c.id === id)?.ready;
  expect([ready('rb0'), ready('rb1'), ready('ra0')]).toEqual([
    true,
    true,
    false,
  ]);
  const deck = s.cards.filter((c) => c.zoneId === 'deck-b');
  expect(deck.at(-1)?.id).toBe('enemy');
});
