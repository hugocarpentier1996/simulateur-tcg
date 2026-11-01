import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { spriteCall, spriteToken } from '../../game-data/src/index.js';

it('Sprite Call : joue un jeton Sprite 3 Ready et Temporary', () => {
  const s = spellScenario(spriteCall);
  s.unitDefinitions = [spriteToken];
  s.resources.a = { energy: 3, power: {} };
  const after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      tokenDestinations: ['base-a'],
      payment: noRunes,
    }),
  );
  const sprite = after.units.find((u) => u.definitionId === spriteToken.id);
  expect(sprite).toMatchObject({
    zoneId: 'base-a',
    ready: true,
    might: 3,
    temporary: true,
  });
});
