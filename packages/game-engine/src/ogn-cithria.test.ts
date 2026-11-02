import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  noRunes,
  drain,
} from './origins-test-fixtures.js';
import { cithriaOfCloudfield, mobilize } from '../../game-data/src/index.js';

it('Cithria of Cloudfield : se buffe quand son propriétaire joue une autre unité', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [cithriaOfCloudfield];
  s.cards[0]!.definitionId = cithriaOfCloudfield.id;
  s.cards.push({
    id: 'second',
    definitionId: cithriaOfCloudfield.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 4, power: {} };
  s = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'spell',
    payment: noRunes,
  });
  expect(s.units.find((u) => u.id === 'spell')?.buffed).toBeUndefined();
  s = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'second',
    payment: noRunes,
  });
  s = drain(s);
  expect(s.units.find((u) => u.id === 'spell')?.buffed).toBe(true);
  expect(s.units.find((u) => u.id === 'second')?.buffed).toBeUndefined();
});
