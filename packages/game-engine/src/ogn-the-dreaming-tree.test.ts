import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  noRunes,
  drain,
} from './origins-test-fixtures.js';
import { theDreamingTree, callToGlory } from '../../game-data/src/index.js';

it('The Dreaming Tree : la première fois du tour qu’un sort choisit une unité alliée ici, pioche 1', () => {
  let s = spellScenario(callToGlory);
  s.battlefieldDefinitions = [theDreamingTree];
  s.battlefields[0]!.definitionId = theDreamingTree.id;
  s.spellDefinitions = [callToGlory];
  s.cards.push({
    id: 'glory-2',
    definitionId: callToGlory.id,
    ownerId: 'a',
    zoneId: 'hand-a',
  });
  s.resources.a = { energy: 6, power: {} };
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'spell',
    targetId: 'ally',
    payment: noRunes,
  });
  s = drain(s);
  expect(s.cards.find((c) => c.id === 'draw-a-0')?.zoneId).toBe('hand-a');
  // pioche et sort résolus
  s = step(s, {
    type: 'cast-spell',
    playerId: 'a',
    cardId: 'glory-2',
    targetId: 'ally',
    payment: noRunes,
  });
  expect(s.cards.find((c) => c.id === 'draw-a-1')?.zoneId).toBe('deck-a');
});
