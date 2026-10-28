import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import * as cards from '../../game-data/src/index.js';
it('Sai Scout joue sur champ vide ; Vision se termine avant le Showdown et la conquête', () => {
  expect(cards.saiScout).toBeDefined();
  let s = spellScenario(cards.mobilize);
  s.unitDefinitions = [cards.saiScout];
  s.cards[0]!.definitionId = cards.saiScout.id;
  s.units = s.units.filter((u) => u.zoneId !== 'g');
  s.battlefields[1]!.controllerId = null;
  s = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'spell',
    destinationId: 'g',
    payment: noRunes,
  });
  expect(s.resources.a!.energy).toBe(4);
  expect(s.showdown).toBeNull();
  s = resolveTop(s);
  expect(s.pendingVision).toBeTruthy();
  expect(s.players[0]!.score).toBe(0);
  s = step(s, { type: 'choose-vision', playerId: 'a', recycle: false });
  expect(s.showdown?.kind).toBe('open');
  expect(s.units.find((u) => u.id === 'spell')).toMatchObject({
    might: 5,
    ready: false,
  });
  s = step(s, { type: 'pass', playerId: 'a' });
  s = step(s, { type: 'pass', playerId: 'b' });
  expect(s.players[0]!.score).toBe(1);
});
