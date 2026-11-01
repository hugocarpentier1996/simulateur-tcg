import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { flameChompers, getExcited } from '../../game-data/src/index.js';

function cast(rouge: number) {
  const s = spellScenario(getExcited);
  s.unitDefinitions = [flameChompers];
  s.units[1] = { ...s.units[1]!, might: 9 };
  s.cards.push({
    id: 'chomp',
    definitionId: flameChompers.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 2, power: { rouge: 1 + rouge } };
  return resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      discardCardId: 'chomp',
      payment: noRunes,
    }),
  );
}

it('Flame Chompers : défaussée, peut être jouée pour 1 Power Fury', () => {
  let s = cast(1);
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(3);
  expect(s.stack?.entries.at(-1)).toMatchObject({
    kind: 'mode-choice',
    sourceId: 'chomp',
  });
  s = resolveTop(s);
  expect(s.pendingModeChoice?.modes).toEqual(['skip', 'pay-play']);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'pay-play' });
  expect(s.units.find((u) => u.id === 'chomp')?.zoneId).toBe('base-a');
  expect(s.resources.a?.power.rouge ?? 0).toBe(0);
});

it('Flame Chompers : sans Power Fury, elle reste au cimetière', () => {
  let s = cast(0);
  s = resolveTop(s);
  expect(s.pendingModeChoice ?? null).toBeNull();
  expect(s.cards.find((c) => c.id === 'chomp')?.zoneId).toBe('graveyard-a');
});
