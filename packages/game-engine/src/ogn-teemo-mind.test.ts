import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { teemoMind, pakaaCub, stupefy } from '../../game-data/src/index.js';
import { startNextTurn } from './turn/progression.js';

function scenario() {
  const s = spellScenario(stupefy);
  s.unitDefinitions = [teemoMind, pakaaCub];
  s.units = [s.units[0]!, { ...s.units[1]!, zoneId: 'f', might: 9 }];
  s.cards = s.cards.filter((c) => c.zoneId !== 'deck-a');
  s.cards.push(
    { id: 'teemo', definitionId: teemoMind.id, ownerId: 'a', zoneId: 'hand-a' },
    { id: 'x0', definitionId: 'filler', ownerId: 'a', zoneId: 'deck-a' },
    { id: 'h1', definitionId: pakaaCub.id, ownerId: 'a', zoneId: 'deck-a' },
    { id: 'x1', definitionId: 'filler', ownerId: 'a', zoneId: 'deck-a' },
    { id: 'h2', definitionId: pakaaCub.id, ownerId: 'a', zoneId: 'deck-a' },
    { id: 'x2', definitionId: 'filler', ownerId: 'a', zoneId: 'deck-a' },
    { id: 'x3', definitionId: 'filler', ownerId: 'a', zoneId: 'deck-a' },
    { id: 'x4', definitionId: 'filler', ownerId: 'a', zoneId: 'deck-a' },
  );
  s.resources.a = { energy: 0, power: { bleu: 1 } };
  return s;
}

it('Teemo (Mind) : joué depuis Hidden, 1 dégât à un ennemi ici par carte Hidden parmi les 5 du dessus', () => {
  let s = step(scenario(), {
    type: 'hide-card',
    playerId: 'a',
    cardId: 'teemo',
    battlefieldId: 'f',
    payment: noRunes,
  });
  s = startNextTurn(startNextTurn(s).state).state;
  s = step(s, {
    type: 'play-unit',
    playerId: 'a',
    cardId: 'teemo',
    payment: noRunes,
  });
  while (s.stack && !s.pendingModeChoice) s = resolveTop(s);
  expect(s.pendingModeChoice?.modes).toEqual(['split:enemy=2']);
  const deck = s.cards.filter((c) => c.zoneId === 'deck-a').map((c) => c.id);
  expect(deck[0]).not.toBe('h1');
  s = step(s, { type: 'choose-mode', playerId: 'a', mode: 'split:enemy=2' });
  expect(s.units.find((u) => u.id === 'enemy')?.damage).toBe(2);
});
