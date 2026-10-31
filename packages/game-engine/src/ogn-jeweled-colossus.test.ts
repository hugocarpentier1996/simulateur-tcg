import { expect, it } from 'vitest';
import {
  spellScenario,
  step,
  resolveTop,
  noRunes,
} from './origins-test-fixtures.js';
import { jeweledColossus, mobilize } from '../../game-data/src/index.js';

it('Jeweled Colossus : Vision à la mise en jeu ; Shield', () => {
  let s = spellScenario(mobilize);
  s.unitDefinitions = [jeweledColossus];
  s.cards[0]!.definitionId = jeweledColossus.id;
  s.resources.a = { energy: 5, power: {} };
  s = resolveTop(
    step(s, {
      type: 'play-unit',
      playerId: 'a',
      cardId: 'spell',
      payment: noRunes,
    }),
  );
  expect(s.pendingVision).toMatchObject({ playerId: 'a', cardId: 'draw-a-0' });
  expect(jeweledColossus.shield).toBe(1);
});
