import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { immortalPhoenix, hextechRay } from '../../game-data/src/index.js';

it('Immortal Phoenix : quand un sort de son propriétaire tue une unité, payer 1 énergie + 1 Fury la joue du cimetière', () => {
  const s0 = spellScenario(hextechRay);
  s0.unitDefinitions = [immortalPhoenix];
  s0.cards.push({
    id: 'phoenix',
    definitionId: immortalPhoenix.id,
    ownerId: 'a',
    zoneId: 'graveyard-a',
  });
  s0.resources.a = { energy: 2, power: { rouge: 2 } };
  let s = resolveTop(
    step(s0, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'enemy',
      payment: noRunes,
    }),
  );
  expect(s.units.some((u) => u.id === 'enemy')).toBe(false);
  expect(s.stack?.entries.at(-1)).toMatchObject({
    kind: 'mode-choice',
    sourceId: 'phoenix',
  });
  s = resolveTop(s);
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'pay-play' });
  expect(s.units.find((u) => u.id === 'phoenix')?.zoneId).toBe('base-a');
  expect(immortalPhoenix.assault).toBe(2);
});
