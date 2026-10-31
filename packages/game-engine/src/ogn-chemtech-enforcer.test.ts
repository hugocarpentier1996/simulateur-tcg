import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { chemtechEnforcer, mobilize } from '../../game-data/src/index.js';

it('Chemtech Enforcer : Assault 2 ; à la mise en jeu, défausse 1 carte choisie', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [chemtechEnforcer];
  s.cards[0]!.definitionId = chemtechEnforcer.id;
  s.resources.a = { energy: 2, power: {} };
  s.cards.push({ id: 'h0', definitionId: 'x', ownerId: 'a', zoneId: 'hand-a' });
  s = resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'spell',
      payment: noRunes,
    }),
  );
  expect(s.pendingDiscard).toMatchObject({
    playerId: 'a',
    remaining: 1,
    draw: 0,
  });
  s = step(s, { type: 'choose-discard', playerId: 'a', cardId: 'h0' });
  expect(s.cards.find((c) => c.id === 'h0')?.zoneId).toBe('graveyard-a');
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('deck-a');
  expect(chemtechEnforcer.assault).toBe(2);
});
