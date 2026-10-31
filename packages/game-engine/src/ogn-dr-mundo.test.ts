import { expect, it } from 'vitest';
import { spellScenario, step } from './origins-test-fixtures.js';
import { effectiveMight } from './effects/modifiers.js';
import { drMundo, mobilize } from '../../game-data/src/index.js';

function scenario() {
  const s = spellScenario(mobilize);
  s.unitDefinitions = [drMundo];
  s.units[0] = {
    ...s.units[0]!,
    definitionId: drMundo.id,
    might: 6,
    zoneId: 'base-a',
  };
  for (let i = 0; i < 4; i++)
    s.cards.push({
      id: `t${i}`,
      definitionId: 'x',
      ownerId: 'a',
      zoneId: 'graveyard-a',
    });
  s.cards.push({
    id: 'tb',
    definitionId: 'x',
    ownerId: 'b',
    zoneId: 'graveyard-b',
  });
  return s;
}

it('Dr. Mundo : +1 Might par carte de son cimetière', () => {
  const s = scenario();
  expect(effectiveMight(s.units[0]!, s)).toBe(10);
});

it('Dr. Mundo : au début de sa Beginning, recycle 3 cartes de son cimetière', () => {
  let s = scenario();
  s = step(s, { type: 'end-turn', playerId: 'a' });
  s = step(s, { type: 'end-turn', playerId: 'b' });
  expect(s.cards.filter((c) => c.zoneId === 'graveyard-a')).toHaveLength(1);
  const deck = s.cards.filter((c) => c.zoneId === 'deck-a').map((c) => c.id);
  expect(deck.slice(-3)).toEqual(['t0', 't1', 't2']);
});
