import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { whirlwind } from '../../game-data/src/index.js';

it('Whirlwind : en commençant par l’adversaire, chacun peut renvoyer une unité en main', () => {
  const s = spellScenario(whirlwind);
  s.resources.a = { energy: 3, power: { violet: 1 } };
  let after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  expect(after.pendingModeChoice).toMatchObject({
    ownerId: 'b',
    modes: ['skip', 'return-unit:ally', 'return-unit:enemy'],
  });
  after = step(after, {
    type: 'choose-mode',
    playerId: 'b',
    mode: 'return-unit:ally',
  });
  expect(after.pendingModeChoice).toMatchObject({
    ownerId: 'a',
    modes: ['skip', 'return-unit:enemy'],
  });
  after = step(after, { type: 'choose-mode', playerId: 'a', mode: 'skip' });
  expect(after.pendingModeChoice ?? null).toBeNull();
  expect(after.units.map((u) => u.id)).toEqual(['enemy']);
  expect(after.cards.find((c) => c.id === 'ally')?.zoneId).toBe('hand-a');
});
