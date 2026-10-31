import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import {
  spriteMother,
  spriteToken,
  mobilize,
} from '../../game-data/src/index.js';

it('Sprite Mother : joue ici un jeton Sprite 3 Ready et Temporary', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [spriteMother, spriteToken];
  s.cards[0]!.definitionId = spriteMother.id;
  s.resources.a = { energy: 4, power: { bleu: 1 } };
  s = resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'spell',
      destinationId: 'f',
      payment: noRunes,
    }),
  );
  const sprite = s.units.find((u) => u.definitionId === spriteToken.id);
  expect(sprite).toMatchObject({
    zoneId: 'f',
    might: 3,
    ready: true,
    temporary: true,
    token: true,
  });
});
