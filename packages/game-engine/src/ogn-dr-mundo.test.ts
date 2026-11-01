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

it('Dr. Mundo : au début de sa Beginning, le joueur choisit 3 cartes de son cimetière à recycler', () => {
  let s = scenario();
  s = step(s, { type: 'end-turn', playerId: 'a' });
  s = step(s, { type: 'end-turn', playerId: 'b' });
  while (!s.pendingModeChoice && s.stack)
    s = step(s, { type: 'pass', playerId: s.stack.priorityPlayerId });
  expect(s.pendingModeChoice?.modes).toEqual([
    'recycle-any:t0',
    'recycle-any:t1',
    'recycle-any:t2',
    'recycle-any:t3',
  ]);
  for (const id of ['t3', 't1', 't0'])
    s = step(s, {
      type: 'choose-mode',
      playerId: 'a',
      mode: `recycle-any:${id}`,
    });
  expect(s.pendingModeChoice ?? null).toBeNull();
  expect(
    s.cards.filter((c) => c.zoneId === 'graveyard-a').map((c) => c.id),
  ).toEqual(['t2']);
  const deck = s.cards.filter((c) => c.zoneId === 'deck-a').map((c) => c.id);
  expect(deck.slice(-3)).toEqual(['t3', 't1', 't0']);
});
