import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { act } from './act.js';
import { getLegalActions } from './legal/actions.js';
import { mobilize } from '../../game-data/src/index.js';
import { firstMate } from '../../game-data/src/index.js';
it('First Mate choisit une autre unité, même adverse, avant les réactions', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [firstMate];
  s.cards[0]!.definitionId = firstMate.id;
  s.units[1]!.ready = false;
  const play = {
    type: 'play-unit' as const,
    playerId: 'a',
    cardId: 'spell',
    destinationId: 'base-a',
    payment: noRunes,
    onPlayTargetId: 'enemy',
  };
  expect(act(s, { ...play, onPlayTargetId: 'spell' }).ok).toBe(false);
  expect(getLegalActions(s, 'a')).toContainEqual(play);
  s = step(s, play);
  expect(s.units[1]!.ready).toBe(false);
  s = resolveTop(s);
  expect(s.units[1]!.ready).toBe(true);
  expect(s.units.find((u) => u.id === 'spell')?.ready).toBe(false);
});
it('First Mate peut être joué sans autre unité, sa capacité ne fait alors rien', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [firstMate];
  s.units = [];
  s.cards[0]!.definitionId = firstMate.id;
  s = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'spell',
    payment: noRunes,
  });
  expect(s.stack?.entries).toHaveLength(1);
  s = resolveTop(s);
  expect(s.units[0]?.ready).toBe(false);
});
