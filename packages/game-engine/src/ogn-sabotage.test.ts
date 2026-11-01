import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { sabotage, pakaaCub, hextechRay } from '../../game-data/src/index.js';

it('Sabotage : choisit une carte non-unité de la main adverse, recyclée sous son deck', () => {
  const s = spellScenario(sabotage);
  s.spellDefinitions = [sabotage, hextechRay];
  s.unitDefinitions = [pakaaCub];
  s.cards.push(
    {
      id: 'b-spell',
      definitionId: hextechRay.id,
      ownerId: 'b',
      zoneId: 'hand-b',
    },
    { id: 'b-unit', definitionId: pakaaCub.id, ownerId: 'b', zoneId: 'hand-b' },
  );
  s.resources.a = { energy: 1, power: { orange: 1 } };
  let after = resolveTop(
    step(s, {
      type: 'cast-spell',
      playerId: 'a',
      cardId: 'spell',
      targetId: 'a',
      payment: noRunes,
    }),
  );
  expect(after.pendingModeChoice?.modes).toEqual(['recycle-opp:b-spell']);
  after = step(after, {
    type: 'choose-mode',
    playerId: 'a',
    mode: 'recycle-opp:b-spell',
  });
  expect(after.cards.at(-1)).toMatchObject({ id: 'b-spell', zoneId: 'deck-b' });
});
