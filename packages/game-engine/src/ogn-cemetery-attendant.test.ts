import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { getLegalActions } from './index.js';
import { cemeteryAttendant, mobilize } from '../../game-data/src/index.js';

it('Cemetery Attendant : à la mise en jeu, récupère une unité de son cimetière', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [cemeteryAttendant];
  s.cards[0]!.definitionId = cemeteryAttendant.id;
  s.resources.a = { energy: 3, power: { violet: 1 } };
  s.cards.push(
    {
      id: 'dead',
      definitionId: cemeteryAttendant.id,
      ownerId: 'a',
      zoneId: 'graveyard-a',
    },
    {
      id: 'old-spell',
      definitionId: mobilize.id,
      ownerId: 'a',
      zoneId: 'graveyard-a',
    },
  );
  const choices = getLegalActions(s, 'a').flatMap((a) =>
    a.type === 'play-unit' ? [a.returnSpellId] : [],
  );
  expect(new Set(choices)).toEqual(new Set(['dead']));
  s = resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'spell',
      returnSpellId: 'dead',
      payment: noRunes,
    }),
  );
  expect(s.cards.find((c) => c.id === 'dead')?.zoneId).toBe('hand-a');
});
